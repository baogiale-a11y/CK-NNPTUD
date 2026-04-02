const Role = require('../schemas/role');

const getRoles = async () => {
  return await Role.find().sort({ createdAt: -1 });
};

const createRole = async ({ name, description }) => {
  if (!name) throw new Error('name is required');

  const exists = await Role.findOne({ name });
  if (exists) throw new Error('Role already exists');

  const role = await Role.create({ name, description: description || '' });
  return role;
};

const updateRole = async ({ id, body }) => {
  const role = await Role.findById(id);
  if (!role) throw new Error('Role not found');

  if (body.name !== undefined) role.name = body.name;
  if (body.description !== undefined) role.description = body.description;

  await role.save();
  return role;
};

const deleteRole = async ({ id }) => {
  const role = await Role.findById(id);
  if (!role) throw new Error('Role not found');

  await Role.findByIdAndDelete(id);
  return { deletedId: id };
};

module.exports = {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
};
