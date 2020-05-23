const Review = require('../models/reviewModel');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const factory = require('./handlerFactory');

exports.setTourIdAndValidateTour = catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  req.body.user = req.user._id;
  const tourIsValid = await Tour.exists({ _id: req.body.tour });
  if (!tourIsValid) {
    return next(new AppError(`Invalid tour id:${req.params.tourId}`, 401));
  }
  next();
});

exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.createReview = factory.createOne(Review);
exports.getReview = factory.getOne(Review);
exports.getAllReviews = factory.getAll(Review);
