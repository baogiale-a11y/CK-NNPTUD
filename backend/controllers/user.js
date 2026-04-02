const User = require('../schemas/user');
const Role = require('../schemas/role');

const getUsers = async () => {
  const users = await User.find()
    .populate('role')
    .select('-password -refreshToken')
    .sort({ createdAt: -1 });
  return users;
};

const getUserById = async ({ id }) => {
  const user = await User.findById(id).populate('role').select('-password -refreshToken');
  if (!user) throw new Error('User not found');
  return user;
};

const updateUser = async ({ id, currentUser, body }) => {
  const target = await User.findById(id).populate('role');
  if (!target) throw new Error('User not found');

  const isAdmin = currentUser?.role?.name === 'admin';
  const isSelf = String(currentUser?._id) === String(id);
  if (!isAdmin && !isSelf) throw new Error('Forbidden');

  const allowFields = ['username', 'bio', 'school', 'avatar'];
  allowFields.forEach((field) => {
    if (body[field] !== undefined) target[field] = body[field];
  });

  if (body.role && isAdmin) {
    const role = await Role.findById(body.role);
    if (!role) throw new Error('Role not found');
    target.role = role._id;
  }

  await target.save();
  return await User.findById(id).populate('role').select('-password -refreshToken');
};

const deleteUser = async ({ id, currentUser }) => {
  const target = await User.findById(id);
  if (!target) throw new Error('User not found');

  const isAdmin = currentUser?.role?.name === 'admin';
  const isSelf = String(currentUser?._id) === String(id);
  if (!isAdmin && !isSelf) throw new Error('Forbidden');

  await User.findByIdAndDelete(id);
  return { deletedId: id };
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
