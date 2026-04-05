import { useParams } from 'react-router-dom';

export default function ProfilePage() {
  const { id } = useParams();

  return (
    <div className="card">
      <h2>Profile {id}</h2>
      <p className="muted">Thông tin cá nhân, followers, following.</p>
    </div>
  );
}
