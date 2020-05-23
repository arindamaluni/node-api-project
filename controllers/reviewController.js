const Review = require('../models/reviewModel');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const factory = require('./handlerFactory');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  //If gettting redirected from tourRouter for all reviews under a given tour
  //Add the filter for tour
  if (req.params.tourId) req.query.tour = req.params.tourId;
  const features = new APIFeatures(Review.find(), req.query)
    .filter()
    .sort()
    .paginate()
    .limitFields();
  //EXECUTE QUERY
  const reviews = await features.query;
  //SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews },
  });
});

exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(
      new AppError('No Review found for the provided identifier', 404)
    );
  }
  res.status(200).json({
    status: 'success',
    data: { review },
  });
});

exports.setTourIdAndValidateTour = catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  req.body.user = req.user._id;
  const tourIsValid = await Tour.exists({ _id: req.body.tour });
  if (!tourIsValid) {
    return next(
      new AppError(
        'Tour against which the review is getting created does not exist',
        401
      )
    );
  }
  next();
});

exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.createReview = factory.createOne(Review);
