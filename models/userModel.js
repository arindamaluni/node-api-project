const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User must have a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'User must have an email id'],
    lowercase: true,
    unique: true,
    trim: true,
    validate: [validator.isEmail, 'email must be valid'],
  },
  photo: String, //Name of the folder path
  password: {
    type: String,
    required: [true, 'Password is mandatory'],
    minlength: 8,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Confirm your password'],
    minlength: 8,
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
