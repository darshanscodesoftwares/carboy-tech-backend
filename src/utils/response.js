// Standard API response format
module.exports = {
  success(res, data) {
    return res.json({ ok: true, data });
  },
  error(res, message) {
    return res.status(400).json({ ok: false, error: message });
  }
};
