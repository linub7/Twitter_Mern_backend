const express = require('express');
const trimRequest = require('trim-request');

const {
  signup,
  signin,
  forgotPassword,
  resetPassword,
  updatePassword,
  signoutUser,
  getMe,
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/auth/forgot-password', trimRequest.all, forgotPassword);
router.patch('/auth/reset-password/:token', trimRequest.all, resetPassword);
router.patch(
  '/auth/update-my-password',
  trimRequest.all,
  protect,
  updatePassword
);

router.post('/auth/signup', trimRequest.all, signup);
router.post('/auth/signin', trimRequest.all, signin);
router.get('/auth/signout', trimRequest.all, signoutUser);
router.get('/auth/me', trimRequest.all, protect, getMe);

module.exports = router;
