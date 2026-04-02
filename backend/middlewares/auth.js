const User = require('../schemas/user');
const { verifyAccessToken } = require('../utils/jwt');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return next(new Error('Unauthorized'));
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).populate('role');

    if (!user || !user.isActive) {
      return next(new Error('User not found or inactive'));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new Error('Invalid or expired token'));
  }
};

module.exports = auth;
