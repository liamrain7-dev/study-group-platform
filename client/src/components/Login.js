import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to university page (but only after auth is done loading)
  // Only redirect if we're not in the middle of a login attempt
  useEffect(() => {
    if (!authLoading && user && !loading) {
      // Small delay to prevent flash of login page
      const timer = setTimeout(() => {
        navigate('/university');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, loading, navigate]);

  useEffect(() => {
    fetchTotalUsers();
  }, []);

  const fetchTotalUsers = async () => {
    try {
      const response = await api.get('/auth/stats/total');
      setTotalUsers(response.data.totalUsers);
    } catch (error) {
      // Silently fail - don't show error for stats
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/university');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Study Groups</h1>
        <h2>Login</h2>
        {totalUsers > 0 && (
          <p className="user-count-banner">
            {totalUsers} {totalUsers === 1 ? 'student' : 'students'} already using Study Groups!
          </p>
        )}
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

