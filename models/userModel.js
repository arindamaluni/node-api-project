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
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Password is mandatory'],
    minlength: 8,
    select: false,
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
    select: false,
  },
  passwordChangedAt: Date,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified()) next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  console.log(this);
  next();
});

//This method is available in all the user documents returned from the Model
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
//The method is to check if the password is changed after the JWT token is issued
userSchema.methods.isPasswordChangedAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimeStamp, JWTTimeStamp);
    return JWTTimeStamp < changedTimeStamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
