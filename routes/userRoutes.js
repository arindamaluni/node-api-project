const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//Add Authenticate to all the routers underneath it
router.use(authController.authenticate);
////////////AUTHENTICATED ROUTERS//////////////////////////
router.patch('/updatePassword', authController.updatePassword);
router.patch('/updateMyDetails', userController.updateMyDetails);
router.delete('/deregister', userController.deregisterSelf);
//This need to be before /:id route
router.route('/me').get(userController.getMydetails, userController.getUser);
//Add admin Authorization to all the routers underneath
router.use(authController.authorizeTo('admin'));
////////////AUTHORIZED ROUTERS//////////////////////////
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.checkPasswordUpdate, userController.updateUser)
  .delete(userController.deleteUser);
////////////AUTHORIZED ROUTERS//////////////////////////
////////////AUTHENTICATED ROUTERS//////////////////////////

module.exports = router;
