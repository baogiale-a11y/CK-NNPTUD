const User = require('../schemas/user');
const Role = require('../schemas/role');
const { hashPassword, comparePassword } = require('../utils/hash');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');

const register = async ({ username, email, password }) => {
  if (!username || !email || !password) {
    throw new Error('username, email, password are required');
  }

  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) {
    throw new Error('Email or username already exists');
  }

  let role = await Role.findOne({ name: 'student' });
  if (!role) {
    role = await Role.create({ name: 'student', description: 'Default student role' });
  }

  const hashed = await hashPassword(password);

  const user = await User.create({
    username,
    email,
    password: hashed,
    role: role._id,
  });

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: role.name,
  };
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('email and password are required');
  }

  const user = await User.findOne({ email }).populate('role');
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const ok = await comparePassword(password, user.password);
  if (!ok) {
    throw new Error('Invalid credentials');
  }

  const payload = {
    userId: user._id,
    role: user.role ? user.role.name : 'student',
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role ? user.role.name : null,
    },
  };
};

const refreshToken = async ({ refreshToken }) => {
  if (!refreshToken) {
    throw new Error('refreshToken is required');
  }

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.userId).populate('role');

  if (!user || user.refreshToken !== refreshToken) {
    throw new Error('Invalid refresh token');
  }

  const payload = {
    userId: user._id,
    role: user.role ? user.role.name : 'student',
  };

  const newAccessToken = signAccessToken(payload);

  return { accessToken: newAccessToken };
};

const logout = async ({ userId }) => {
  if (!userId) {
    throw new Error('userId is required');
  }

  await User.findByIdAndUpdate(userId, { refreshToken: null });
  return { message: 'Logged out successfully' };
};

const me = async ({ userId }) => {
  const user = await User.findById(userId).populate('role').select('-password -refreshToken');
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  me,
};
