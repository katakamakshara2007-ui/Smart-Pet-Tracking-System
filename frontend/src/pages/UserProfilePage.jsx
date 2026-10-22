import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authApi.getProfile();
        if (res.data && res.data.data) {
          const d = res.data.data;
          setProfileData(d);
          setName(d.user.name || '');
          setPhone(d.user.phone || '');
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const payload = { name, phone };
      if (newPassword) payload.new_password = newPassword;

      const res = await authApi.updateProfile(payload);
      setFeedback({ type: 'success', text: 'Profile updated successfully!' });
      setNewPassword('');
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>Loading profile...</div>;
  }

  const u = profileData?.user || user;
  const project = profileData?.project_info || {
    system: 'Smart Pet Tracking and Escape Prediction System',
    institution: 'Anurag University',
    department: 'Department of Data Science',
    project_type: 'B.Tech Final Year Capstone Project',
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-title-block">
          <h1>User Account &amp; System Info</h1>
          <p>Researcher credentials, account settings, and university project details</p>
        </div>

        <button onClick={handleLogout} className="btn btn-outline btn-sm" style={{ color: '#dc2626' }}>
          Sign Out
        </button>
      </div>

      {feedback && (
        <div className={`alert-banner alert-${feedback.type}`}>
          <span>{feedback.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(280px, 1fr)', gap: '1.5rem' }}>
        {/* Profile Settings Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Account Details</div>
            <span className="badge badge-inside">Active Session</span>
          </div>

          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Read-only)</label>
              <input
                type="email"
                className="form-control"
                value={u?.email || ''}
                disabled
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
              />
              <small style={{ color: 'var(--text-muted)' }}>Email is bound to your university account login.</small>
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="tel"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Change Password (Leave blank to keep current)</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (optional)"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={saving}>
              {saving ? 'Updating Account...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Project Capstone Metadata Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Capstone Project Details</div>
            <span className="badge badge-simulated">B.Tech DS</span>
          </div>

          <table className="data-table">
            <tbody>
              <tr>
                <th style={{ width: '38%' }}>Project</th>
                <td style={{ fontWeight: 600, color: 'var(--navy-primary)' }}>{project.system}</td>
              </tr>
              <tr>
                <th>Institution</th>
                <td>{project.institution}</td>
              </tr>
              <tr>
                <th>Department</th>
                <td>{project.department}</td>
              </tr>
              <tr>
                <th>Project Type</th>
                <td>{project.project_type}</td>
              </tr>
              <tr>
                <th>Backend Architecture</th>
                <td>Python 3.10+ / Flask / SQLAlchemy / PyMySQL</td>
              </tr>
              <tr>
                <th>Database</th>
                <td>MySQL 8 (`smart_pet_tracking`)</td>
              </tr>
              <tr>
                <th>Authentication</th>
                <td>JWT Token (Bearer Authorization)</td>
              </tr>
              <tr>
                <th>Frontend Stack</th>
                <td>React 18 / Vite / Leaflet / OpenStreetMap</td>
              </tr>
              <tr>
                <th>Total Pets</th>
                <td>{profileData?.stats?.total_pets || 0} registered</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
