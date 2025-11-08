import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    universityId: '',
  });
  const [universities, setUniversities] = useState([]);
  const [filteredUniversities, setFilteredUniversities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUniversities();
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

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUniversities([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = universities.filter(uni =>
      uni.name.toLowerCase().includes(query)
    ).slice(0, 10); // Limit to 10 results
    setFilteredUniversities(filtered);
  }, [searchQuery, universities]);

  const fetchUniversities = async () => {
    try {
      const response = await api.get('/universities');
      setUniversities(response.data);
    } catch (err) {
      setError('Failed to load universities. Please refresh the page.');
    } finally {
      setLoadingUniversities(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUniversitySearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowResults(true);
    if (!value) {
      setSelectedUniversity(null);
      setFormData({ ...formData, universityId: '' });
    }
  };

  const handleUniversitySelect = (university) => {
    setSelectedUniversity(university);
    setSearchQuery(university.name);
    setFormData({ ...formData, universityId: university._id });
    setShowResults(false);
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i}>{part}</mark>
      ) : (
        part
      )
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowResults(false);
      }
    };

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResults]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.universityId || !selectedUniversity) {
      setError('Please select a university from the search results');
      return;
    }

    setLoading(true);

    try {
      await register(
        formData.email,
        formData.password,
        formData.name,
        formData.universityId
      );
      navigate('/university');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Study Groups</h1>
        <h2>Create Account</h2>
        {totalUsers > 0 && (
          <p className="user-count-banner">
            Join {totalUsers} {totalUsers === 1 ? 'student' : 'students'} already using Study Groups!
          </p>
        )}
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="Enter your password (min 6 characters)"
            />
          </div>
          <div className="form-group">
            <label>University</label>
            {loadingUniversities ? (
              <div className="loading-text">Loading universities...</div>
            ) : (
              <div className="search-container">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleUniversitySearch}
                  onFocus={() => setShowResults(true)}
                  placeholder="Search for your university..."
                  className="search-input"
                  required
                />
                {showResults && filteredUniversities.length > 0 && (
                  <div className="search-results">
                    {filteredUniversities.map((university) => (
                      <div
                        key={university._id}
                        className="search-result-item"
                        onClick={() => handleUniversitySelect(university)}
                      >
                        {highlightMatch(university.name, searchQuery)}
                      </div>
                    ))}
                  </div>
                )}
                {showResults && searchQuery && filteredUniversities.length === 0 && (
                  <div className="search-results">
                    <div className="search-result-item no-results">
                      No universities found matching "{searchQuery}"
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

