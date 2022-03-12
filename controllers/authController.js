const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  //sending cookie as httpOnly so only browser can read
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();
  //after user is created we will automatically login by assigning jwt and sending it to the client
  const token = signToken(newUser._id);
  //201 code is created
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1 check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
    //throw new AppError('Please provide email and password!', 400);
  }

  //2) check if user exists and && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  //3) if everything oka, send the JWT to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it exists in req message header
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  //console.log(token);

  if (!token) {
    return next(
      new AppError('You are not logged in !! please login again..', 401)
    );
  }
  // 2) verification of token if it is valid, jwt.verify needs a callback function so
  // we changed the function to return a promise and then await the decoded value
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //console.log(decoded);

  // 3) check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError(' User belonging to token no longer exist', 401));
  }

  // 4) check if user changed passwords after token was issued
  if (freshUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password!, please login again', 401)
    );
  }
  //grant access to protected route
  req.user = freshUser;
  // There is a logged in user
  res.locals.user = freshUser; //making user accessible to pug templates
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin','lead-guide']. role = 'user
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to perfomr the action', 401)
      );
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on email id
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('Email Id does not exist...', 401));
  }

  // 2) generate the reset token as document instance method
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email

  //const message = `Forgot your password? Click on below link to generate new password \n ${resetURL}`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token ( only valid for 10 min)',
    //   message,
    // });
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiresIn = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);
    return next(
      new AppError('There was error sending the email. Try again later', 500)
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiresIn: { $gt: Date.now() },
  });

  // 2) set new password if token not expired and user exist
  if (!user) return next(new AppError('token is invalid or expired', 400));

  // 3) update changePasswordAt property for the user

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresIn = undefined;

  await user.save();

  //4) Log the user in and send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collection
  const user = await User.findById(req.user.id).select('+password');
  //2) check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong!! ', 401));
  }

  //3) if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4) log user in , send new JWT
  createSendToken(user, 200, res);
});

exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 3) check if user still exists
      const loggedUser = await User.findById(decoded.id);
      if (!loggedUser) {
        return next();
      }

      // 4) check if user changed passwords after token was issued
      if (loggedUser.changePasswordAfter(decoded.iat)) {
        return next();
      }
      // There is a logged in user
      res.locals.user = loggedUser; //making user accessible to pug templates
      return next();
    }
  } catch (err) {
    return next();
  }

  next();
};
