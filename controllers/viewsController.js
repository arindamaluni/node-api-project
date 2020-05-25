const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');

exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();
  res.status(200).render('overview', { tours: tours });
});

exports.getTourDetails = (req, res) => {
  res.status(200).render('tour', { title: 'The Forest Hiker' });
};
