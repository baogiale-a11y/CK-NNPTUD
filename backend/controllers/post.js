const Post = require('../schemas/post');

const Group = require('../schemas/group');

const Notification = require('../schemas/Notification');

const getPosts = async ({ query, currentUser, notifySearch }) => {
  const filter = {};

  if (query.author) filter.author = query.author;
  if (query.group) {
    filter.group = query.group;
  } else {
    filter.group = null;
  }
  if (query.subject && query.subject !== 'all') filter.subject = query.subject;

  if (query.search) {
    const searchRegex = new RegExp(query.search, 'i');
    filter.$or = [
      { title: searchRegex },
      { content: searchRegex },
      { tags: searchRegex }
    ];
  }

  const posts = await Post.find(filter)
    .populate('author', 'username email avatar')
    .populate('group', 'name')
    .populate('files')
    .sort({ createdAt: -1 });

  if (query.search && notifySearch && currentUser) {
    if (posts.length > 0) {
      await Notification.create({
        recipient: currentUser._id,
        title: 'Kết quả tìm kiếm',
        message: `Tìm thấy ${posts.length} bài viết cho từ khóa: ${query.search}`,
        type: 'post_search',
        link: '/',
      });
      try {
        const { getIO } = require('../utils/socket');
        const io = getIO();
        io.to(`user_${String(currentUser._id)}`).emit('notification:new', { type: 'post_search' });
      } catch (err) {
      }
    }
  }

  return posts;
};

const getPostById = async ({ id }) => {
  const post = await Post.findById(id)
    .populate('author', 'username email avatar')
    .populate('group', 'name')
    .populate('files');
  if (!post) throw new Error('Post not found');
  return post;
};

const createPost = async ({ body, currentUser }) => {
  if (!body.title || !body.content) {
    throw new Error('title and content are required');
  }

  if (body.group) {
    const group = await Group.findById(body.group);
    if (!group) throw new Error('Group not found');
    const isAdmin = currentUser?.role?.name === 'admin';
    const isMember = group.members.some(id => String(id) === String(currentUser._id));
    if (!isAdmin && !isMember) {
      throw new Error('Must be a member to post in this group');
    }
  }

  const post = await Post.create({
    author: currentUser._id,
    group: body.group || null,
    title: body.title,
    content: body.content,
    subject: body.subject || 'Chung',
    images: body.images || [],
    files: body.files || [],
    tags: body.tags || [],
  });

  return await Post.findById(post._id)
    .populate('author', 'username email avatar')
    .populate('group', 'name')
    .populate('files');
};

const updatePost = async ({ id, body, currentUser }) => {
  const post = await Post.findById(id).populate('author');
  if (!post) throw new Error('Post not found');

  const isAdmin = currentUser?.role?.name === 'admin';
  const isOwner = String(post.author._id) === String(currentUser._id);
  if (!isAdmin && !isOwner) throw new Error('Forbidden');

  const fields = ['title', 'content', 'subject', 'group', 'images', 'files', 'tags', 'isActive'];
  fields.forEach((f) => {
    if (body[f] !== undefined) post[f] = body[f];
  });

  await post.save();
  return await Post.findById(id)
    .populate('author', 'username email avatar')
    .populate('group', 'name')
    .populate('files');
};

const deletePost = async ({ id, currentUser }) => {
  const post = await Post.findById(id).populate('author');
  if (!post) throw new Error('Post not found');

  const role = currentUser?.role?.name || currentUser?.role;
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';
  const isOwner = String(post.author._id) === String(currentUser._id);
  if (!isAdmin && !isTeacher && !isOwner) throw new Error('Forbidden: Teachers and Admins can moderate any posts.');

  await Post.findByIdAndDelete(id);
  return { deletedId: id };
};

const likePost = async ({ id, currentUser }) => {
  const post = await Post.findById(id).populate('author', 'username email avatar').populate('group', 'name');
  if (!post) throw new Error('Post not found');

  const index = post.likes.findIndex((u) => String(u) === String(currentUser._id));
  let isLiked = false;
  if (index >= 0) {
    post.likes.splice(index, 1);
  } else {
    post.likes.push(currentUser._id);
    isLiked = true;
  }

  await post.save();

  if (isLiked && String(post.author._id) !== String(currentUser._id)) {
    try {
      await Notification.create({
        recipient: post.author._id,
        sender: currentUser._id,
        type: 'like_post',
        title: 'Lượt thích mới',
        message: `${currentUser.username} đã thích bài viết của bạn: "${post.title}"`,
        link: `/posts/${post._id}`,
      });

const { getIO } = require('../utils/socket');
        const io = getIO();
        io.to(`user_${String(post.author._id)}`).emit('notification:new', { 
          type: 'like_post',
          data: {
            title: 'Lượt thích mới',
            message: `${currentUser.username} đã thích bài viết của bạn`,
            link: `/posts/${post._id}`
          }
        });
    } catch (err) {
      console.error('Error creating notification for like:', err);
    }
  }

  return post;
};

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
};
