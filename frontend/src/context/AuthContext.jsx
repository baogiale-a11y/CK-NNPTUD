import { createContext, useContext, useMemo, useState } from 'react';
import http from '../api/http';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    const { data } = await http.post('/auth/login', { email, password });
    const payload = data?.data || data;
    if (payload?.accessToken) localStorage.setItem('accessToken', payload.accessToken);
    if (payload?.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken);
    if (payload?.user) setUser(payload.user);
    return data;
  };

  const register = async (body) => {
    const { data } = await http.post('/auth/register', body);
    return data;
  };

  const logout = async () => {
    try {
      await http.post('/auth/logout', {
        refreshToken: localStorage.getItem('refreshToken'),
      });
    } catch (_) {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      setUser,
      login,
      register,
      logout,
      isAuthenticated: Boolean(localStorage.getItem('accessToken')),
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
