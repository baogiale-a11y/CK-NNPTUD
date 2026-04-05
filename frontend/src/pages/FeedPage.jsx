import { Link } from 'react-router-dom';

export default function FeedPage() {
  return (
    <div className="card">
      <h2>Feed</h2>
      <p className="muted">Trang bảng tin bài đăng.</p>
      <ul>
        <li><Link to="/posts/1">Bài đăng</Link></li>
      </ul>
    </div>
  );
}
