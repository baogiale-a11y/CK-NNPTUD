import { useEffect, useMemo, useState } from 'react';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const exportUsersToCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Username,Email,Role,Status,School\n' +
      users
        .map(
          (u) =>
            `"${u.username}","${u.email}","${u.role?.name || 'N/A'}",${u.isActive ? 'Active' : 'Blocked'},"${u.school || ''}"`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.reduce((acc, u) => acc + (u.isActive ? 1 : 0), 0);
    const blocked = total - active;
    return { total, active, blocked };
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await http.get('/users');
      setUsers(data?.data?.items || data?.data || []);
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Không tải được danh sách user');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data } = await http.get('/roles');
      setRoles(data?.data?.items || data?.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách roles', err);
    }
  };

  const setUserActive = async (id, nextIsActive) => {
    try {
      const { data } = await http.put(`/users/${id}`, { isActive: nextIsActive });
      const updated = data?.data;

      if (updated?._id) {
        setUsers((prev) => prev.map((u) => (u._id === id ? updated : u)));
      } else {
        setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: nextIsActive } : u)));
      }

      setSelectedUser((prev) => (prev?._id === id ? { ...(updated || prev), isActive: nextIsActive } : prev));

      alert(nextIsActive ? 'Mở khóa tài khoản thành công' : 'Khóa tài khoản thành công');

      await fetchUsers();
    } catch (err) {
      alert(err?.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const changeRole = async (id, roleId) => {
    try {
      const { data } = await http.put(`/users/${id}`, { role: roleId });
      const updated = data?.data;
      if (updated?._id) {
        setUsers((prev) => prev.map((u) => (u._id === id ? updated : u)));
      } else {
        await fetchUsers();
      }
      alert('Đổi phân quyền thành công');
    } catch (err) {
      alert(err?.response?.data?.message || 'Đổi phân quyền thất bại');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  if (loading)
    return (
      <div className="admin-loading fade-in">
        <div className="card">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu admin...</p>
        </div>
      </div>
    );

  return (
    <div className="admin-dashboard fade-in">
      {/* Hero Stats */}
      <div className="admin-hero">
        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-number" style={{ color: 'var(--text-main)' }}>
              {stats.total}
            </div>
            <div className="admin-stat-label">👥 Tổng Users</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-number" style={{ color: 'var(--success)' }}>
              {stats.active}
            </div>
            <div className="admin-stat-label">✅ Active</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-number" style={{ color: 'var(--danger)' }}>
              {stats.blocked}
            </div>
            <div className="admin-stat-label">🔒 Blocked</div>
          </div>
        </div>
      </div>

      {msg ? (
        <div className="admin-message card" role="alert">
          {msg}
        </div>
      ) : null}
 
      {/* Management Cards */}
      <div className="admin-grid">
        <div className="management-card card">
          <div className="card-header">

            <h2 className="section-title">👥 Quản lý Users</h2>
            <button className="btn btn-primary btn-small btn-modern" onClick={exportUsersToCSV}>
              📊 Export CSV
            </button>

          </div>
          <div className="table-container">
            <table className="admin-table hoverable">
              <thead>
                <tr>
                  <th style={{ width: '250px' }}>User Info</th>
                  <th style={{ width: '120px' }}>Role</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ width: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="user-row">
                    <td>
                      <div className="user-info">
                        <div className="user-avatar-small"></div>
                        <div>
                          <strong className="username">{u.username}</strong>
                          <br />
                          <span className="user-email muted small">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={u.role?._id || ''}
                        onChange={(e) => changeRole(u._id, e.target.value)}
                        className="role-select"
                      >
                        {roles.map(r => (
                          <option key={r._id} value={r._id}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="admin-status admin-status--active">✅ Active</span>
                      ) : (
                        <span className="admin-status admin-status--blocked">🔒 Blocked</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className={`btn ${u.isActive ? 'btn-danger' : 'btn-success'} btn-small`}
                          onClick={() => setUserActive(u._id, !u.isActive)}
                          disabled={String(u._id) === String(currentUser?._id)}
                          title={String(u._id) === String(currentUser?._id) ? "Không thể khóa tài khoản của chính mình" : ""}
                          style={{ opacity: String(u._id) === String(currentUser?._id) ? 0.5 : 1, cursor: String(u._id) === String(currentUser?._id) ? 'not-allowed' : 'pointer' }}
                        >
                          {u.isActive ? 'Khóa' : 'Mở khóa'}
                        </button>
                        <button
                          className="btn btn-outline btn-small"
                          title="View profile"
                          onClick={() => handleViewUser(u)}
                        >
                          👁️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>Chưa có người dùng nào</p>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {isModalOpen && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="admin-modal"
            style={{ backgroundColor: 'var(--card-bg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>
              ✕
            </button>
            <h2 className="admin-modal-title" style={{ color: 'var(--text-main)' }}>
              Thông tin người dùng
            </h2>
            <div className="admin-modal-body">
              <img
                src={
                  selectedUser.avatar
                    ? selectedUser.avatar.startsWith('http')
                      ? selectedUser.avatar
                      : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}/${selectedUser.avatar.replace(/\\/g, '/')}`
                    : `https://ui-avatars.com/api/?name=${selectedUser.username}&background=random`
                }
                alt="avatar"
                className="admin-modal-avatar"
              />
              <div className="admin-modal-fields" style={{ color: 'var(--text-main)' }}>
                <p className="admin-modal-field" style={{ borderColor: 'var(--border)' }}>
                  <strong>Tên hiển thị:</strong> {selectedUser.username}
                </p>
                <p className="admin-modal-field" style={{ borderColor: 'var(--border)' }}>
                  <strong>Email:</strong> {selectedUser.email}
                </p>
                <p className="admin-modal-field" style={{ borderColor: 'var(--border)' }}>
                  <strong>Phân quyền:</strong>{' '}
                  <span className="admin-modal-role">{selectedUser.role?.name || 'N/A'}</span>
                </p>
                <p className="admin-modal-field" style={{ borderColor: 'var(--border)' }}>
                  <strong>Trường học:</strong> {selectedUser.school || 'Chưa cập nhật'}
                </p>
                <p className="admin-modal-field" style={{ borderColor: 'var(--border)' }}>
                  <strong>Trạng thái:</strong>{' '}
                  {selectedUser.isActive ? (
                    <span className="admin-status admin-status--active">✅ Hoạt động</span>
                  ) : (
                    <span className="admin-status admin-status--blocked">🔒 Bị khóa</span>
                  )}
                </p>
                <p className="admin-modal-field" style={{ borderColor: 'transparent' }}>
                  <strong>Ngày tham gia:</strong> {new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
