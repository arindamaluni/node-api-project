const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(authController.authenticate, reviewController.getAllReviews)
  .post(authController.authenticate, reviewController.createReview);
router.route('/:id').get(reviewController.getReview);

module.exports = router;
