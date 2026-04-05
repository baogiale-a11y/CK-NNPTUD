const Follow = require('../schemas/follow');
const User = require('../schemas/user');
const Notification = require('../schemas/Notification');

const followUser = async ({ userId, currentUser }) => {
  if (String(userId) === String(currentUser._id)) {
    throw new Error('Cannot follow yourself');
  }

  const target = await User.findById(userId);
  if (!target) throw new Error('Target user not found');

  const exists = await Follow.findOne({
    follower: currentUser._id,
    following: userId,
  });
  if (exists) throw new Error('Already followed');

  const record = await Follow.create({
    follower: currentUser._id,
    following: userId,
  });

  await Notification.create({
    recipient: userId,
    sender: currentUser._id,
    type: 'follow',
    title: 'Có người theo dõi bạn',
    message: `${currentUser.username} đã follow bạn`,
    link: `/profile/${currentUser._id}`,
  });

  return record;
};

const unfollowUser = async ({ userId, currentUser }) => {
  const record = await Follow.findOneAndDelete({
    follower: currentUser._id,
    following: userId,
  });

  if (!record) throw new Error('Follow relation not found');
  return { unfollowedUserId: userId };
};

const getFollowers = async ({ userId }) => {
  return await Follow.find({ following: userId }).populate('follower', 'username email avatar');
};

const getFollowing = async ({ userId }) => {
  return await Follow.find({ follower: userId }).populate('following', 'username email avatar');
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};
