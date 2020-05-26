const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/AppError');
const globalErrorHandar = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

//MIDDLEWARES
//Security middleware helmet
app.use(helmet());
//A middleware that is convering the body objects to Json and vice versa
app.use(express.json({ limit: '50kb' }));
//Parse cookie from the request
app.use(cookieParser());
//Custom Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});
//Mongo sannitizer: removes $ and other charatcers with special query character operators
app.use(mongoSanitize());
//Middleware for cross site scripting: removal of malicious html tag based contents in data
app.use(xss());
//Parameter pollution. Cleans up the query parameter with duplicate fields e.g sort=duration&sort=price.
//Whitelist skips the fields from deduplication
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);
//Express rate limiter
const noOfAPICalls = 2000;
const rateLimiter = rateLimit({
  max: noOfAPICalls,
  windowMs: 1000 * 60 * 60, //1 Hr window
  message: `Too many requests. Limit ${noOfAPICalls} calls in 1 hr`,
});
app.use('/api', rateLimiter);
//Thirdparty Middleware for logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//VIEW ENGINE SETTINGS
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//make the public directory avl for serving static file
app.use(express.static(path.join(__dirname, 'public')));
//Routes
//templated site pages
app.use('/', viewRouter);

//API routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//Handle  all undefined URL
app.all('*', (req, res, next) => {
  // // We can send a direct response
  // res.status(400).json({
  //   status: 'fail',
  //   message: `Method '${req.method}' or Resource '${req.originalUrl}' unsupported`,
  // });

  // //We can throw and Error object
  // const err = new Error(
  //   `Method '${req.method}' or Resource '${req.originalUrl}' unsupported`
  // );
  // err.status = 'fail';
  // err.statusCode = 404;

  // //Or we can construct a custom Error object
  const err = new AppError(
    `Method '${req.method}' or Resource '${req.originalUrl}' unsupported`,
    404
  );
  //passing parameter in next() assumes that an error is being passed and is delivered to the error handling middleware
  next(err);
});

//Error handling middleware
app.use(globalErrorHandar);

module.exports = app;
