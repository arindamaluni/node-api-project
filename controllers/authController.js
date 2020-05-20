const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const userData = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  };
  console.log(userData);
  const user = await User.create(userData);
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
    data: { user },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Email or Password missing', 400));
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(`Invalid user or Password. email:${email}`, 401));
  }
  const token = signToken(user._id);
  res.status(200).json({ status: 'succcess', token });
  next();
});

exports.authorize = catchAsync(async (req, res, next) => {
  //Get the token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  console.log(token);
  if (!token) {
    return next(
      new AppError('Not logged in. Log in to get a valid token', 401)
    );
  }
  //Verify token
  //Promisify a callback method and await for the result without blocking
  const decodedJWTPayload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  console.log(decodedJWTPayload);
  //Check if the user still exists in the system
  const currentUser = await User.findById(decodedJWTPayload.id);
  if (!currentUser)
    return next(
      new AppError(
        'The user belonging to the token supplied does not exist',
        401
      )
    );

  //Check if user has changed password afetr the JWT was issued
  if (currentUser.isPasswordChangedAfter(decodedJWTPayload.iat)) {
    return next(
      new AppError(
        'Password changed after the token was issued. Relogin required',
        401
      )
    );
  }

  //Provide access to the authenticated user. Pass the user to next middleware
  req.user = currentUser;
  next();
});
