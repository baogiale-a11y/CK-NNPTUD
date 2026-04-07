const Group = require('../schemas/group');
const Notification = require('../schemas/Notification');
const { withTransaction } = require('../utils/transaction');

const getGroups = async () => {
  return await Group.find()
    .populate('owner', 'username email avatar')
    .populate('members', 'username email avatar')
    .sort({ createdAt: -1 });
};

const getGroupById = async ({ id }) => {
  const group = await Group.findById(id)
    .populate('owner', 'username email avatar')
    .populate('members', 'username email avatar');
  if (!group) throw new Error('Group not found');
  return group;
};

const createGroup = async ({ body, currentUser }) => {
  if (!body.name) throw new Error('name is required');

  const role = currentUser?.role?.name || currentUser?.role || 'student';
  const isStudent = role === 'student';

  if (isStudent) {
    const studentGroupCount = await Group.countDocuments({ owner: currentUser._id });
    if (studentGroupCount >= 3) {
      throw new Error('Học sinh chỉ được tạo tối đa 3 nhóm');
    }
  }

  const expiresAt = isStudent ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

  const group = await Group.create({
    name: body.name,
    description: body.description || '',
    subject: body.subject || '',
    owner: currentUser._id,
    ownerRoleAtCreation: role,
    members: [currentUser._id],
    avatar: body.avatar || null,
    isPrivate: !!body.isPrivate,
    password: body.password || null,
    expiresAt,
  });

  return await Group.findById(group._id)
    .populate('owner', 'username email avatar')
    .populate('members', 'username email avatar');
};

const updateGroup = async ({ id, body, currentUser }) => {
  const group = await Group.findById(id);
  if (!group) throw new Error('Group not found');

  const isAdmin = currentUser?.role?.name === 'admin';
  const isOwner = String(group.owner) === String(currentUser._id);
  if (!isAdmin && !isOwner) throw new Error('Forbidden');

  const fields = ['name', 'description', 'subject', 'avatar', 'isPrivate', 'password'];
  fields.forEach((f) => {
    if (body[f] !== undefined) group[f] = body[f];
  });

  await group.save();
  return group;
};

const deleteGroup = async ({ id, currentUser }) => {
  const group = await Group.findById(id);
  if (!group) throw new Error('Group not found');

  const role = currentUser?.role?.name || currentUser?.role;
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';
  const isOwner = String(group.owner) === String(currentUser._id) || String(group.owner._id) === String(currentUser._id);

  if (!isAdmin && !isTeacher && !isOwner) {
    throw new Error('Forbidden: Students can only delete groups they own.');
  }

  await Group.findByIdAndDelete(id);
  return { deletedId: id };
};

const joinGroup = async ({ id, currentUser, body }) => {
  const result = await withTransaction(async (session) => {
    const group = await Group.findById(id).session(session);
    if (!group) throw new Error('Group not found');

    const isMember = group.members.some((m) => String(m) === String(currentUser._id));
    if (isMember) throw new Error('Already a member');

    if (group.isPrivate && group.password) {
      if (body?.password !== group.password) {
        throw new Error('Sai mật khẩu nhóm');
      }
    }

    group.members.push(currentUser._id);
    await group.save({ session });

    await Notification.create(
      [
        {
          recipient: group.owner,
          sender: currentUser._id,
          type: 'group_invite',
          title: 'Thành viên mới',
          message: `${currentUser.username} đã tham gia nhóm ${group.name}`,
          link: `/groups/${group._id}`,
        },
      ],
      { session }
    );

    return group;
  });

  return result;
};

const leaveGroup = async ({ id, currentUser }) => {
  const group = await Group.findById(id);
  if (!group) throw new Error('Group not found');

  const isMember = group.members.some((m) => String(m) === String(currentUser._id));
  if (!isMember) throw new Error('You are not a member');

  group.members = group.members.filter((m) => String(m) !== String(currentUser._id));
  await group.save();

  return group;
};

module.exports = {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
};
