const { fail } = require('../utils/response.utils');

const authorize = (...roles) => (req, res, next) => {
  const roleName = req.user?.role?.name;
  if (!roleName || !roles.includes(roleName)) {
    return fail(res, 'Forbidden', 403);
  }
  next();
};

module.exports = authorize;
