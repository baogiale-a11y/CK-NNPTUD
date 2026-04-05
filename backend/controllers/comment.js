const Comment = require('../schemas/comment');
const Post = require('../schemas/post');

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

  const isAdmin = currentUser?.role?.name === 'admin';
  const isOwner = String(comment.author._id) === String(currentUser._id);
  if (!isAdmin && !isOwner) throw new Error('Forbidden');

  await Comment.findByIdAndDelete(id);
  return { deletedId: id };
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment,
};
