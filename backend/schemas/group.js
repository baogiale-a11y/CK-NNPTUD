const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    subject: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerRoleAtCreation: { type: String, default: 'student', enum: ['student', 'teacher', 'admin'] },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    avatar: { type: String, default: null },
    isPrivate: { type: Boolean, default: false },
    password: { type: String, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

GroupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Group', GroupSchema);
