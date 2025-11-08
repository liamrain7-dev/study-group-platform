import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './components/Login';
import Register from './components/Register';
import UniversityPage from './components/UniversityPage';
import ClassPage from './components/ClassPage';
import MyGroups from './components/MyGroups';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // If loading takes too long, redirect to homepage
  React.useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        // Redirect to homepage if loading takes more than 4 seconds
        window.location.href = '/university';
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="loading">
        <div>Loading...</div>
        <div style={{ fontSize: '0.8rem', marginTop: '10px', opacity: 0.7 }}>
          Redirecting to homepage...
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/university"
                element={
                  <PrivateRoute>
                    <UniversityPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/class/:id"
                element={
                  <PrivateRoute>
                    <ClassPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-groups"
                element={
                  <PrivateRoute>
                    <MyGroups />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
