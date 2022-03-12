const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs'); //hashing password with additional string

//name,email,photo,password,password confirm

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell use your name!'],
    trim: true,
    maxLength: [40, 'A name cannot be more than 40 characters long'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: [true, 'Email already exist in our sytem'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: { type: String, default: 'default.jpg' },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    select: false,
    required: [true, 'Please provide a password'],
    minLength: [8, 'A password length must be at least 8 characters long'],
    // validate: [
    //   validator.isStrongPassword,
    //   'password is easy, use lowercase, numbers and special characters',
    // ],
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //only works on save/create like signup
      validator: function (el) {
        return this.password === el;
      },
      message: 'Passwords are not same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpiresIn: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  //only runs function if password was modified
  if (!this.isModified('password')) return next();
  //b-crypt, hash return a promise we await the function and change main fucntion to async
  this.password = await bcrypt.hash(this.password, 12);
  //delete the password confirm field
  this.passwordConfirm = undefined; //required input but not persistent to db
  next();
});
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  //this points to current query object
  this.find({ active: { $ne: false } });
  next();
});

//Instance method avaialble to all documents on collection
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //console.log(JWTTimestamp, changedTimeStamp);
    return JWTTimestamp < changedTimeStamp; //return true if password changed after jwt
  }
  //false means timestamp not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpiresIn = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
