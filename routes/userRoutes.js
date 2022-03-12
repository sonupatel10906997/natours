const express = require('express');

const userController = require('./../controllers/userControllers');
const authController = require('../controllers/authController');
const { route } = require('express/lib/application');

const router = express.Router();

router.post('/signUp', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgetPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//all routes after this line is protected,
//no need to add protect at each routes manually, we can direclty use this as middle ware
router.use(authController.protect);

router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword
);
router.get(
  '/me',
  //authController.protect,
  userController.getMe,
  userController.getUser
);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
