const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  return res
    .status(200)
    .json({ status: 'success', results: users.length, users });
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
