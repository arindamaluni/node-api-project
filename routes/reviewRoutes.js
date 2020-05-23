const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

//merge the params when being routed from other paths
//so the path paramas are availab;e
const router = express.Router({ mergeParams: true });

//Add Authenticate to all the routers underneath it
router.use(authController.authenticate);
////////////AUTHENTICATED ROUTERS//////////////////////////
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.authorizeTo('user'),
    reviewController.setTourIdAndValidateTour,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(
    authController.authorizeTo('admin', 'user'),
    reviewController.deleteReview
  )
  .patch(
    authController.authorizeTo('admin', 'user'),
    reviewController.updateReview
  );
////////////AUTHENTICATED ROUTERS//////////////////////////

module.exports = router;
