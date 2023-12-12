const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/async');

exports.getNotifications = asyncHandler(async (req, res, next) => {
  const {
    user,
    query: { unreadOnly },
  } = req;
  const searchObj = {
    userTo: user._id,
    notificationType: { $ne: 'newMessage' },
  };

  if (unreadOnly != undefined && unreadOnly === 'true') {
    searchObj.opened = false;
  }

  const notifications = await Notification.find(searchObj)
    .populate('userTo', 'firstName lastName username profilePic')
    .populate('userFrom', 'firstName lastName username profilePic')
    .sort('-createdAt');

  return res.json({
    status: 'success',
    data: { data: notifications },
  });
});

exports.updateNotification = asyncHandler(async (req, res, next) => {
  const {
    user,
    params: { id },
  } = req;

  const updatedNotification = await Notification.findOneAndUpdate(
    {
      _id: id,
      userTo: user?._id,
    },
    {
      opened: true,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  if (!updatedNotification)
    return next(new AppError('Notification not found', 404));

  return res.json({
    status: 'success',
    data: { data: updatedNotification },
  });
});

exports.markAsOpenedAllNotification = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const updatedNotifications = await Notification.updateMany(
    { userTo: user?._id },
    { opened: true },
    { new: true, runValidators: true }
  )
    .populate('userTo', 'firstName lastName username profilePic')
    .populate('userFrom', 'firstName lastName username profilePic')
    .sort('-createdAt');

  return res.json({
    status: 'success',
    data: { data: updatedNotifications },
  });
});

exports.getNotificationCounts = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const newMessageNotificationsCount = await Notification.countDocuments({
    userTo: user?._id,
    notificationType: 'newMessage',
    opened: false,
  });

  const otherNotificationsCount = await Notification.countDocuments({
    userTo: user?._id,
    opened: false,
    $or: [
      { notificationType: 'postLike' },
      { notificationType: 'follow' },
      { notificationType: 'retweet' },
    ],
  });
  return res.json({
    status: 'success',
    data: { data: { otherNotificationsCount, newMessageNotificationsCount } },
  });
});
