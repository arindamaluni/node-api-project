const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const factory = require('./handlerFactory');

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

exports.deregisterSelf = catchAsync(async (req, res, next) => {
  //Get user after authentication. User obj avl in 'req'
  const user = await User.findByIdAndUpdate(req.user.id, { active: false });
  if (!user)
    return next(new AppError('Internal error. Try after sometime', 500));
  res.status(200).json({ status: 'success', data: null });
});
exports.getUser = (req, res) => {
  res.status(500).json({ status: 'error', message: 'Not Yet implemented' });
};
exports.createUser = (req, res) => {
  res.status(500).json({ status: 'error', message: 'Not Yet implemented' });
};
//Middleware to check if password change is attempted
exports.checkPasswordUpdate = (req, res, next) => {
  if (req.body.passowrd || req.body.passwordConfirm)
    return next(
      new AppError(
        'Password Update not allowed with this method. use /updatePassword',
        400
      )
    );
  next();
};
//updateOne cannot be used to update password as the underlying update calls findByIdAndUpdate.
//The password encryption and validation only works for create() and save()
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
