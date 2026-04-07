import { useEffect, useState } from 'react';
import http from '../api/http';
import { Link } from 'react-router-dom';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http.get('/notifications')
      .then(res => {
        setNotifications(res.data?.data?.items || res.data?.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const onClear = async () => {
    try {
      await http.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '24px' }}>
      <h1 className="page-title">Thông báo</h1>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button onClick={onClear} className="btn btn-outline small">Đánh dấu tất cả đã đọc</button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : notifications.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map(n => (
            <div key={n._id} style={{ padding: '16px', background: n.isRead ? 'var(--bg-light)' : 'var(--bg-light-accent)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>{n.title}</div>
                <div className="muted small">{new Date(n.createdAt).toLocaleString('vi-VN')}</div>
              </div>
              <div style={{ margin: '8px 0' }}>{n.message}</div>
              {n.link && (
                <Link to={n.link} style={{ color: 'var(--primary)' }}>Xem chi tiết</Link>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="muted text-center">Không có thông báo mới.</p>
      )}
    </div>
  );
}
