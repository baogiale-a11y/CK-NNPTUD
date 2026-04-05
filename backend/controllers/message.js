const Message = require('../schemas/message');
const Notification = require('../schemas/Notification');

const getConversation = async ({ userId, currentUser }) => {
  return await Message.find({
    $or: [
      { sender: currentUser._id, receiver: userId },
      { sender: userId, receiver: currentUser._id },
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

  return message;
};

module.exports = {
  getConversation,
  sendMessage,
  markAsRead,
};
