const { isValidObjectId } = require('mongoose');

const User = require('../models/User');
const Chat = require('../models/Chat');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/async');
const { removeDuplicateStrings } = require('../utils/helper');

exports.createChat = asyncHandler(async (req, res, next) => {
  const {
    user,
    body: { users },
  } = req;
  if (!users || users?.length < 1)
    return next(new AppError('Users must contain at least one member', 400));

  let tmpUsersArray = [];
  for (const el of users) {
    if (!isValidObjectId(el))
      return next(new AppError('Please enter valid users', 400));

    const isUserExist = await User.findById(el);
    if (!isUserExist)
      return next(new AppError('Please enter valid users', 400));

    tmpUsersArray.push(isUserExist?._id);
  }

  tmpUsersArray.push(user?._id);

  const uniqueUsersArray = removeDuplicateStrings(tmpUsersArray);

  const createdChat = await Chat.create({
    users: uniqueUsersArray,
    isGroupChat: true,
  });

  return res.json({
    status: 'success',
    data: { data: createdChat },
  });
});

exports.getChats = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const existedChats = await Chat.find({
    users: {
      $elemMatch: {
        $eq: user?._id,
      },
    },
  })
    .populate('users', 'firstName lastName username profilePic')
    .populate('latestMessage', 'sender content')
    .sort('-createdAt');

  return res.json({
    status: 'success',
    data: { data: existedChats },
  });
});
