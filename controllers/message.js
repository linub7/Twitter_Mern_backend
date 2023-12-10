const { isValidObjectId } = require('mongoose');

const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/async');

exports.sendMessage = asyncHandler(async (req, res, next) => {
  const {
    user,
    body: { content, chatId },
  } = req;

  if (!content || content?.trim() === '' || !isValidObjectId(chatId))
    return next(new AppError('Please enter content and proper chat', 400));

  const isChatExisted = await Chat.findOne({
    _id: chatId,
    users: { $elemMatch: { $eq: user?._id } },
  });
  if (!isChatExisted) return next(new AppError('Chat not found', 400));

  const newMessage = await Message.create({
    sender: user?._id,
    content,
    chat: isChatExisted?._id,
  });

  isChatExisted.latestMessage = newMessage?._id;

  await isChatExisted.save({ validateBeforeSave: false });

  return res.json({
    status: 'success',
    data: { data: newMessage },
  });
});

exports.getMessages = asyncHandler(async (req, res, next) => {
  const {
    user,
    params: { id: chatId },
  } = req;

  const isMeAllowedToGetThisChatMessages = await Chat.findOne({
    _id: chatId,
    users: { $elemMatch: { $eq: user._id } },
  });

  if (!isMeAllowedToGetThisChatMessages)
    return next(
      new AppError('You can not read this conversation messages!', 403)
    );

  const conversationMessages = await Message.find({
    chat: chatId,
  });

  return res.json({
    status: 'success',
    data: { data: conversationMessages },
  });
});
