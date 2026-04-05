const Post = require('../schemas/post');

const getPosts = async ({ query }) => {
  const filter = {};

  if (query.author) filter.author = query.author;
  if (query.group) filter.group = query.group;
  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { content: { $regex: query.search, $options: 'i' } },
    ];
  }

  return await Post.find(filter)
    .populate('author', 'username email avatar')
    .populate('group', 'name')
    .populate('files')
    .sort({ createdAt: -1 });
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

  const post = await Post.create({
    author: currentUser._id,
    group: body.group || null,
    title: body.title,
    content: body.content,
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

  const fields = ['title', 'content', 'group', 'images', 'files', 'tags', 'isActive'];
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

  const isAdmin = currentUser?.role?.name === 'admin';
  const isOwner = String(post.author._id) === String(currentUser._id);
  if (!isAdmin && !isOwner) throw new Error('Forbidden');

  await Post.findByIdAndDelete(id);
  return { deletedId: id };
};

const likePost = async ({ id, currentUser }) => {
  const post = await Post.findById(id);
  if (!post) throw new Error('Post not found');

  const index = post.likes.findIndex((u) => String(u) === String(currentUser._id));
  if (index >= 0) post.likes.splice(index, 1);
  else post.likes.push(currentUser._id);

  await post.save();
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
