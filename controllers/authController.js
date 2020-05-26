const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendMail = require('../utils/email');

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, res, includeUserData = false) => {
  const token = signToken(user._id);
  //Send jwt cookie
  const cookieOptons = {
    //     expires: new Date(Number(new Date()) + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    maxAge: process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    httpOnly: true,
  };
  //Add HTTPS only mode in production
  if (process.env.NODE_ENV === 'production') cookieOptons.secure = true;
  res.cookie('jwt', token, cookieOptons);
  const jsonResponse = {
    status: 'success',
    token,
  };
  if (includeUserData) {
    jsonResponse.user = user;
    user.password = undefined;
  }
  res.status(statusCode).json(jsonResponse);
};

exports.signup = catchAsync(async (req, res, next) => {
  const userData = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role, //This needs to be checked
  };
  console.log(userData);
  const user = await User.create(userData);
  createAndSendToken(user, 201, res, true);
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
  createAndSendToken(user, 200, res);
  //Next(should never be invoked after the response as the call will handle to global errorhandling middleware then)
  //next();
});

exports.authenticate = catchAsync(async (req, res, next) => {
  //Get the token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  //console.log(token);
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
  //console.log(decodedJWTPayload);
  //Check if the user still exists in the system
  const currentUser = await User.findById(decodedJWTPayload.id).select(
    '+password'
  );

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

//closure for Middleware handler to take parameter input
exports.authorizeTo = (...roles) => {
  return (req, res, next) => {
    //if the current user role is not includded in the permitted roles, reject
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Unauthorized access', 401));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //Get user based on the email posted
  const { email } = req.body;
  if (!email) {
    return next(new AppError(`No email provided`, 400));
  }
  const user = await User.findOne({ email: email });
  if (!user) {
    return next(new AppError(`No user with emai:${email}`, 401));
  }

  //Generate random token and save the token has in DB along with expiry
  const resetToken = user.createPasswordResetToken();
  const savedUSer = await user.save({ validateBeforeSave: false });

  //Send the token to the useers email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message =
    `Forgot your password? an email has been sent with the reset link ${resetURL}. ` +
    'Submit a PATCH request with the link providing password and confirmPassword';

  try {
    await sendMail({
      email: user.email,
      subject: 'Password reset link (valid for 10 minutes)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message:
        'An email is sent to your email with the token for the password reset',
    });
  } catch (err) {
    console.log(err);
    //Reset tokens in DB
    user.passowrdResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Error sending email. Try after some time', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const currentUser = await User.findOne({
    passowrdResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!currentUser) {
    return next(
      new AppError('Invalid or expired token. Try resetting again', 401)
    );
  }
  //if the token is not expired and there is a user set the new password
  currentUser.password = req.body.password;
  currentUser.passwordConfirm = req.body.passwordConfirm;
  currentUser.passowrdResetToken = undefined;
  currentUser.passwordResetExpires = undefined;

  const user = await currentUser.save(currentUser);
  //update changedPasswordAt property for the user
  //done through middleware
  //log the user in send JWT

  createAndSendToken(user, 200, res);
});

//Update password for loggged in user
exports.updatePassword = catchAsync(async (req, res, next) => {
  //Get user from collection
  const { user } = req;
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  console.log(user);

  //check if POSTed current password is correct
  if (!user || !(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError(`Invalid User or Current Password.`, 401));
  }
  //If correct change and update password
  user.password = newPassword;
  user.passwordConfirm = confirmNewPassword;
  const updatedUser = await user.save();
  //Send token to user
  createAndSendToken(user, 200, res);
});
