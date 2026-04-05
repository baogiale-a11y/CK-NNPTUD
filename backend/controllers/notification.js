const Notification = require('../schemas/Notification');

const getNotifications = async ({ currentUser }) => {
  return await Notification.find({ recipient: currentUser._id })
    .populate('sender', 'username email avatar')
    .sort({ createdAt: -1 });
};

const markRead = async ({ id, currentUser }) => {
  const noti = await Notification.findById(id);
  if (!noti) throw new Error('Notification not found');
  if (String(noti.recipient) !== String(currentUser._id)) throw new Error('Forbidden');

  noti.isRead = true;
  await noti.save();
  return noti;
};

const markReadAll = async ({ currentUser }) => {
  await Notification.updateMany({ recipient: currentUser._id, isRead: false }, { isRead: true });
  return { updated: true };
};

const deleteNotification = async ({ id, currentUser }) => {
  const noti = await Notification.findById(id);
  if (!noti) throw new Error('Notification not found');
  if (String(noti.recipient) !== String(currentUser._id)) throw new Error('Forbidden');

  await Notification.findByIdAndDelete(id);
  return { deletedId: id };
};

module.exports = {
  getNotifications,
  markRead,
  markReadAll,
  deleteNotification,
};
