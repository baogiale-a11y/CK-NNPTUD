import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="navbar">
      <strong>StudyTogether</strong>
      <Link to="/">Feed</Link>
      <Link to="/groups">Groups</Link>
      <Link to="/messages">Messages</Link>
      <Link to="/posts/new">Create Post</Link>
      <Link to="/admin">Admin</Link>
      {!isAuthenticated ? (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      ) : (
        <button className="secondary" onClick={logout}>Logout</button>
      )}
    </nav>
  );
}
