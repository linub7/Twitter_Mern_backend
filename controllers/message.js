const { isValidObjectId } = require('mongoose');

const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
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

  const populatedNewMessage = await Message.findById(newMessage?._id)
    .populate('sender', 'firstName lastName username profilePic')
    .populate({
      path: 'chat',
      populate: {
        path: 'users',
      },
    })
    .exec();

  isChatExisted.latestMessage = newMessage?._id;

  await isChatExisted.save({ validateBeforeSave: false });

  isChatExisted?.users?.forEach((el) => {
    if (el?.toString() === populatedNewMessage?.sender?._id?.toString()) return;
    Notification.insertNotification(
      el,
      populatedNewMessage?.sender?._id,
      'newMessage',
      populatedNewMessage?.chat?._id
    );
  });

  return res.json({
    status: 'success',
    data: { data: populatedNewMessage },
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
  })
    .populate('sender', 'firstName lastName username profilePic')
    .populate({
      path: 'chat',
      populate: {
        path: 'users',
      },
    })
    .exec();

  return res.json({
    status: 'success',
    data: { data: conversationMessages },
  });
});
