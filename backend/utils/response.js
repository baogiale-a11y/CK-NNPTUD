const ok = (res, data = null, message = 'Success', status = 200) =>
  res.status(status).json({ success: true, message, data });

const fail = (res, message = 'Error', status = 400, errors = null) =>
  res.status(status).json({ success: false, message, errors });

module.exports = { ok, fail };
