const Comment = require('../schemas/comment');
const Post = require('../schemas/post');
const Group = require('../schemas/group');

const getComments = async ({ postId }) => {
  const filter = {};
  if (postId) filter.post = postId;

  return await Comment.find(filter)
    .populate('author', 'username email avatar')
    .populate('post', 'title')
    .populate('parentComment')
    .sort({ createdAt: -1 });
};

const createComment = async ({ body, currentUser }) => {
  if (!body.post || !body.content) {
    throw new Error('post and content are required');
  }

  const post = await Post.findById(body.post);
  if (!post) throw new Error('Post not found');

  if (post.group) {
    const group = await Group.findById(post.group);
    if (group) {
      const isAdmin = currentUser?.role?.name === 'admin';
      const isMember = group.members.some(id => String(id) === String(currentUser._id));
      if (!isAdmin && !isMember) {
        throw new Error('Must be a member to comment in this group');
      }
    }
  }

  const comment = await Comment.create({
    post: body.post,
    author: currentUser._id,
    content: body.content,
    parentComment: body.parentComment || null,
  });

  return await Comment.findById(comment._id)
    .populate('author', 'username email avatar')
    .populate('post', 'title')
    .populate('parentComment');
};

const updateComment = async ({ id, body, currentUser }) => {
  const comment = await Comment.findById(id).populate('author');
  if (!comment) throw new Error('Comment not found');

  const isAdmin = currentUser?.role?.name === 'admin';
  const isOwner = String(comment.author._id) === String(currentUser._id);
  if (!isAdmin && !isOwner) throw new Error('Forbidden');

  if (body.content !== undefined) comment.content = body.content;

  await comment.save();
  return comment;
};

const deleteComment = async ({ id, currentUser }) => {
  const comment = await Comment.findById(id).populate('author');
  if (!comment) throw new Error('Comment not found');

  const role = currentUser?.role?.name || currentUser?.role;
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';
  const isOwner = String(comment.author._id) === String(currentUser._id);
  if (!isAdmin && !isTeacher && !isOwner) throw new Error('Forbidden: Teachers and Admins can moderate any comments.');

  await Comment.findByIdAndDelete(id);
  return { deletedId: id };
};

const likeComment = async ({ id, currentUser }) => {
  const comment = await Comment.findById(id).populate('author');
  if (!comment) throw new Error('Comment not found');

  const index = comment.likes.findIndex((u) => String(u) === String(currentUser._id));
  if (index >= 0) comment.likes.splice(index, 1);
  else comment.likes.push(currentUser._id);

  await comment.save();
  return comment;
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
};
