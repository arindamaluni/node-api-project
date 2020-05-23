const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: '../../config.env' });

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
  })
  .catch((err) => {
    console.log(`Error connecting. Errore: ${err.message}`);
  });

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

const importData = async () => {
  try {
    const savedTours = await Tour.create(tours);
    const savedUsers = await User.create(users, { validateBeforeSave: false });
    const savedReviews = await Review.create(reviews);
    console.log(`Saved Tours :  ${savedTours}`);
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const clearData = async () => {
  try {
    const deletedTours = await Tour.deleteMany();
    const deletedUsers = await User.deleteMany();
    const deletedReviews = await Review.deleteMany();
    console.log(`Deleted All collection`);
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  clearData();
} else {
  process.exit();
}
