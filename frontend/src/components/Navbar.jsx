import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { alertApi } from '../api';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnreadAlerts = async () => {
      try {
        const res = await alertApi.list({ unread_only: true });
        if (res.data && res.data.data) {
          setUnreadCount(res.data.data.length);
        }
      } catch (err) {
        // Silently catch background polling errors
      }
    };

    fetchUnreadAlerts();
    const interval = setInterval(fetchUnreadAlerts, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        <NavLink to={isAuthenticated ? "/dashboard" : "/login"} className="nav-brand">
          <div className="nav-logo-icon">🐾</div>
          <div className="nav-title-group">
            <span className="nav-title">Smart Pet Tracking</span>
            <span className="nav-subtitle">Anurag University &bull; Data Science Capstone</span>
          </div>
        </NavLink>

        {isAuthenticated ? (
          <>
            <nav>
              <ul className="nav-links">
                <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink></li>
                <li><NavLink to="/add-pet" className={({ isActive }) => isActive ? 'active' : ''}>+ Add Pet</NavLink></li>
                <li><NavLink to="/tracking" className={({ isActive }) => isActive ? 'active' : ''}>Tracking Map</NavLink></li>
                <li><NavLink to="/safe-zone" className={({ isActive }) => isActive ? 'active' : ''}>Safe-Zone Settings</NavLink></li>
                <li>
                  <NavLink to="/alerts" className={({ isActive }) => isActive ? 'active' : ''}>
                    Alerts {unreadCount > 0 && <span className="badge badge-outside" style={{ padding: '2px 6px', fontSize: '10px' }}>{unreadCount}</span>}
                  </NavLink>
                </li>
                <li><NavLink to="/history" className={({ isActive }) => isActive ? 'active' : ''}>Movement History</NavLink></li>
                <li><NavLink to="/risk" className={({ isActive }) => isActive ? 'active' : ''}>Escape Risk</NavLink></li>
                <li><NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>Profile</NavLink></li>
              </ul>
            </nav>

            <div className="nav-user-menu">
              <span className="nav-user-badge">{user?.name || 'Student'}</span>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">Logout</button>
            </div>
          </>
        ) : (
          <div className="nav-user-menu">
            <NavLink to="/login" className="btn btn-outline btn-sm">Login</NavLink>
            <NavLink to="/register" className="btn btn-primary btn-sm">Register</NavLink>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
