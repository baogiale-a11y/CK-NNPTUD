import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    school: '',
    role: 'student'
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMsg('');
      await register(form);
      setMsg('Đăng ký thành công! Vui lòng đăng nhập.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error('Lỗi đăng ký:', err);
      const errorMsg = err?.response?.data?.message 
        || err?.message 
        || 'Đăng ký thất bại. Vui lòng thử lại!';
      setMsg(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">📚 StudyTogether</div>
          <h1 className="section-title">Tạo tài khoản mới</h1>
          <p className="muted">Tham gia cộng đồng học tập ngay hôm nay</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="input-group">
            <label>Tên hiển thị</label>
            <input
              className="input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Tên của bạn"
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Trường học</label>
            <input
              className="input"
              value={form.school}
              onChange={(e) => setForm({ ...form, school: e.target.value })}
              placeholder="VD: ĐH Bách Khoa HN"
              disabled={loading}
            />
          </div>

          <div className="input-group" style={{ display: 'none' }}>
            <label>Vai trò</label>
            <input type="text" className="input" value={form.role} readOnly disabled />
          </div>

          <div style={{ background: 'var(--bg-light-accent)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.85rem', border: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>ℹ️ Lưu ý về vai trò tài khoản:</p>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Tài khoản đăng ký mặc định sẽ là <strong>Học sinh</strong>. <br/>
              Nếu bạn là giáo viên và muốn được cấp quyền <strong>Giáo viên</strong>, vui lòng gửi email xác nhận thông tin tới <a href="mailto:legiabao1928@gmail.com" style={{ color: 'var(--primary)' }}>legiabao1928@gmail.com</a> sau khi tạo tài khoản. Ban quản trị sẽ cập nhật thủ công cho bạn.
            </p>
          </div>

          <div className="input-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Tạo mật khẩu mạnh (≥6 ký tự)"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-modern full-width" disabled={loading}>
            {loading ? (
              <>
                <span className="pulse">✨</span> Đang tạo tài khoản...
              </>
            ) : (
              'Đăng ký ngay'
            )}
          </button>

          {msg && (
            <div className={`auth-msg ${msg.includes('thành công') ? 'success' : 'error'}`}>
              {msg}
            </div>
          )}
        </form>

        <div className="auth-footer">
          <p>Đã có tài khoản? <Link to="/login" className="link-primary">Đăng nhập ngay</Link></p>
          <p className="muted small">StudyTogether - Học cùng bạn bè</p>
        </div>
      </div>
    </div>
  );
}
