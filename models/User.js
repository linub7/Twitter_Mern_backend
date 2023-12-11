const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please provide a first name'],
      minlength: [2, 'First Name must be more or equal than 2'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Please provide a last name'],
      minlength: [2, 'Last Name must be more or equal than 2'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      trim: true,
      lowercase: true,
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'password must be at least 8 characters'],
      maxlength: [25, 'password must be less that 26 characters'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      minlength: [8, 'password confirm must be at least 8 characters'],
      maxlength: [25, 'password confirm must be less that 25 characters'],
      validate: {
        // this only works on .save() or .create()
        validator: function (val) {
          return val === this.password;
        },
        message: (props) => `${props.value} must be the same password`,
      },
    },
    profilePic: {
      type: Object,
      url: String,
      public_id: String,
    },
    coverPhoto: {
      type: Object,
      url: String,
      public_id: String,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
    retweets: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

UserSchema.pre('save', async function (next) {
  // only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  // hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // Delete password confirm field
  this.passwordConfirm = undefined;
  next();
});

UserSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  // putting passwordChangedAt on second in the past will then ensure that the token is always created
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

UserSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // we set select:false to password field -> so we can't use this.password and use its value
  // -> so we have to use an argument to represent storedPassword(userPassword)
  return await bcrypt.compare(candidatePassword, userPassword);
};

UserSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // JWTTimestamp in seconds, this.passwordChangedAt.getTime() in milliseconds -> divided by 1000
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp; // 100 < 200 -> true -> password changed
  }
  // false means that NOT changed
  return false;
};

UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 20 * 60 * 1000; // expires in 20 minutes(converted to milliseconds)
  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
