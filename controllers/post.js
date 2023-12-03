const { isValidObjectId } = require('mongoose');

const Post = require('../models/Post');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/async');

exports.createPost = asyncHandler(async (req, res, next) => {
  const {
    user,
    body: { content, replyTo },
  } = req;

  if (!content) return next(new AppError('Content is required!', 400));
  if (replyTo && !isValidObjectId(replyTo))
    return next(new AppError('Please enter a proper post!', 400));

  let payload = {
    content,
    postedBy: user?._id,
  };
  if (replyTo) {
    const existedReplyToPost = await Post.findById(replyTo);

    if (!existedReplyToPost) return next(new AppError('Post not found', 404));
    payload.replyTo = existedReplyToPost?._id;
  }

  const newPost = await Post.create(payload);

  let populatedPost;
  if (replyTo) {
    populatedPost = await Post.findById(newPost?._id).populate({
      path: 'replyTo',
    });
  }

  return res.json({
    status: 'success',
    data: { data: replyTo ? populatedPost : newPost },
  });
});

exports.getPosts = asyncHandler(async (req, res, next) => {
  const {
    user,
    query: { searchObj },
  } = req;

  const existedUser = await User.findById(user._id);
  console.log({ existedUser });

  if (searchObj?.isReply !== undefined) {
    const isReply = searchObj?.isReply === 'true';
    searchObj.replyTo = {
      $exists: isReply,
    };
    delete searchObj.isReply;
  }

  if (searchObj?.search !== undefined) {
    searchObj.content = { $regex: searchObj?.search, $options: 'i' };
    delete searchObj?.search;
  }

  if (searchObj?.followingOnly !== undefined) {
    const followingOnly = searchObj?.followingOnly === 'true';

    if (followingOnly) {
      const objectIds = [];

      if (!user?.following) {
        user.following = [];
      }

      user?.following?.forEach((user) => {
        objectIds.push(user);
      });

      objectIds?.push(user._id);

      searchObj.postedBy = {
        $in: objectIds,
      };
    }

    delete searchObj.followingOnly;
  }

  const results = await getPostsFn(searchObj);
  return res.json({
    status: 'success',
    data: { data: results },
  });
});

exports.getSinglePostAndReplies = asyncHandler(async (req, res, next) => {
  const {
    params: { id },
  } = req;

  const existedPost = await Post.findById(id);

  const relatedPosts = await Post.find({
    $or: [
      {
        replyTo: existedPost?._id,
      },
      {
        retweetData: existedPost?._id,
      },
    ],
  }).populate('retweetData');

  const posts = [existedPost, ...relatedPosts];

  res.json({
    status: 'success',
    data: { data: posts },
  });
});

exports.togglePostLike = asyncHandler(async (req, res, next) => {
  const {
    user,
    params: { id },
  } = req;

  const existedPost = await Post.findById(id);
  if (!existedPost) return next(new AppError('Post not found', 404));

  const isLiked = user?.likes?.includes(existedPost?._id);

  const option = isLiked ? '$pull' : '$addToSet';

  await User.findByIdAndUpdate(
    user?._id,
    {
      [option]: {
        // [] allows to insert variables
        likes: existedPost?._id,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  const updatedPost = await Post.findByIdAndUpdate(
    existedPost?._id,
    {
      [option]: {
        likes: user?.id,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  return res.json({ status: 'success', data: { data: updatedPost } });
});

exports.postRetweet = asyncHandler(async (req, res, next) => {
  const {
    user,
    params: { id },
  } = req;

  const existedPost = await Post.findById(id);
  if (!existedPost) return next(new AppError('Post not found', 404));

  // if already exists -> try un-retweet
  const deletedPost = await Post.findOneAndDelete({
    postedBy: user?._id,
    retweetData: existedPost?._id,
  });

  // determine that is already exists or not
  const option = deletedPost !== null ? '$pull' : '$addToSet';

  let rePost = deletedPost;

  // if rePost doesn't exist -> create a rePost
  if (rePost === null) {
    rePost = await Post.create({
      postedBy: user?._id,
      retweetData: existedPost?._id,
    });
  }

  // update retweets of current user
  await User.findByIdAndUpdate(
    user?._id,
    {
      [option]: {
        retweets: rePost?._id,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  // update retweetUsers of current post
  const post = await Post.findByIdAndUpdate(
    existedPost?._id,
    {
      [option]: {
        retweetUsers: user?._id,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate('retweetUsers', 'firstName lastName username');

  return res.json({
    status: 'success',
    data: { data: { post, rePost, option } },
  });
});

const getPostsFn = async (filter) => {
  try {
    const results = await Post.find(filter)
      .populate('postedBy')
      .populate('retweetData')
      .populate('replyTo')
      .sort({
        createdAt: -1,
      });
    results = await User.populate(results, {
      path: 'replyTo.postedBy',
    });
    return await User.populate(results, {
      path: 'retweetData.postedBy',
    });
  } catch (error) {
    (error) => console.log(error);
  }
};
