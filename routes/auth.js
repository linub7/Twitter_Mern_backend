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
  updateProfilePhoto,
  updateCoverPhoto,
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/multer');

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

router
  .route('/auth/me/update-profile')
  .get(trimRequest.all, protect, getMe)
  .put(
    trimRequest.all,
    protect,
    uploadImage.single('profilePic'),
    updateProfilePhoto
  );

router
  .route('/auth/me/update-cover')
  .patch(
    trimRequest.all,
    protect,
    uploadImage.single('coverPhoto'),
    updateCoverPhoto
  );

module.exports = router;
