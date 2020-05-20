const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
    validate: {
      //This only works for CREATE or SAVE and not findAndUpdate
      validator: function (el) {
        return el === this.password;
      },
      message: "Password don't match with the confirmation password",
    },
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified()) next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  console.log(this);
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
