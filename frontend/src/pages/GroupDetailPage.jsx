import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import http from '../api/http';

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [msg, setMsg] = useState('');

  const fetchData = async () => {
    try {
      setMsg('');
        const [{ data: groupRes }, { data: postRes }] = await Promise.all([
          http.get(`/groups/${id}`),
          http.get('/posts', { params: { group: id } }),
        ]);

        setGroup(groupRes?.data || groupRes);
        setPosts(postRes?.data?.items || postRes?.data || []);
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Không tải được chi tiết nhóm');
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const onJoin = async () => {
    let password = '';
    if (group?.isPrivate) {
      password = prompt('Nhóm này là Private. Vui lòng nhập mật khẩu nhóm:');
      if (password === null) return;
    }
    
    try {
      setMsg('');
      await http.post(`/groups/${id}/join`, { password });
      setMsg('Tham gia nhóm thành công');
      fetchData();
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Tham gia nhóm thất bại');
    }
  };

  const onLeave = async () => {
    try {
      await http.post(`/groups/${id}/leave`);
      setMsg('Rời nhóm thành công');
      fetchData();
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Rời nhóm thất bại');
    }
  };

  return (
    <div className="group-detail-page fade-in">
      <section className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>
            {(group?.name || 'G')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="section-title" style={{ margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {group?.name || `Group #${id}`}
              {group?.isPrivate ? <span title="Nhóm kín" style={{ fontSize: '1.2rem' }}>🔒</span> : <span title="Nhóm công khai" style={{ fontSize: '1.2rem' }}>🌎</span>}
            </h2>
            <p className="muted" style={{ margin: '6px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {group?.owner?.username && (
                <span className="tag" style={{ padding: '2px 8px', fontSize: '0.8rem', background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' }}>
                  👑 Chủ sở hữu: {group.owner.username}
                </span>
              )}
              {group?.members?.some?.(m => String(m._id || m) === String(localStorage.getItem('accessToken') ? JSON.parse(atob(localStorage.getItem('accessToken').split('.')[1])).id : '')) && (
                <span className="tag" style={{ padding: '2px 8px', fontSize: '0.8rem', background: 'var(--success)', color: 'white', borderColor: 'var(--success)' }}>
                  ✓ Đã tham gia
                </span>
              )}
              <span>•</span>
              <span className="tag" style={{ padding: '2px 8px', fontSize: '0.8rem' }}>{group?.subject || 'General'}</span>
              <span>👥 {(group?.members || []).length} thành viên</span>
              
              {group?.ownerRoleAtCreation === 'student' && <span className="tag" style={{ padding: '2px 8px', fontSize: '0.8rem', background: 'var(--bg-light-accent)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>👨‍🎓 Nhóm Học sinh</span>}
              {group?.ownerRoleAtCreation === 'teacher' && <span className="tag" style={{ padding: '2px 8px', fontSize: '0.8rem', background: 'var(--primary)', color: 'white' }}>👨‍🏫 Nhóm Giáo viên</span>}
              {group?.ownerRoleAtCreation === 'admin' && <span className="tag" style={{ padding: '2px 8px', fontSize: '0.8rem', background: 'var(--danger)', color: 'white' }}>🛡️ Nhóm Admin</span>}
              
              {group?.expiresAt && (
                <span className="tag" style={{ padding: '2px 8px', fontSize: '0.8rem', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                  ⏳ Hết hạn: {new Date(group.expiresAt).toLocaleString('vi-VN')}
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div style={{ background: 'var(--bg-light)', padding: '16px', borderRadius: 'var(--radius-md)', marginTop: '20px' }}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>{group?.description || 'Không có mô tả nhóm.'}</p>
        </div>
    
        <div className="toolbar" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
{group?.members?.some?.(member => String(member?._id || member) === String(localStorage.getItem('accessToken') ? JSON.parse(atob(localStorage.getItem('accessToken').split('.')[1])).id : '')) || group?.isMember ? (
            <>
              <button className="btn btn-outline" onClick={onLeave}>Rời nhóm</button>
              <Link to={`/messages?group=${id}`} className="btn btn-primary btn-modern">💬 Chat nhóm</Link>
            </>
          ) : (
            <button className="btn btn-primary btn-modern" onClick={onJoin}>Tham gia</button>
          )}

          {(String(group?.owner?._id || group?.owner) === String(localStorage.getItem('accessToken') ? JSON.parse(atob(localStorage.getItem('accessToken').split('.')[1])).id : '') || (localStorage.getItem('accessToken') && ['admin', 'teacher'].includes(JSON.parse(atob(localStorage.getItem('accessToken').split('.')[1])).role))) && (
            <button className="btn btn-outline danger" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={async () => {
              if (window.confirm('Bạn có chắc chắn muốn xóa nhóm này không? Toàn bộ dữ liệu nhóm sẽ bị mất.')) {
                try {
                  await http.delete(`/groups/${id}`);
                  navigate('/groups');
                } catch (err) {
                  setMsg(err?.response?.data?.message || 'Xóa nhóm thất bại');
                }
              }
            }}>
              Xóa nhóm
            </button>
          )}
        </div>

        {msg && <p className="auth-msg success" style={{ marginTop: '16px' }}>{msg}</p>}
      </section>

      <section className="card fade-in" style={{ animationDelay: '0.1s' }}>
        <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <span>📝 Bài viết trong nhóm</span>
          {(group?.members?.some?.(member => String(member?._id || member) === String(localStorage.getItem('accessToken') ? JSON.parse(atob(localStorage.getItem('accessToken').split('.')[1])).id : '')) || group?.isMember || (localStorage.getItem('accessToken') && JSON.parse(atob(localStorage.getItem('accessToken').split('.')[1])).role === 'admin')) && (
            <Link to={`/posts/new?group=${id}`} className="btn btn-outline small">
              + Tạo bài
            </Link>
          )}
        </h3>
        <div className="list" style={{ marginTop: '20px' }}>
          {Array.isArray(posts) && posts.length > 0 ? (
            posts.map((p) => (
              <div className="post-item fade-in" key={p._id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', padding: '20px' }} onClick={() => navigate(`/posts/${p._id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={`https://ui-avatars.com/api/?name=${p.author?.username || 'Unknown'}&background=random`} style={{ width: '36px', height: '36px', borderRadius: '50%' }} alt="" />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)' }}>{p.author?.username || 'Unknown'}</p>
                    <p className="muted small" style={{ margin: 0 }}>{new Date(p.createdAt || Date.now()).toLocaleDateString('vi-VN')} • {p.subject || 'Chung'}</p>
                  </div>
                </div>
                <strong style={{ fontSize: '1.3rem', marginTop: '8px' }}>
                  <span style={{ color: 'var(--primary)', textDecoration: 'none' }}>{p.title}</span>
                </strong>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-light)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '3rem', opacity: 0.2, marginBottom: '16px' }}>📭</div>
              <p className="muted" style={{ margin: 0 }}>Chưa có bài đăng trong nhóm.</p>
              {(group?.members?.some?.(member => String(member?._id || member) === String(localStorage.getItem('accessToken') ? JSON.parse(atob(localStorage.getItem('accessToken').split('.')[1])).id : '')) || group?.isMember || (localStorage.getItem('accessToken') && ['admin', 'teacher'].includes(JSON.parse(atob(localStorage.getItem('accessToken').split('.')[1])).role)     )) && (
                <Link to={`/posts/new?group=${id}`} className="btn btn-primary small" style={{ marginTop: '16px' }}>
                  Tạo bài viết
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
