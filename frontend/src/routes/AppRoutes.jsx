import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import FeedPage from '../pages/FeedPage';
import PostDetailPage from '../pages/PostDetailPage';
import CreatePostPage from '../pages/CreatePostPage';
import ProfilePage from '../pages/ProfilePage';
import GroupsPage from '../pages/GroupsPage';
import GroupDetailPage from '../pages/GroupDetailPage';
import MessagesPage from '../pages/MessagesPage';
import AdminPage from '../pages/AdminPage';
import NotificationsPage from '../pages/NotificationsPage';
import UsersPage from '../pages/UsersPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/" element={<FeedPage />} />
      <Route path="/posts/:id" element={<PostDetailPage />} />
      <Route
        path="/posts/new"
        element={
          <ProtectedRoute>
            <CreatePostPage />
          </ProtectedRoute>
        }
      />
      <Route path="/profile/:id" element={<ProfilePage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="/groups/:id" element={<GroupDetailPage />} />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
