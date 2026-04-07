import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';

export default function GroupsPage() {
  const { user } = useAuth();
  const canCreateGroup = !!user;
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', subject: '', isPrivate: false, password: '' });
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchGroups = async (search = '') => {
    try {
      setLoading(true);
      const { data } = await http.get('/groups', {
        params: { search, page: 1, limit: 20 }
      });
      const list = data?.data?.items || data?.data || data || [];
      setGroups(Array.isArray(list) ? list : []);
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Không tải được danh sách nhóm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups(search);
  }, [search]);

  const onCreate = async (e) => {
    e.preventDefault();
    try {
      setMsg('');
      await http.post('/groups', form);
      setForm({ name: '', description: '', subject: '', isPrivate: false, password: '' });
      setMsg('Tạo nhóm thành công');
      fetchGroups();
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Tạo nhóm thất bại');
    }
  };

  return (
    <div className="grid grid-2">
      <section className="card">
<h2 className="section-title">Groups</h2>

        <input
          className="input"
          style={{ marginBottom: '20px' }}
          placeholder="Tìm nhóm theo tên/môn học..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading && <p className="muted">Đang tải danh sách nhóm...</p>}

        <div className="grid-cards">
          {groups.map((g) => (
            <div className="card fade-in" key={g._id} style={{ display: 'flex', flexDirection: 'column', padding: '20px', position: 'relative' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  {g.isPrivate ? '🔒' : '📚'}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  {g.ownerRoleAtCreation === 'student' && <span className="tag" style={{ background: 'var(--bg-light-accent)', color: 'var(--text-main)', border: '1px solid var(--border)', fontSize: '0.7rem' }}>Nhóm Học sinh</span>}
                  {g.ownerRoleAtCreation === 'teacher' && <span className="tag" style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem' }}>Nhóm Giáo viên</span>}
                  {g.ownerRoleAtCreation === 'admin' && <span className="tag" style={{ background: 'var(--danger)', color: 'white', fontSize: '0.7rem' }}>Nhóm Admin</span>}
                </div>
              </div>
              
              <h3 style={{ marginTop: 0, marginBottom: '4px' }}>
                <Link to={`/groups/${g._id}`} style={{ color: 'var(--text-main)', textDecoration: 'none' }} className="hover-underline">{g.name}</Link>
              </h3>
              <div className="muted small" style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                {g.owner?.username && (
                  <span className="tag" style={{ padding: '2px 6px', fontSize: '0.75rem', background: 'var(--bg-light-accent)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                    👑 {g.owner.username}
                  </span>
                )}
                {g.members?.some?.(member => String(member?._id || member) === String(user?._id)) && (
                  <span className="tag" style={{ padding: '2px 6px', fontSize: '0.75rem', background: 'var(--success)', color: 'white', border: 'none' }}>
                    ✓ Đã tham gia
                  </span>
                )}
                <span>{g.subject || 'General'} · {(g.members || []).length} thành viên</span>
              </div>
              <p style={{ flex: 1, fontSize: '0.95rem', color: 'var(--text-main)' }}>{g.description || 'Không có mô tả cho nhóm này.'}</p>
              
              {g.expiresAt && (
                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--danger)' }}>
                  ⏳ Xóa sau: {new Date(g.expiresAt).toLocaleString('vi-VN')}
                </div>
              )}

              {g.members?.some?.(member => String(member?._id || member) === String(user?._id)) ? (
                  <button className="btn btn-outline" style={{ marginTop: '16px', width: '100%' }} onClick={async () => {
                    try {
                      await http.post(`/groups/${g._id}/leave`);
                      setMsg('Rời nhóm thành công');
                      fetchGroups();
                    } catch (err) {
                      setMsg(err?.response?.data?.message || 'Rời nhóm thất bại');
                    }
                  }}>Rời nhóm</button>
              ) : (
                  <button className="btn btn-primary btn-modern" style={{ marginTop: '16px', width: '100%' }} onClick={async () => {
                    let password = '';
                    if (g.isPrivate) {
                      password = prompt(`Tham gia nhóm "${g.name}" (Private). Vui lòng nhập mật khẩu:`);
                      if (password === null) return;
                    }

                    try {
                      await http.post(`/groups/${g._id}/join`, { password });
                      setMsg('Tham gia nhóm thành công');
                      fetchGroups();
                    } catch (err) {
                      alert(err?.response?.data?.message || 'Tham gia nhóm thất bại');
                    }
                  }}>Tham gia</button>
              )}
              <Link to={`/groups/${g._id}`} className="btn btn-outline btn-modern" style={{ marginTop: '16px', width: '100%' }}>Xem chi tiết</Link>
            </div>
          ))}
        </div>
        {!loading && groups.length === 0 && <p className="muted">Chưa có nhóm nào.</p>}
      </section>

      {canCreateGroup && (
        <aside className="card" style={{ height: 'fit-content', position: 'sticky', top: '100px' }}>
          <h3 className="section-title">Tạo nhóm học tập</h3>
          <form onSubmit={onCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label>Tên nhóm <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required placeholder="Ví dụ: Nhóm tự học Toán..." />
            </div>
            
            <div>
              <label>Môn học</label>
              <input className="input" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Toán, Lý, Hóa..." />
            </div>
            
            <div>
              <label>Mô tả</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows="3" placeholder="Thông tin về nhóm..." style={{ width: '100%', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="isPrivate"
                checked={form.isPrivate}
                onChange={(e) => {
                  setForm(p => ({ ...p, isPrivate: e.target.checked, password: e.target.checked ? p.password : '' }));
                }}
              />
              <label htmlFor="isPrivate" style={{ margin: 0, fontWeight: 'normal', cursor: 'pointer' }}>Là nhóm Private (Cần mật khẩu để vào)</label>
            </div>

            {form.isPrivate && (
              <div className="fade-in">
                <label>Mật khẩu nhóm <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required={form.isPrivate}
                  placeholder="Nhập mật khẩu..."
                />
              </div>
            )}

            {(user?.role?.name === 'student' || user?.role === 'student' || !user?.role) && (
              <div className="muted small" style={{ padding: '12px', background: 'var(--bg-light-accent)', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ margin: '0 0 4px 0' }}>⚠️ <strong>Lưu ý cho Học sinh:</strong></p>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li>Nhóm của học sinh sẽ tự động bị xóa sau 24 giờ.</li>
                  <li>Tối đa được tạo 3 nhóm cùng lúc.</li>
                </ul>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-modern" style={{ width: '100%', marginTop: '8px' }}>Tạo ngay</button>
          </form>
          {msg && <p className={`form-message ${msg.toLowerCase().includes('thất bại') || msg.toLowerCase().includes('lỗi') || msg.toLowerCase().includes('hiện tại') ? 'error' : 'success'}`} style={{ marginTop: '16px' }}>{msg}</p>}
        </aside>
      )}
    </div>
  );
}
