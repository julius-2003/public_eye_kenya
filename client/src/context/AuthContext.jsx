import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../api.js';

const AuthContext = createContext(null);
let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('pe_token'));
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    if (token) {
      fetchMe();
      // Connect to socket for real-time updates
      connectSocket(token);
    } else {
      setLoading(false);
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    }
  }, [token]);

  const connectSocket = (authToken) => {
    if (socket && socket.connected) return;
    
    // Destroy previous socket if exists
    if (socket) {
      socket.disconnect();
    }
    
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: authToken },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 15,
      transports: ['websocket', 'polling'],
      upgrade: true,
      forceNew: false,
      multiplex: true
    });

    socket.on('connect', () => {
      console.log('✓ Socket connected for real-time updates');
      setSocketConnected(true);
      reconnectAttempts = 0;
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
      reconnectAttempts++;
      // Don't logout on connection error - keep user logged in even if socket fails
      if (err.message === 'Invalid or expired token') {
        // Token is invalid, will handle on next page refresh
        console.log('⚠️ Socket token invalid - will re-authenticate on refresh');
      }
    });

    // Listen for role updates
    socket.on('role_updated', (data) => {
      console.log('📢 Role updated event received:', data);
      setUser(prev => ({
        ...prev,
        role: data.role,
        isVerifiedCountyAdmin: data.isVerifiedCountyAdmin,
        assignedCounty: data.assignedCounty
      }));
    });

    socket.on('disconnect', (reason) => {
      console.log('✗ Socket disconnected:', reason);
      setSocketConnected(false);
      // Automatically reconnect on disconnect (except for explicit disconnect)
      if (reason === 'io server disconnect') {
        socket?.connect();
      }
    });

    socket.on('error', (err) => {
      console.warn('Socket error:', err);
      // Non-critical errors - don't interrupt user experience
    });
  };

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch (err) {
      // If token is invalid, logout
      if (err.response?.status === 401) {
        console.warn('Token invalid, logging out');
        logout();
      } else {
        // Network error or server error - allow page to continue
        console.warn('Failed to fetch user (non-critical):', err.message);
        // Try to set something from cached data if available
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('pe_token', data.token);
    return data;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSocketConnected(false);
    localStorage.removeItem('pe_token');
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  };

  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }));

  return (
    <AuthContext.Provider value={{ user, token, loading, socketConnected, login, register, logout, updateUser, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
