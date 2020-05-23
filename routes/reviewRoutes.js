const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

//merge the params when being routed from other paths
//so the path paramas are availab;e
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(authController.authenticate, reviewController.getAllReviews)
  .post(
    authController.authenticate,
    authController.authorizeTo('user'),
    reviewController.setTourIdAndValidateTour,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(reviewController.deleteReview)
  .patch(reviewController.updateReview);

module.exports = router;
