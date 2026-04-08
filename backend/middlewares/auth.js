const User = require('../schemas/user');
const { verifyAccessToken } = require('../utils/jwt');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

  const decoded = verifyAccessToken(token);
  console.log('Auth decoded:', decoded.userId, 'Token:', token.substring(0,20) + '...');
    const user = await User.findById(decoded.userId).populate('role');
  console.log('Found user:', user ? user.username : 'NO USER', 'Role:', user?.role?.name);

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = auth;
