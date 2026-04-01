const User = require('../schemas/user.schema');
const { verifyAccessToken } = require('../utils/jwt.utils');
const { fail } = require('../utils/response.utils');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return fail(res, 'Unauthorized', 401);
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).populate('role');

    if (!user || !user.isActive) {
      return fail(res, 'User not found or inactive', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return fail(res, 'Invalid or expired token', 401);
  }
};

module.exports = authMiddleware;
