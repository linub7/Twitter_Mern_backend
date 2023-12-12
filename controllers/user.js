const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');

exports.getUser = asyncHandler(async (req, res, next) => {
  const {
    params: { username },
    query: { replyToMode },
  } = req;

  const user = await User.findOne({ username }).select(
    '-likes -retweets -email -createdAt -updatedAt'
  );

  if (!user) return next(new AppError('User not found!', 404));

  const allPosts = await Post.find({ postedBy: user?._id }).sort('-updatedAt');

  let posts = [];
  let replyPosts = [];

  for (const item of allPosts) {
    if (item?.replyTo) {
      replyPosts.push(item);
    } else {
      posts.push(item);
    }
  }

  const result =
    replyToMode && replyToMode === 'true'
      ? { user, replyPosts }
      : { user, posts };

  return res.json({
    status: 'success',
    data: { data: result },
  });
});

exports.toggleUserFollow = asyncHandler(async (req, res, next) => {
  const {
    user,
    params: { id },
  } = req;

  const existedUser = await User.findById(id);

  if (!existedUser) return next(new AppError('User not found'));

  const isFollowing = existedUser?.followers?.includes(user?._id?.toString());

  const option = isFollowing ? '$pull' : '$addToSet';

  const updatedMe = await User.findByIdAndUpdate(
    user?._id,
    {
      [option]: {
        following: existedUser?._id,
      },
    },
    { new: true }
  );

  const updatedUser = await User.findByIdAndUpdate(
    existedUser?._id,
    {
      [option]: {
        followers: user?._id?.toString(),
      },
    },
    { new: true }
  );

  if (!isFollowing) {
    await Notification.insertNotification(
      existedUser?._id,
      updatedMe?._id,
      'follow',
      updatedMe?._id
    );
  }

  return res.json({
    status: 'success',
    data: { data: { user: updatedUser, option } },
  });
});

exports.getUserFollowing = asyncHandler(async (req, res, next) => {
  const {
    params: { username },
  } = req;

  const existedUser = await User.findOne({ username })
    .populate('following')
    .select('username following');
  if (!existedUser) return next(new AppError('User not found', 404));

  return res.json({
    status: 'success',
    data: { data: existedUser },
  });
});

exports.getUserFollowers = asyncHandler(async (req, res, next) => {
  const {
    params: { username },
  } = req;

  const existedUser = await User.findOne({ username })
    .populate('followers')
    .select('username followers');
  if (!existedUser) return next(new AppError('User not found', 404));
  return res.json({
    status: 'success',
    data: { data: existedUser },
  });
});

exports.searchUsers = asyncHandler(async (req, res, next) => {
  const {
    query: { name },
    user,
  } = req;

  if (!name.trim()) return next(new AppError('Invalid Request', 400));

  const result = await User.find({
    _id: { $ne: user.id },
    $or: [
      { firstName: { $regex: `.*${name}.*`, $options: 'i' } },
      { lastName: { $regex: `.*${name}.*`, $options: 'i' } },
      { username: { $regex: `.*${name}.*`, $options: 'i' } },
    ],
  }).select('firstName lastName username profilePic');

  return res.status(200).json({
    status: 'success',
    data: { data: result },
  });
});
