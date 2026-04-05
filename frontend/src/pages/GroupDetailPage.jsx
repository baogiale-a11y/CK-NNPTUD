import { useParams } from 'react-router-dom';

export default function GroupDetailPage() {
  const { id } = useParams();

  return (
    <div className="card">
      <h2>Group Detail #{id}</h2>
      <p className="muted">Thông tin nhóm + thành viên + bài viết trong nhóm.</p>
    </div>
  );
}
