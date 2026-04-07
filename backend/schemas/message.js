const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    attachment: { type: String, default: null },
  },
  { timestamps: true }
);

MessageSchema.virtual('partner', {
  ref: 'User',
  localField: 'receiver',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Message', MessageSchema);
