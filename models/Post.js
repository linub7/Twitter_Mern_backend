const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
    content: {
      type: String,
      trim: true,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    retweetUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    retweetData: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

PostSchema.pre('save', function (next) {
  this.populate({
    path: 'postedBy',
  });
  next();
});

PostSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'postedBy',
    select: 'firstName lastName username profilePic',
  });
  this.populate({
    path: 'replyTo',
  });
  next();
});

module.exports = mongoose.model('Post', PostSchema);
