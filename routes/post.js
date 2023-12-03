const express = require('express');
const trimRequest = require('trim-request');
const { isValidObjectId } = require('mongoose');

const {
  createPost,
  getPosts,
  deletePost,
  togglePostLike,
  postRetweet,
  getSinglePostAndReplies,
} = require('../controllers/post');
const { protect } = require('../middleware/auth');
const AppError = require('../utils/AppError');
const {
  getAll,
  getSingleOne,
  deleteOne,
} = require('../controllers/handleFactory');
const Post = require('../models/Post');

const router = express.Router();

router.param('id', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return next(new AppError('Please provide a valid id', 400));
  }
  next();
});

router
  .route('/posts/:id')
  .get(trimRequest.all, protect, getSinglePostAndReplies)
  .delete(trimRequest.all, protect, deletePost);

router.route('/posts/:id/like').put(trimRequest.all, protect, togglePostLike);
router.route('/posts/:id/retweet').put(trimRequest.all, protect, postRetweet);

router
  .route('/posts')
  .post(trimRequest.all, protect, createPost)
  .get(trimRequest.all, protect, getAll(Post, { path: 'retweetData' }));

module.exports = router;
