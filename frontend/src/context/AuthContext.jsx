import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import http from '../api/http';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      http.get('/auth/me')
        .then(res => {
          const u = res.data?.data || res.data;
          setUser(u);
        })
        .catch(() => {
          localStorage.clear();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

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
      loading,
      isAuthenticated: Boolean(localStorage.getItem('accessToken')),
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

