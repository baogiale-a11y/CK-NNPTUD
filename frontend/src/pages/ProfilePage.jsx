import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import http from '../api/http';

export default function ProfilePage() {
  const { id } = useParams();
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '', school: '', avatar: '', coverPhoto: '' });
  const [uploading, setUploading] = useState(false);

  const isMyProfile = user?._id === id;

  const fetchData = async () => {
    try {
      setMsg('');
      const [{ data: profileRes }, { data: followersRes }, { data: followingRes }, { data: postsRes }] = await Promise.all([
        http.get(`/users/${id}`),
        http.get(`/follows/${id}/followers`),
        http.get(`/follows/${id}/following`),
        http.get('/posts')
      ]);

      setProfile(profileRes?.data || profileRes);
      
      setEditForm({
        username: profileRes?.data?.username || profileRes?.username || '',
        bio: profileRes?.data?.bio || profileRes?.bio || '',
        school: profileRes?.data?.school || profileRes?.school || '',
        avatar: profileRes?.data?.avatar || profileRes?.avatar || '',
        coverPhoto: profileRes?.data?.coverPhoto || profileRes?.coverPhoto || ''
      });
      
      const flws = followersRes?.data?.items || followersRes?.data || [];
      setFollowers(flws);
      setFollowing(followingRes?.data?.items || followingRes?.data || []);
      
      const allPosts = postsRes?.data?.items || postsRes?.data || [];
      setPosts(allPosts.filter(p => (p.author?._id || p.author) === id));

      setIsFollowing(flws.some(f => (f.follower?._id || f.follower) === user?._id));
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Không tải được profile');
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const onFollow = async () => {
    try {
      await http.post(`/follows/${id}`);
      setMsg('Follow thành công');
      fetchData();
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Follow thất bại');
    }
  };

  const onUnfollow = async () => {
    try {
      await http.delete(`/follows/${id}`);
      setMsg('Unfollow thành công');
      fetchData();
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Unfollow thất bại');
    }
  };

  const handleUploadImage = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      setMsg('Đang tải ảnh lên...');
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await http.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const filePath = uploadRes.data?.data?.path || uploadRes.data?.path;
      setEditForm(prev => ({ ...prev, [field]: filePath }));
      setMsg('Tải ảnh tạm thời thành công. Nhấn Lưu thay đổi để hoàn tất!');
    } catch (err) {
      console.error(err);
      setMsg('Lỗi khi tải ảnh lên!');
    } finally {
      setUploading(false);
    }
  };

  const getAvatarUrl = (path) => {
    if (!path) return `https://ui-avatars.com/api/?name=${profile?.username || 'User'}&background=random`;
    if (path.startsWith('http')) return path;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${baseUrl}/${path.replace(/\\/g, '/').replace(/^\//, '')}`;
  };

  const onSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await http.put(`/users/${id}`, editForm);
      setProfile(prev => ({ ...prev, ...editForm }));
      if (isMyProfile) {
        setUser(prev => ({ ...prev, ...editForm }));
      }
      setIsEditing(false);
      setMsg('Cập nhật hồ sơ thành công!');
    } catch (err) {
      console.error(err);
      setMsg(err?.response?.data?.message || 'Lỗi cập nhật hồ sơ');
    }
  };

  return (
    <>
      <div className="profile-container fade-in">
      <div className="profile-hero card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
        <div className="profile-banner" style={{ height: '200px', background: profile?.coverPhoto ? `url(${getAvatarUrl(profile.coverPhoto)}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))', transition: 'background 0.3s' }}></div>
        <div className="profile-header" style={{ padding: '0 32px 32px', marginTop: '-50px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div className="profile-avatar-wrapper" style={{ position: 'relative' }}>
              <img 
                src={getAvatarUrl(profile?.avatar)} 
                alt="avatar" 
                style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--card-bg)', background: 'var(--bg-light)', objectFit: 'cover' }}
              />
            </div>
            
            <div className="profile-actions">
              {!isMyProfile ? (
                isFollowing ? (
                  <button className="btn btn-outline btn-modern" onClick={onUnfollow}>
                    ✓ Đã theo dõi
                  </button>
                ) : (
                  <button className="btn btn-primary btn-modern" onClick={onFollow}>
                    ➕ Theo dõi
                  </button>
                )
              ) : (
                <button className="btn btn-outline btn-modern" onClick={() => setIsEditing(true)}>
                  ✏️ Chỉnh sửa hồ sơ
                </button>
              )}
            </div>
          </div>

          <div className="profile-info" style={{ marginTop: '20px' }}>
            <h1 className="profile-name" style={{ fontSize: '2rem', margin: '0 0 4px 0' }}>{profile?.username || 'Đang tải...'}</h1>
            <p className="profile-email muted" style={{ margin: 0 }}>{profile?.email}</p>
            <p className="profile-bio" style={{ marginTop: '16px', fontSize: '1.05rem', lineHeight: 1.6 }}>{profile?.bio || 'Chưa cập nhật tiểu sử.'}</p>
            
            <div className="profile-meta" style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
              <span className="meta-item muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🎓 {profile?.school || 'Chưa cập nhật trường học'}</span>
              <span className="meta-item muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📅 Tham gia {new Date(profile?.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
            </div>

            <div className="stats-grid profile-stats" style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
              <div className="stat-item" style={{ textAlign: 'center', padding: '16px 24px', background: 'var(--bg-light)', borderRadius: 'var(--radius-md)', flex: 1 }}>
                <div className="stat-number" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{posts.length}</div>
                <span className="muted small">Bài viết</span>
              </div>
              <div className="stat-item" style={{ textAlign: 'center', padding: '16px 24px', background: 'var(--bg-light)', borderRadius: 'var(--radius-md)', flex: 1 }}>
                <div className="stat-number" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{followers.length}</div>
                <span className="muted small">Người theo dõi</span>
              </div>
              <div className="stat-item" style={{ textAlign: 'center', padding: '16px 24px', background: 'var(--bg-light)', borderRadius: 'var(--radius-md)', flex: 1 }}>
                <div className="stat-number" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{following.length}</div>
                <span className="muted small">Đang theo dõi</span>
              </div>
            </div>

            {msg && <div className={`profile-msg ${msg.includes('Lỗi') ? 'error' : 'success'}`} style={{ marginTop: '16px', padding: '12px', borderRadius: 'var(--radius-md)', background: msg.includes('Lỗi') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: msg.includes('Lỗi') ? 'var(--danger)' : 'var(--success)' }}>{msg}</div>}
          </div>
        </div>
      </div>

      <div className="profile-tabs" style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        <button 
          className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
          style={{ background: 'none', border: 'none', borderBottom: activeTab === 'posts' ? '2px solid var(--primary)' : '2px solid transparent', padding: '12px 16px', fontSize: '1.05rem', fontWeight: 600, color: activeTab === 'posts' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          📝 Bài viết ({posts.length})
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'posts' && (
          posts.length > 0 ? (
            <div className="list">
              {posts.map(post => (
                <article key={post._id} className="post-card fade-in">
                  <div className="post-content">
                    <div className="post-header">
                      <img src={`https://ui-avatars.com/api/?name=${post.authorName || 'User'}&background=random`} alt="Avatar" className="post-avatar" />
                      <div className="post-header-info">
                        <h4 style={{ margin: 0, fontWeight: 600 }}>{post.author?.username || 'Bạn'}</h4>
                        <p className="muted small" style={{ margin: 0, marginTop: '2px' }}>
                          <span className="tag" style={{ padding: '2px 8px', fontSize: '0.75rem', marginRight: '8px' }}>{post.subject || 'Chung'}</span>
                          {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    
                    <h3 className="section-title" style={{ marginTop: '16px', marginBottom: '8px', fontSize: '1.4rem' }}>
                      <Link to={`/posts/${post._id}`}>{post.title}</Link>
                    </h3>
                    <p style={{ color: 'var(--text-main)', lineHeight: 1.6 }}>{post.content.substring(0, 150)}...</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon" style={{ fontSize: '4rem', opacity: 0.3, marginBottom: '16px' }}>📝</div>
              <h3 className="section-title">Chưa có bài viết nào</h3>
              <p className="muted">Hãy tạo bài viết đầu tiên để chia sẻ kiến thức của bạn!</p>
              {isMyProfile && <Link to="/posts/new" className="btn btn-primary btn-modern" style={{ marginTop: '16px' }}>Tạo bài viết</Link>}
            </div>
          )
        )}
      </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="admin-modal-overlay" onClick={() => setIsEditing(false)}>
            <div className="admin-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
              <button type="button" className="admin-modal-close" onClick={() => setIsEditing(false)}>×</button>
              <h2 className="admin-modal-title" style={{ marginBottom: 0 }}>Chỉnh sửa hồ sơ</h2>
              
              <div className="profile-edit-banner">
                <div
                  className="profile-edit-cover"
                  style={{ background: editForm.coverPhoto ? `url(${getAvatarUrl(editForm.coverPhoto)}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
                >
                  <div className="profile-edit-overlay" onClick={() => coverInputRef.current?.click()}>
                    <span>📷 Thay đổi ảnh bìa</span>
                  </div>
                  <input type="file" hidden ref={coverInputRef} onChange={(e) => handleUploadImage(e, 'coverPhoto')} accept="image/*" />
                </div>
                
                <div className="profile-edit-avatar-wrapper">
                  <img src={getAvatarUrl(editForm.avatar)} alt="avatar" className="profile-edit-avatar-img" />
                  <div className="profile-edit-overlay" onClick={() => fileInputRef.current?.click()}>
                    <span>📷</span>
                  </div>
                  <input type="file" hidden ref={fileInputRef} onChange={(e) => handleUploadImage(e, 'avatar')} accept="image/*" />
                </div>
              </div>
  
              <form onSubmit={onSaveProfile} className="profile-edit-form">
                <div className="input-group">
                  <label>Tên hiển thị</label>
                  <input
                    className="input"
                    value={editForm.username}
                    onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label>Trường học</label>
                  <input
                    className="input"
                    value={editForm.school}
                    onChange={e => setEditForm(p => ({ ...p, school: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label>Tiểu sử</label>
                  <textarea
                    className="input"
                    rows="3"
                    value={editForm.bio}
                    onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Kể về bản thân và sở thích học tập..."
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)} disabled={uploading}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary btn-modern" disabled={uploading}>
                    {uploading ? 'Đang tải...' : '💾 Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
  );
}
