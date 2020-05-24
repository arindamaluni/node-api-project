const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
//const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A Tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, "Maximum allowed length for 'name' is 40"],
      minlength: [10, "Minimum number of characters for 'name' is 8"],
      // Validation using library
      // validate: {
      //   validator: validator.isAlpha,
      //   message: 'Name must be Alpha-Numeric',
      // },
    },
    slug: { type: String, required: false },
    duration: { type: Number, required: [true, 'Tour must have duration'] },
    maxGroupSize: {
      type: Number,
      required: [true, 'Tour must define maximum size of group'],
    },
    difficulty: {
      type: String,
      required: [true, 'Tour must define a difficulty level'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: "Enum values mus be ['easy', 'medium', 'difficult']",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Minimum allowed value is 1'],
      max: [5, 'Maximum allowed value is 5'],
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: {
      type: Number,
      required: [true, 'Price must be defined for a tour'],
    },
    priceDiscount: {
      type: Number,
      //Mongoose limitation - This does NOT work for update, only for create
      validate: {
        message: `Discount price:({VALUE}) can't be more than the price`,
        validator: function (val) {
          return val < this.price;
        },
      },
    },
    summary: { type: String, trim: true },
    description: { type: String, trim: true },
    images: [String],
    createdAt: { type: Date, default: Date.now(), select: false },
    startDates: [Date],
    secretTour: { type: Boolean, default: false },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        //GeoJSON
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
//Ceate an index on price(ascending order)
tourSchema.index({ slug: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
// Declare virtual properties in the schema
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
//Populate the Reviews with virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
// // DOCUMENT middleware. Runs BEFORE .save() and .create() and NOT createMany()
tourSchema.pre('save', function (next) {
  //Add a new field
  this.slug = slugify(this.name, { lower: true });
  next();
});
//Fetch Users and embed during saving - Creating first time
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
tourSchema.pre('save', function (next) {
  //Add a new field
  console.log(`Going to save document....\n Document: {${this}}`);
  next();
});

// // DOCUMENT middleware. Runs AFTER .save() and .create() and NOT createMany()
// tourSchema.post('save', function (doc, next) {
//   console.log(`Document saved....\n Document: {${doc}}`);
//   next();
// });

// Schema middleware - does NOT get invoked for .findOne()
tourSchema.pre('find', function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

//Schema middleware - Applied with regEx and applied to all query methods starting with find
tourSchema.pre(/^find/, function (next) {
  this.start = Date.now();
  this.find({ secretTour: { $ne: true } });
  next();
});

//Populate the Ref fields
tourSchema.pre(/^find/, function (next) {
  //this refers to the current query
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} miliseconds........`);
  next();
});

//Aggregate Middleware
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({
    $match: { secretTour: { $ne: true } },
  });
  console.log(this.pipeline());
  next();
});
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
