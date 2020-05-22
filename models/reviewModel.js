const mongoose = require('mongoose');

//review, rating, createdAt, tour, User
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review Can not be empty'],
      maxlength: 1000,
    },
    rating: { type: Number, max: 5, min: 1 },
    createdAt: { type: Date, default: Date.now(), select: false },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review Must be about a specific tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to some user and can not be empty'],
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//Populate the Ref fields
reviewSchema.pre(/^find/, function (next) {
  //this refers to the current query
  this.populate({
    path: 'tour',
    select: 'name email',
  }).populate({
    path: 'user',
    select: 'name ratingsAverage ratingsQuantity images summary',
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
