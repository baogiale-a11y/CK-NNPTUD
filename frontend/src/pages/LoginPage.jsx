import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import http from '../api/http';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMsg('');
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      const errorMsg = err?.response?.data?.message 
        || err?.message 
        || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin hoặc kết nối mạng!';
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
          <h1 className="section-title">Chào mừng trở lại</h1>
          <p className="muted">Đăng nhập để tiếp tục học tập</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
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
            <label>Mật khẩu</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Nhập mật khẩu của bạn"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-modern full-width" disabled={loading}>
            {loading ? (
              <>
                <span className="pulse">🔄</span> Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>

          {msg && (
            <div className={`auth-msg ${msg.includes('thành công') ? 'success' : 'error'}`}>
              {msg}
            </div>
          )}
        </form>

        <div className="auth-footer">
          <p>Chưa có tài khoản? <Link to="/register" className="link-primary">Đăng ký ngay</Link></p>
          <p className="muted small">StudyTogether - Nơi kết nối tri thức</p>
        </div>
      </div>
    </div>
  );
}
