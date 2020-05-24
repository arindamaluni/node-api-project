const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewrouter = require('./reviewRoutes');

const router = express.Router();
// //Parameter middleware
// router.param('id', tourController.checkId(req, res, next, val)
// });
router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getTours);
router
  .route('/tours-within/:distance/centre/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
router
  .route('/')
  .get(tourController.getTours)
  .post(
    authController.authenticate,
    authController.authorizeTo('admin'),
    tourController.createTour
  );
router
  .route('/:id')
  .patch(
    authController.authenticate,
    authController.authorizeTo('admin'),
    tourController.updateTour
  )
  .delete(
    authController.authenticate,
    authController.authorizeTo('admin', 'lead-guide'),
    tourController.deleteTour
  )
  .get(tourController.getTour);
//Reviews should be handleed by reviewRouter hence redirect
router.use('/:tourId/reviews', reviewrouter);

module.exports = router;
