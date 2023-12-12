const express = require('express');
const trimRequest = require('trim-request');
const { isValidObjectId } = require('mongoose');

const {
  getNotifications,
  updateNotification,
  markAsOpenedAllNotification,
  getNotificationCounts,
} = require('../controllers/notification');
const { protect } = require('../middleware/auth');
const AppError = require('../utils/AppError');

const router = express.Router();

router.param('id', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return next(new AppError('Please provide a valid id', 400));
  }
  next();
});

router.route('/notifications').get(trimRequest.all, protect, getNotifications);
router
  .route('/notifications/opened-all')
  .put(trimRequest.all, protect, markAsOpenedAllNotification);
router
  .route('/notifications/count')
  .get(trimRequest.all, protect, getNotificationCounts);

router
  .route('/notifications/:id')
  .put(trimRequest.all, protect, updateNotification);

module.exports = router;
