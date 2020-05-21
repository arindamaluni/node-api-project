const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  return res
    .status(200)
    .json({ status: 'success', results: users.length, users });
});

exports.updateMyDetails = catchAsync(async (req, res, next) => {
  //error if the use tries to update password here
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError('To change Password user /updatePassword link', 400)
    );
  }
  const { name, email } = req.body; //Only email and body can be changed
  console.log({ name, email });
  //Update user document
  //save() will not work here as it will trigger password validations and password creation
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    { new: true, runValidators: true }
  );
  if (!user) {
    return next(
      new AppError('Error Updating details. Try after some time', 500)
    );
  }
  user.passowrd = undefined;
  res.status(200).json({ status: 'success', user });
});
exports.getUser = (req, res) => {
  res.status(500).json({ status: 'error', message: 'Not Yet implemented' });
};
exports.createUser = (req, res) => {
  res.status(500).json({ status: 'error', message: 'Not Yet implemented' });
};
exports.updateUser = (req, res) => {
  res.status(500).json({ status: 'error', message: 'Not Yet implemented' });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({ status: 'error', message: 'Not Yet implemented' });
};
