// api/admin/logout.js
module.exports = (req, res) => {
  res.setHeader('Set-Cookie', 'bc_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
  res.status(200).json({ success: true });
};
