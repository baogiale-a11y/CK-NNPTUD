import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import socket from '../socket/socket';
import http from '../api/http';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchUnreadStats = () => {
    if (!isAuthenticated) return;
    
    http.get('/notifications')
      .then(res => {
        const unread = (res.data?.data?.items || res.data?.data || []).filter(n => !n.isRead).length;
        setNotifications(unread);
      }).catch(console.error);

    http.get('/messages/conversations')
      .then(res => {
        const convos = res.data?.data || [];
        let mCount = 0;
        convos.forEach(c => {
          if (c.lastMessage && !c.lastMessage.isRead && String(c.lastMessage.receiver?._id || c.lastMessage.receiver) === String(user?._id)) {
            mCount++;
          }
        });
        setUnreadMessagesCount(mCount);
      }).catch(console.error);
  };

  useEffect(() => {
    const handleMessagesRead = () => fetchUnreadStats();
    window.addEventListener('messages:read', handleMessagesRead);
    return () => window.removeEventListener('messages:read', handleMessagesRead);
  }, [user?._id]);

  useEffect(() => {
    fetchUnreadStats();

    if (isAuthenticated) {
      const handleNewNotification = () => setNotifications(n => n + 1);
      const handleNewMessage = (payload) => {
        if (payload.receiver === user?._id || payload.receiver?._id === user?._id) {
          setUnreadMessagesCount(n => n + 1);
        }
      };

      socket.on('notification:new', handleNewNotification);
      socket.on('message:receive', handleNewMessage);
      
      return () => {
        socket.off('notification:new', handleNewNotification);
        socket.off('message:receive', handleNewMessage);
      };
    }
  }, [isAuthenticated, user?._id]);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true';
    setIsDark(saved);
    document.documentElement.classList.toggle('dark', saved);
  }, []);

  const toggleDark = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('darkMode', newDark);
    document.documentElement.classList.toggle('dark', newDark);
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar-modern">
      <div className="nav-container">
        <Link to="/" className="logo">
          <span className="logo-icon">📚</span>
          StudyTogether
        </Link>

        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/')}`}>🏠 Feed</Link>
          <Link to="/groups" className={`nav-link ${isActive('/groups')}`}>👥 Groups</Link>
          <Link to="/messages" className={`nav-link ${isActive('/messages')}`} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Messages
            {unreadMessagesCount > 0 && (
              <span className="notification-badge pulse" style={{ position: 'static', transform: 'none', marginLeft: '4px' }}>
                {unreadMessagesCount}
              </span>
            )}
          </Link>
          {isAuthenticated && (
            <Link to="/posts/new" className={`nav-link ${isActive('/posts/new')}`}>
              ➕ Tạo bài
            </Link>
          )}
        </div>

        <div className="nav-actions">
          <button className="btn btn-icon btn-modern" onClick={toggleDark} title="Chế độ tối">
            {isDark ? '☀️' : '🌙'}
          </button>

          {isAuthenticated ? (
            <>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <button
                  className="btn btn-icon btn-modern"
                  title={`${notifications} thông báo mới`}
                  style={{ overflow: 'visible' }}
                  onClick={() => {
                    navigate('/notifications');
                    if (notifications > 0) {
                      http.put('/notifications/read-all').then(() => setNotifications(0)).catch(console.error);
                    }
                  }}
                >
                  🔔
                  {notifications > 0 && <span className="notification-badge">{notifications}</span>}
                </button>
              </div>

              <div className="user-menu">
                <div 
                  className="user-avatar" 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  title="Tùy chọn tài khoản"
                >
                  <img 
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=2563eb&color=fff`} 
                    alt="Avatar" 
                    className="avatar-img"
                  />
                  <span className="username">{user?.username?.slice(0,12)}{user?.username?.length > 12 ? '...' : ''}</span>
                </div>

                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <button onClick={() => { setDropdownOpen(false); navigate('/profile/' + user._id); }} className="dropdown-item">
                      👤 Hồ sơ cá nhân
                    </button>
                {(user?.role?.name === 'admin' || user?.role === 'admin') && (
                  <Link to="/admin" onClick={() => setDropdownOpen(false)} className="dropdown-item" style={{ display: 'block', textDecoration: 'none' }}>
                    ⚙️ Admin Dashboard
                  </Link>
                    )}
                    <button onClick={handleLogout} className="dropdown-item danger">
                      🚪 Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline btn-modern small">Đăng nhập</Link>
              <Link to="/register" className="btn btn-primary btn-modern">Đăng ký</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
