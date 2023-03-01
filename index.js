const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User')
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');
/* Loading the environment variables from the .env file. */ 
// updating this file
require("dotenv").config();

const uploadMiddleware = multer({ dest: 'uploads/' })

var salt = bcrypt.genSaltSync(10);
const secret = 'bkhjdbfcknj2e2kenfdsjh87er234r73bwdhs7';

app.use(cors({
    credentials: true, 
    origin: 'https://top-backend.onrender.com',
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
}));
// app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
//  })

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

const PORT = 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/top";

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true })
  .then(() => {
    app.listen(PORT, console.log("Server stated on port 4000"));
  })
  .catch((err) => {
    console.log(err);
  });

// mongoose.connect('mongodb+srv://basant:slrM8uRMOzinNP7e@top-blog-v4.pd5bols.mongodb.net/?retryWrites=true&w=majority');
mongoose.set('strictQuery', true);

app.get('/hello', (_, res) => res.send('Hello this server is running!!'));

app.post('/register',async (req, res) => {
    const {name, email, password} = req.body;
    try{
        const userDoc = await User.create({
            name, 
            email, 
            password: bcrypt.hashSync(password, salt)});
        res.json(userDoc);
    } catch(e) {
        res.status(400).json(e);
    }
    // const {name, email, password} = req.body;
    // const userDoc = await User.create({name, email, password});
    // res.json(userDoc);
});

app.post('/login', async (req, res) => {
    const {email, password} = req.body;
    const userDoc = await User.findOne({email})
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if(passOk) {
        //logged in
        jwt.sign({email, id:userDoc._id}, secret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).json({
                id: userDoc._id,
                email,
            });
        });
    } else {
        res.status(400).json('wrong creds');
    }
});

app.get('/profile', (req, res) => {
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, (err, info) => {
        if (err) throw err;
        res.json(info);
    });
    // res.json(req.cookies);
});


app.post('/logout', (req, res) => {
    res.cookie('token', '').json('Ok');
});


app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
    const {originalname, path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path+'.'+ext;
    fs.renameSync(path, newPath);

    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const {title, summary, content} = req.body;
        const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: newPath,
        author: info.id,
        });
        res.json(postDoc);
    });
    // res.json({files:req.file})
});

//=======================To edit post
app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
    let newPath = null;
    if(req.file) {
        const {originalname, path} = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        newPath = path+'.'+ext;
        fs.renameSync(path, newPath);
    }

    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const {id, title, summary, content} = req.body;
        const postDoc = await Post.findById(id);
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        // res.json({isAuthor, postDoc, info});
        if (!isAuthor) {
            return res.status(400).json('You are not author');
        }

        await postDoc.update({
            title,
            summary,
            content,
            cover: newPath ? newPath : postDoc.cover,
        });
        res.json(postDoc);
    });
});


app.get("/", (req, res) => {
    res.send("Hello World!");
  });
  
//=========================To get posts

app.get('/post', async (req, res) => {
    res.json(
        await Post.find()
        .populate('author', ['name'])
        .sort({createdAt: -1})
        .limit(20)
    );
});

app.get('/post/:id', async (req, res) => {
    // res.json(req.params);
    const {id} =req.params;
    const postDoc = await Post.findById(id).populate('author', ['name']);
    res.json(postDoc);
});

app.listen(4000);

//mongodb+srv://basant:<password>@top-blog-v3.3tcehcl.mongodb.net/?retryWrites=true&w=majority
//mongodb+srv://basant:<password>@top-blog-v4.pd5bols.mongodb.net/?retryWrites=true&w=majority