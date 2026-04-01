'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import Cookies from 'js-cookie';
import { connectSocket, disconnectSocket, socket } from '@/lib/socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('accessToken');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data.user);
          connectSocket();
        } catch (error) {
          console.error('Auth initialization failed', error);
          Cookies.remove('accessToken');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();

    return () => {
      disconnectSocket();
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, user: userData } = res.data.data;
    Cookies.set('accessToken', accessToken, { 
      expires: 30, 
      secure: true, 
      sameSite: 'none' 
    }); // 30 days
    setUser(userData);
    connectSocket();
    return res.data.data;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { accessToken, user: newUser } = res.data.data;
    Cookies.set('accessToken', accessToken, { 
      expires: 30, 
      secure: true, 
      sameSite: 'none' 
    });
    setUser(newUser);
    connectSocket();
    return res.data.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch(err) {
      console.error(err);
    }
    Cookies.remove('accessToken');
    setUser(null);
    disconnectSocket();
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    setUser(res.data.data.user);
    return res.data.data;
  };

  const updatePassword = async (data) => {
    const res = await api.put('/auth/change-password', data);
    // Password update doesn't return a new token in this backend implementation
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isChef: user?.role === 'chef' || user?.role === 'admin',
        isAdmin: user?.role === 'admin',
        loading,
        login,
        register,
        logout,
        updateProfile,
        updatePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
