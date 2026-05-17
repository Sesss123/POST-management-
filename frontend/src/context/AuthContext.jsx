import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { initSocket, disconnectSocket } from '../api/socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await apiClient.get('/auth/me');
          if (data.success) {
            setUser(data.data);
            localStorage.setItem('user', JSON.stringify(data.data));
            initSocket(data.data.shop_id);
          }
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      if (data.success && !data.require2FA) {
        setUser(data.data);
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        initSocket(data.data.shop_id);
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const verify2FA = async (tempId, otp) => {
    try {
      const { data } = await apiClient.post('/auth/verify-2fa', { tempId, otp });
      if (data.success) {
        setUser(data.data);
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        initSocket(data.data.shop_id);
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
  };

  const forgotPassword = async (email) => {
    return await apiClient.post('/auth/forgot-password', { email });
  };

  const resetPassword = async (token, password) => {
    return await apiClient.post(`/auth/reset-password/${token}`, { password });
  };

  return (
    <AuthContext.Provider value={{ user, login, verify2FA, logout, forgotPassword, resetPassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
