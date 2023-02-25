const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const UserSchema = new Schema({
    name: {
        type: String, 
        required: true, 
        min: 6, 
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
          validator: function(v) {
            return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
          },
          message: props => `${props.value} is not a valid email address!`
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 4
    },
});

const UserModel = model('User', UserSchema);

module.exports = UserModel;