const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/AppError');
const globalErrorHandar = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//MIDDLEWARES
//A middleware that is convering the body objects to Json and vice versa
app.use(express.json());
//This is for demonstartion purpose
app.use(express.static(`${__dirname}/public`));
//Custom Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
//Thirdparty Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

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
