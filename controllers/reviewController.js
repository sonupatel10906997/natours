const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  //allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
// exports.createReview = catchAsync(async (req, res, next) => {
//   //allow nested routes
//   if (!req.body.tour) req.body.tour = req.params.tourId;
//   if (!req.body.user) req.body.user = req.user.id;
//   const newReview = await Review.create({
//     review: req.body.review,
//     rating: req.body.rating,
//     tour: req.body.tour,
//     user: req.body.user,
//   });

//   res.status(200).json({
//     status: 'success',
//     data: {
//       review: newReview,
//     },
//   });
// });

exports.getAllReview = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };
  review = await Review.find(filter).select('-__v');

  res.status(200).json({
    status: 'success',
    count: review.length,
    data: {
      review,
    },
  });
});

exports.getAllReview = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
