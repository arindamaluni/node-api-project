const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/updatePassword',
  authController.authenticate,
  authController.updatePassword
);
router.patch(
  '/updateMyDetails',
  authController.authenticate,
  userController.updateMyDetails
);
router.delete(
  '/deregister',
  authController.authenticate,
  userController.deregisterSelf
);
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.checkPasswordUpdate, userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
