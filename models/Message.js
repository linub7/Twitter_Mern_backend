const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, trim: true },
    chat: { type: Schema.Types.ObjectId, ref: 'Chat' },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  }
);

MessageSchema.pre('save', function (next) {
  this.populate({
    path: 'sender',
    select: 'firstName lastName username profilePic',
  });

  this.populate({
    path: 'chat',
  });

  next();
});

MessageSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'sender',
    select: 'firstName lastName username profilePic',
  });
  this.populate({
    path: 'chat',
    select: 'isGroupChat',
  });

  next();
});

module.exports = mongoose.model('Message', MessageSchema);
