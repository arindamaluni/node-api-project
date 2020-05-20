//Set up config before getting the app ref so morgan logging is optinally introduced
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: `${__dirname}/config.env` });
const app = require('./app');

//Handle all unhandled exceptions
process.on('uncaughtException', (err) => {
  console.log('Unhandled Exceptions....Shutting Down server....');
  console.log(err);

  process.exit(1);
});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to db');
  });

// console.log('/////////env');
// console.log(process.env);
// console.log('/////////env');
// console.log(app.get('env'));

//Server
const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log('Listening................');
});

//Handle all unhandled rejections from Promises
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejections....Shutting Down server....');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
