const crypto = require('crypto');
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
  passowrdResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre('save', async function (next) {
  //Only run if the password is modified
  //Hack - while saving the password reset Token the password regeneration needs to be skipped
  if (!this.isModified('password')) next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  //Dont set this property for new user creation
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000; //1000 subtracted to back date the time for issee with JSW token timestam
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

//The method for creating password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passowrdResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  console.log({ resetToken }, this.passowrdResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 100; //10 minutes exp hardcoded
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
