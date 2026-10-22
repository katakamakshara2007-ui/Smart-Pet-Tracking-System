import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { petApi } from '../api';
import LeafletMap from '../components/LeafletMap';

const PetDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const fetchPet = async () => {
    try {
      const res = await petApi.get(id);
      if (res.data && res.data.data) {
        setPet(res.data.data);
        setEditForm(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve pet profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPet();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to remove ${pet.name}? All tracking history and alerts will be permanently removed.`)) {
      try {
        await petApi.delete(id);
        navigate('/dashboard');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete pet.');
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await petApi.update(id, editForm);
      setPet(res.data.data);
      setIsEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update pet profile.');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>Loading pet profile...</div>;
  }

  if (error || !pet) {
    return (
      <div className="alert-banner alert-danger" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <span>{error || 'Pet not found.'}</span>
        <Link to="/dashboard" className="btn btn-outline btn-sm" style={{ marginLeft: '1rem' }}>Return to Dashboard</Link>
      </div>
    );
  }

  const loc = pet.latest_location;
  const sz = pet.safe_zone;

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1>{pet.name}</h1>
            {pet.status === 'INSIDE' && <span className="badge badge-inside">Inside Safe Zone</span>}
            {pet.status === 'OUTSIDE' && <span className="badge badge-outside">🚨 Outside Safe Zone</span>}
          </div>
          <p>{pet.species} &bull; {pet.breed || 'Standard'} &bull; Registered ID #{pet.id}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setIsEditing(!isEditing)} className="btn btn-outline btn-sm">
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
          <button onClick={handleDelete} className="btn btn-danger btn-sm">
            Delete Pet
          </button>
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link to={`/tracking?petId=${pet.id}`} className="btn btn-primary btn-sm">
          🛰️ Live Tracking Map &amp; Simulator
        </Link>
        <Link to={`/history?petId=${pet.id}`} className="btn btn-outline btn-sm">
          📜 Movement Breadcrumb History
        </Link>
        <Link to={`/risk?petId=${pet.id}`} className="btn btn-outline btn-sm">
          📊 Escape-Risk Assessment
        </Link>
        <Link to={`/safe-zone?petId=${pet.id}`} className="btn btn-outline btn-sm">
          ⚙️ Configure Safe Zone
        </Link>
        <Link to={`/alerts?petId=${pet.id}`} className="btn btn-outline btn-sm">
          🔔 View Escape Alerts
        </Link>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdate} className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Edit Pet Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pet Name</label>
              <input
                type="text"
                className="form-control"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Species</label>
              <input
                type="text"
                className="form-control"
                value={editForm.species || ''}
                onChange={(e) => setEditForm({ ...editForm, species: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Breed</label>
              <input
                type="text"
                className="form-control"
                value={editForm.breed || ''}
                onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Age (years)</label>
              <input
                type="number"
                className="form-control"
                value={editForm.age ?? ''}
                onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <input
                type="text"
                className="form-control"
                value={editForm.gender || ''}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows="3"
              className="form-control"
              value={editForm.description || ''}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsEditing(false)} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">Save Changes</button>
          </div>
        </form>
      ) : null}

      {/* Profile Overview & Current Status Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Profile Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Profile Summary</div>
          </div>
          <table className="data-table">
            <tbody>
              <tr>
                <th style={{ width: '35%' }}>Species</th>
                <td>{pet.species}</td>
              </tr>
              <tr>
                <th>Breed</th>
                <td>{pet.breed || 'Not specified'}</td>
              </tr>
              <tr>
                <th>Age</th>
                <td>{pet.age ? `${pet.age} years old` : 'Unknown'}</td>
              </tr>
              <tr>
                <th>Gender</th>
                <td>{pet.gender || 'Not specified'}</td>
              </tr>
              <tr>
                <th>Description</th>
                <td>{pet.description || 'No description notes.'}</td>
              </tr>
              <tr>
                <th>Registration Date</th>
                <td>{pet.created_at ? new Date(pet.created_at).toLocaleDateString() : 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Current Geofence Status */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Current Geofence Status</div>
            <span className="badge badge-simulated">GPS Status</span>
          </div>
          <table className="data-table">
            <tbody>
              <tr>
                <th style={{ width: '40%' }}>Boundary State</th>
                <td>
                  {pet.status === 'INSIDE' && <span className="badge badge-inside">Safe Inside</span>}
                  {pet.status === 'OUTSIDE' && <span className="badge badge-outside">Perimeter Breached</span>}
                  {pet.status === 'UNKNOWN' && <span className="badge">No Coordinates</span>}
                </td>
              </tr>
              <tr>
                <th>Distance to Center</th>
                <td>{loc ? `${loc.distance_from_center} meters` : 'N/A'}</td>
              </tr>
              <tr>
                <th>Safe-Zone Radius</th>
                <td>{sz ? `${sz.radius_meters} meters` : '100 meters'}</td>
              </tr>
              <tr>
                <th>Current Lat/Lon</th>
                <td>{loc ? `${loc.latitude?.toFixed(6)}, ${loc.longitude?.toFixed(6)}` : 'N/A'}</td>
              </tr>
              <tr>
                <th>Last Update Time</th>
                <td>{loc?.timestamp ? new Date(loc.timestamp).toLocaleString() : 'N/A'}</td>
              </tr>
              <tr>
                <th>Fix Source</th>
                <td>{loc?.is_simulated ? 'Simulated GPS Generator' : 'Hardware GPS Receiver'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mini Preview Map */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Geofence Territory Preview</div>
          <Link to={`/tracking?petId=${pet.id}`} style={{ fontSize: '0.82rem' }}>Open Full Live Tracking &rarr;</Link>
        </div>
        <div className="map-card-wrapper" style={{ height: '320px' }}>
          {sz ? (
            <LeafletMap
              center={[parseFloat(sz.center_latitude), parseFloat(sz.center_longitude)]}
              safeZone={sz}
              currentLocation={loc ? { ...loc, pet_name: pet.name } : null}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              No safe-zone configured yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetDetailsPage;
