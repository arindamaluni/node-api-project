const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

//Run the authController Middleware to check if there is a jwt token
//and make the user object accessible in res.locals
router.use(authController.isLoggedIn);

router.get('/', viewsController.getOverview);
router.get('/tour/:slug', viewsController.getTourDetails);
router.get('/login', viewsController.getLoginForm);

module.exports = router;
