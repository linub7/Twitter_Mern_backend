const express = require('express');
const {
  signup,
  signin,
  forgotPassword,
  resetPassword,
  updatePassword,
  signoutUser,
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/auth/forgot-password', forgotPassword);
router.patch('/auth/reset-password/:token', resetPassword);
router.patch('/auth/update-my-password', protect, updatePassword);

router.post('/auth/signup', signup);
router.post('/auth/signin', signin);
router.get('/auth/signout', protect, signoutUser);

module.exports = router;
