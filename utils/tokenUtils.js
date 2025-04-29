
import jwt from "jsonwebtoken";

export const generateToken = (user, expiresIn = process.env.JWT_EXPIRES) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.svpEmail,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: expiresIn,
    }
  );
};

export const sendTokenResponse = (user, message, res, customOptions = {}) => {
  const token = generateToken(user);

  const defaultOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    secure: process.env.NODE_ENV === 'production'
  };

  const options = { ...defaultOptions, ...customOptions };

  res
    .status(200)
    .cookie("token", token, options)
    .json({
      result: true,
      message,
      token,
      user: {
        _id: user._id,
        name: user.name,
        svpEmail: user.svpEmail,
        role: user.role,
      },
    });
};