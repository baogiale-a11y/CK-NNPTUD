import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      setMsg('Đăng nhập thành công');
      navigate('/');
    } catch (e2) {
      setMsg(e2?.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="card">
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <label>Email</label>
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label>Password</label>
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button type="submit">Login</button>
      </form>
      <p className="muted">{msg}</p>
    </div>
  );
}
