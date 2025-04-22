import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // 组件挂载时获取用户信息
    const initialUserFetch = async () => {
      setLoading(true);
      try {
        console.log('获取用户信息...');
        const response = await api.get('/api/auth/me');
        console.log('获取到的用户数据:', response.data);
        setUser(response.data);
        setError(null);
      } catch {
        // 未登录状态是正常的，不需要显示错误
        setUser(null);
        console.log('用户未登录或会话已过期');
      } finally {
        setLoading(false);
        setInitialized(true); // 标记初始化完成
      }
    };

    initialUserFetch();
  }, []);

  const fetchUser = async () => {
    if (loading) return; // 如果正在加载中，不重复获取
    
    setLoading(true);
    try {
      console.log('刷新用户信息...');
      const response = await api.get('/api/auth/me');
      setUser(response.data);
      setError(null);
    } catch {
      // 未登录状态是正常的，不需要显示错误
      setUser(null);
      console.log('用户未登录或会话已过期');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', credentials);
      setUser(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || '登录失败，请稍后重试';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/register', userData);
      setUser(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || '注册失败，请稍后重试';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/api/auth/logout');
      setUser(null);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || '登出失败，请稍后重试';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error,
      login, 
      register, 
      logout,
      fetchUser,
      initialized
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 