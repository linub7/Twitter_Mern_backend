const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const Post = require('../models/Post');
const AppError = require('../utils/AppError');

exports.getUser = asyncHandler(async (req, res, next) => {
  const {
    params: { username },
    query: { replyToMode },
  } = req;

  const user = await User.findOne({ username })
    .populate('likes', 'content postedBy')
    .populate('retweets', 'content postedBy')
    .populate('following', 'firstName lastName email username profilePic')
    .populate('followers', 'firstName lastName email username profilePic');

  if (!user) return next(new AppError('User not found!', 404));

  const allPosts = await Post.find({ postedBy: user?._id }).sort('-updatedAt');

  let posts = [];
  let replyPosts = [];

  for (const item of allPosts) {
    const isExistedRetweet = await Post.findById(item?.retweetData);
    if (!isExistedRetweet) return;
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
