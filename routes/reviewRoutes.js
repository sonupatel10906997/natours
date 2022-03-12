const express = require('express');

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
const Review = require('../models/reviewModel');

const router = express.Router({ mergeParams: true });

//mergeParams gets the params from earlier mounts
// POST /tour/24243234/reviews
// GET /tour/2424242/reviews
router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReview)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
