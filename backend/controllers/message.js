const Message = require('../schemas/message');
const Notification = require('../schemas/Notification');

const getConversation = async ({ userId, currentUser }) => {
  return await Message.find({
    $or: [
      { sender: currentUser._id, receiver: userId, group: null },
      { sender: userId, receiver: currentUser._id, group: null },
    ],
  })
    .populate('sender', 'username email avatar')
    .populate('receiver', 'username email avatar')
    .sort({ createdAt: 1 });
};

const sendMessage = async ({ body, currentUser }) => {
  if (!body.receiver || !body.content) {
    throw new Error('receiver and content are required');
  }

  const message = await Message.create({
    sender: currentUser._id,
    receiver: body.receiver,
    content: body.content,
    attachment: body.attachment || null,
  });

  await Notification.create({
    recipient: body.receiver,
    sender: currentUser._id,
    type: 'message',
    title: 'Tin nhắn mới',
    message: `${currentUser.username} đã gửi cho bạn một tin nhắn`,
    link: '/messages',
  });

  return await Message.findById(message._id)
    .populate('sender', 'username email avatar')
    .populate('receiver', 'username email avatar');
};

const markAsRead = async ({ id, currentUser }) => {
  const message = await Message.findById(id);
  if (!message) throw new Error('Message not found');

  if (String(message.receiver) !== String(currentUser._id)) {
    throw new Error('Forbidden');
  }

  message.isRead = true;
  await message.save();

  await Notification.updateMany(
    {
      recipient: currentUser._id,
      sender: message.sender,
      type: 'message',
      isRead: false,
    },
    { isRead: true }
  );

  return message;
};

const getConversations = async ({ currentUser }) => {
  const userId = currentUser._id;
  
  const personalMessages = await Message.find({
    $or: [{ sender: userId }, { receiver: userId }],
    group: null
  })
  .sort({ createdAt: -1 })
  .populate('sender', 'username avatar')
  .populate('receiver', 'username avatar');

  const Group = require('../schemas/group');
  const groupMessages = await Message.find({ group: { $exists: true, $ne: null } })
    .sort({ createdAt: -1 })
    .populate('group', 'name avatar members')
    .limit(50);

  const personalMap = new Map();
  personalMessages.forEach(msg => {
    const partner = String(msg.sender._id) === String(userId) ? msg.receiver : msg.sender;
    const partnerIdStr = String(partner._id);
    if (!personalMap.has(partnerIdStr)) {
      personalMap.set(partnerIdStr, {
        partner,
        lastMessage: msg,
        type: 'personal'
      });
    }
  });

  const groupMap = new Map();
  groupMessages.forEach(msg => {
    if (!msg.group || !msg.group.members?.some(m => String(m._id) === String(userId))) return;
    const groupIdStr = String(msg.group._id);
    if (!groupMap.has(groupIdStr)) {
      groupMap.set(groupIdStr, {
        partner: msg.group,
        lastMessage: msg,
        type: 'group'
      });
    }
  });

  const all = [...personalMap.values(), ...groupMap.values()];
  return all.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
};

const getGroupMessages = async ({ groupId, currentUser }) => {
  const Group = require('../schemas/group');
  const group = await Group.findById(groupId);
  if (!group) throw new Error('Group not found');
  
  const isMember = group.members.some(m => String(m._id || m) === String(currentUser._id));
  if (!isMember) throw new Error('Must be group member to access chat');
  
  return await Message.find({ group: groupId })
    .populate('sender', 'username avatar')
    .sort({ createdAt: 1 });
};

const sendGroupMessage = async ({ body, currentUser }) => {
  if (!body.group || !body.content) {
    throw new Error('group and content are required');
  }

  const Group = require('../schemas/group');
  const group = await Group.findById(body.group);
  if (!group) throw new Error('Group not found');
  
  const isMember = group.members.some(m => String(m._id || m) === String(currentUser._id));
  if (!isMember) throw new Error('Must be group member to send message');

  const message = await Message.create({
    sender: currentUser._id,
    group: body.group,
    content: body.content,
    attachment: body.attachment || null,
  });

  const populated = await Message.findById(message._id).populate('sender', 'username email avatar');
  
  const { getIO } = require('../utils/socket');
  const io = getIO();
  io.to(`group_${String(body.group)}`).emit('group-message:receive', populated);

  return populated;
};

const markGroupMessageAsRead = async ({ groupId, currentUser }) => {
  return await Message.updateMany(
    { 
      group: groupId, 
      receiver: currentUser._id,
      isRead: false 
    },
    { isRead: true }
  );
};

module.exports = {
  getConversation,
  sendMessage,
  markAsRead,
  getConversations,
  getGroupMessages,
  sendGroupMessage,
  markGroupMessageAsRead,
};
