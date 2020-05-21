const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

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
  .route('/')
  .get(authController.authenticate, tourController.getTours)
  .post(tourController.addTour);
router
  .route('/:id')
  .patch(tourController.updateTour)
  .delete(
    authController.authenticate,
    authController.authorizeTo('admin', 'lead-guide'),
    tourController.deleteTour
  )
  .get(tourController.getTour);

module.exports = router;
