const mongoose = require('mongoose');
const Tour = require('./tourModel');

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
    path: 'user',
    select: '__v',
  });
  //This is removed as Review is getting populated from Tour with virtual populate
  // .populate({
  //   path: 'user',
  //   select: '__v',
  // });
  next();
});
//Calculate avarage rating and noOfReviews updated on every new review creation
reviewSchema.statics.calcAverageRating = async function (tourId) {
  //For static methods 'this' gives refernce to Model
  //and not document and can be invoked directly on the model
  const stats = await this.aggregate([
    //match stage - refers the field 'tour' in schema and matches with the tourId passed
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 }, //Count number of rating per group
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  //stats retuns an array with the stats
  console.log(stats);
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating,
  });
};
//Use a middleware post saving a review to calculate the ratingsAverage and ratingCounts
//post middleware does not have access to next()
reviewSchema.post('save', function (next) {
  //This is not static method and 'this points to a review document'
  //this.constructor points to the creator, the Model that created the instance.
  //Hence can be used to invoke the static method
  this.constructor.calcAverageRating(this.tour);
  //next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
