const express = require('express');
const { isValidObjectId } = require('mongoose');
const trimRequest = require('trim-request');

const { sendMessage, getMessages } = require('../controllers/message');
const { protect } = require('../middleware/auth');
const AppError = require('../utils/AppError');

const router = express.Router();

router.param('id', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return next(new AppError('Please provide a valid id', 400));
  }
  next();
});

router.route('/messages').post(trimRequest.all, protect, sendMessage);

router.route('/messages/:id').get(trimRequest.all, protect, getMessages);

module.exports = router;
