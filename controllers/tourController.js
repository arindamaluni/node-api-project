const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const factory = require('./handlerFactory');

//Middleware to inject query parameteers for filtering
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name, price, ratingsAverage,summary,difficulty';
  next();
};

exports.getTour = factory.getOne(Tour, { path: 'reviews', select: '-__v' });
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
exports.createTour = factory.createOne(Tour);
exports.getTours = factory.getAll(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // Hide the 'EASY' tours
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  res.status(201).json({ status: 'success', data: { stats } });
});
//Find Number of tours each month sort by maximum tours and month
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numOfTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numOfTourStarts: -1, month: 1 },
    },
  ]);
  res.status(201).json({ status: 'success', data: { plan } });
});
