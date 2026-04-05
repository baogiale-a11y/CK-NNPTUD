const Upload = require('../schemas/upload');

const createUpload = async ({ file, currentUser, body }) => {
  if (!file) throw new Error('file is required');

  const record = await Upload.create({
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    uploadedBy: currentUser._id,
    relatedModel: body.relatedModel || '',
    relatedId: body.relatedId || null,
  });

  return record;
};

const getUploads = async ({ currentUser }) => {
  return await Upload.find({ uploadedBy: currentUser._id }).sort({ createdAt: -1 });
};

const deleteUpload = async ({ id, currentUser }) => {
  const upload = await Upload.findById(id);
  if (!upload) throw new Error('Upload not found');

  const isAdmin = currentUser?.role?.name === 'admin';
  const isOwner = String(upload.uploadedBy) === String(currentUser._id);
  if (!isAdmin && !isOwner) throw new Error('Forbidden');

  await Upload.findByIdAndDelete(id);
  return { deletedId: id };
};

module.exports = {
  createUpload,
  getUploads,
  deleteUpload,
};
