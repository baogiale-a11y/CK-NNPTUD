import { Link } from 'react-router-dom';

export default function GroupsPage() {
  return (
    <div className="card">
      <h2>Groups</h2>
      <p className="muted">Danh sách nhóm học tập.</p>
      <ul>
        <li><Link to="/groups/1">Nhóm Toán</Link></li>
      </ul>
    </div>
  );
}
