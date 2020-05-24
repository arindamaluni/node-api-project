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

//'/tours-within/:distance/centre/:latlng/unit/:unit'
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  if (!distance || !unit)
    return new AppError('distance or unit is not specified', 401);
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    return next(
      new AppError(
        'lattitude or longitude not specified. its a comma seperated set e.g -40.45674,30.64321',
        401
      )
    );
  }
  //calculae distance in radians based on unit
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  console.log(lat, lng, distance, unit);
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res
    .status(200)
    .json({ status: 'success', count: tours.length, data: { tours } });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  let { latlng, unit } = req.params;
  unit = !unit ? 'mi' : unit;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    return next(
      new AppError(
        'lattitude or longitude not specified. its a comma seperated set e.g -40.45674,30.64321',
        401
      )
    );
  }
  const distMultiplier = unit === 'mi' ? 0.000621371 : 0.001;
  const distances = await Tour.aggregate([
    //This need to be first in the pipelinr for any Geospatial aggregation
    //At least one geospatial indexed field is required
    //if there are multiple keys parameter must be specified
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng * 1, lat * 1] },
        distanceField: 'distance',
        distanceMultiplier: distMultiplier,
      },
    },
    {
      $project: { distance: 1, name: 1 },
    },
  ]);
  res
    .status(200)
    .json({ status: 'success', count: distances.length, data: { distances } });
});
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
