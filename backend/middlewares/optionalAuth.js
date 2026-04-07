const User = require('../schemas/user');
const { verifyAccessToken } = require('../utils/jwt');

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) return next();

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).populate('role');

    if (user && user.isActive) {
      req.user = user;
    }

    return next();
  } catch (err) {
    return next();
  }
};

module.exports = optionalAuth;
