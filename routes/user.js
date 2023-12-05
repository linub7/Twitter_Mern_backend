const express = require('express');
const { isValidObjectId } = require('mongoose');
const trimRequest = require('trim-request');

const {
  getUser,
  toggleUserFollow,
  getUserFollowing,
  getUserFollowers,
} = require('../controllers/user');
const { protect } = require('../middleware/auth');
const AppError = require('../utils/AppError');

const router = express.Router();

router.param('id', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return next(new AppError('Please provide a valid id', 400));
  }
  next();
});

router.route('/users/:username').get(trimRequest.all, protect, getUser);

router
  .route('/users/:id/follow')
  .put(trimRequest.all, protect, toggleUserFollow);

router
  .route('/users/:username/following')
  .get(trimRequest.all, protect, getUserFollowing);
router
  .route('/users/:username/followers')
  .get(trimRequest.all, protect, getUserFollowers);

module.exports = router;
