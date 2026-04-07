import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [followingIds, setFollowingIds] = useState([]);
  const { isAuthenticated, user: currentUser } = useAuth();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await http.get('/users', { params: { search: keyword, limit: 50 } });
      let list = data?.data?.items || data?.data || [];
      
      if (currentUser?._id) {
        list = list.filter(u => String(u._id) !== String(currentUser._id));
      }
      setUsers(list);

      if (isAuthenticated && currentUser?._id) {
        const followingRes = await http.get(`/follows/${currentUser._id}/following`);
        const fList = followingRes.data?.data?.items || followingRes.data?.data || [];
        setFollowingIds(fList.map(f => typeof f.following === 'string' ? f.following : f.following?._id).filter(Boolean));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [keyword, isAuthenticated, currentUser?._id]);

  const toggleFollow = async (uId) => {
    if (!isAuthenticated) return alert('Vui lòng đăng nhập!');
    const isFollowing = followingIds.includes(String(uId));
    try {
      if (isFollowing) {
        await http.delete(`/follows/${uId}`);
        setFollowingIds(prev => prev.filter(id => String(id) !== String(uId)));
      } else {
        await http.post(`/follows/${uId}`);
        setFollowingIds(prev => [...prev, String(uId)]);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Lỗi follow');
    }
  };

  return (
    <div className="fade-in" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>👥 Danh sách người dùng</h1>
        <input 
          className="input" 
          placeholder="🔍 Tìm kiếm người dùng..." 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: '300px' }}
        />
      </div>

      {loading ? (
        <div className="grid grid-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '200px' }}></div>)}
        </div>
      ) : users.length > 0 ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {users.map(u => {
            const isFollowing = followingIds.includes(String(u._id));
            return (
              <div key={u._id} className="card fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px' }}>
                <img 
                  src={`https://ui-avatars.com/api/?name=${u.username}&background=random`} 
                  alt={u.username} 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '16px' }}
                />
                <h3 style={{ margin: '0 0 8px 0' }}><Link to={`/profile/${u._id}`} style={{ color: 'var(--text-main)', textDecoration: 'none' }}>{u.username}</Link></h3>
                <p className="muted small" style={{ margin: '0 0 16px 0' }}>{u.email}</p>
                
                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                  <button 
                    className="btn btn-outline" 
                    title="Nhắn tin"
                    style={{ flex: 1 }}
                    onClick={() => navigate(`/messages?to=${u._id}`)}
                  >
                    💬 Nhắn tin
                  </button>
                  <button 
                    className={`btn ${isFollowing ? 'btn-outline' : 'btn-primary'}`} 
                    style={{ flex: 1 }}
                    onClick={() => toggleFollow(u._id)}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <p className="muted">Không tìm thấy người dùng nào.</p>
        </div>
      )}
    </div>
  );
}
