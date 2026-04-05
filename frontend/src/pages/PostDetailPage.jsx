import { useParams } from 'react-router-dom';

export default function PostDetailPage() {
  const { id } = useParams();

  return (
    <div className="card">
      <h2>Post Detail #{id}</h2>
      <p className="muted">Chi tiết bài đăng và comments.</p>
    </div>
  );
}
