const mongoose = require('mongoose');

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
    if (!mongoose.isValidObjectId(el))
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
    .sort('-updatedAt');

  return res.json({
    status: 'success',
    data: { data: existedChats },
  });
});

exports.getChat = asyncHandler(async (req, res, next) => {
  const {
    params: { id },
    user,
  } = req;

  const existedChat = await Chat.findOne({
    _id: id,
    users: { $elemMatch: { $eq: user?._id } },
  }).populate('users', 'firstName lastName username profilePic');

  if (!existedChat) return next(new AppError('Chat not found', 404));

  return res.json({ status: 'success', data: { data: existedChat } });
});

exports.getChatByUserId = asyncHandler(async (req, res, next) => {
  const {
    user,
    params: { id },
  } = req;
  if (id?.toString() === user?._id?.toString())
    return next(new AppError('OOPS! try with another userId', 400));
  /**
   * get chat using the userId, we want to be able to access chat using userIds
   * there' gonna be one chat between you and another user, which isn't a group chat
   * so no other people can be part of it, it's gonna be like the default chat between
   * you and another person, so when you go to the profile page, and you click on icon message
   * this is the chat is gonna take you to, this is not a group chat, it would take you to
   * the chat with you and one of the person so thi is not a chat that you've created yourself
   */

  const existedUser = await User.findById(id);
  if (!existedUser) return next(new AppError('user not found', 404));

  /**
   * the reason we're gonna user findOneAndUpdate is because if this does'nt exist already,
   * we're gonna create it, 2 users should always have a chat, which is not a group chat, which is
   * their default chat and that would be the one that you access when you o to the profile page
   * and you click on message button in the user profile page, so oqf course we're gonna create on chat
   * per pair of users, for every pair of users in the database, what we do then is just create these chats
   * and when the user wants them, so if you never wanna chat with the person one on one, you'll never have
   * this kind of database -> below findOneAndUpdate: check query -> if conditions didn't met -> create it
   */
  const existedChat = await Chat.findOneAndUpdate(
    // filtering data while the group is false and users array contain only 2 users with these member condition
    {
      isGroupChat: false,
      users: {
        $size: 2, // make sure the sizes of array is equal to 2
        $all: [
          // users array is exactly equal to these conditions
          { $elemMatch: { $eq: new mongoose.Types.ObjectId(user?._id) } }, // without mongoose.Types.ObjectId it create a chat with every single time
          {
            $elemMatch: { $eq: new mongoose.Types.ObjectId(existedUser?._id) },
          }, // without mongoose.Types.ObjectId it create a chat with every single time
        ],
      },
    }, // these conditions returns a chat if it exists
    {
      // the only thing we're gonna put in here is the data we're gonna add
      // when we are creating this, if we don't find anything with this query above
      // then added  -> if we did't find one and we're gonna actually create one, make sure you
      // set the users field the following array of just 2 items
      $setOnInsert: {
        users: [user?._id, existedUser?._id], // users will set it to an array
      },
    },
    {
      new: true,
      upsert: true, // if you did'nt find it -> create it with $setOnInsert condition
    }
  ).populate('users', 'firstName lastName username profilePic');

  return res.json({
    status: 'success',
    data: { data: existedChat },
  });
});

exports.updateChat = asyncHandler(async (req, res, next) => {
  const {
    user,
    body: { chatName },
    params: { id },
  } = req;

  if (!chatName || chatName?.trim() === '' || chatName?.length < 2)
    return next(new AppError('Please enter chat name', 400));

  const updatedChat = await Chat.findOneAndUpdate(
    {
      _id: id,
      users: { $elemMatch: { $eq: user?._id } },
    },
    {
      chatName,
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate('users');
  if (!updatedChat) return next(new AppError('Chat not found', 404));

  return res.json({
    status: 'success',
    data: { data: updatedChat },
  });
});
