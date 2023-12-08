const express = require('express');
const { isValidObjectId } = require('mongoose');
const trimRequest = require('trim-request');

const { createChat, getChats } = require('../controllers/chat');
const { protect } = require('../middleware/auth');
const AppError = require('../utils/AppError');

const router = express.Router();

router.param('id', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return next(new AppError('Please provide a valid id', 400));
  }
  next();
});

router
  .route('/chats')
  .post(trimRequest.all, protect, createChat)
  .get(trimRequest.all, protect, getChats);

module.exports = router;
