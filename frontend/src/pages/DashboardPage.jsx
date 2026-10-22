import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api';
import LeafletMap from '../components/LeafletMap';

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const res = await dashboardApi.getStats();
      if (res.data && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll dashboard updates every 10 seconds
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
        Loading dashboard metrics from Flask backend...
      </div>
    );
  }

  const summary = data?.summary || {
    total_pets: 0,
    pets_inside: 0,
    pets_outside: 0,
    active_alerts: 0,
  };
  const pets = data?.pets || [];
  const recentAlerts = data?.recent_alerts || [];

  // Extract markers for all pets that have locations
  const mapMarkers = pets
    .filter((p) => p.latest_location)
    .map((p) => ({
      id: p.id,
      name: p.name,
      species: p.species,
      status: p.status,
      latitude: p.latest_location.latitude,
      longitude: p.latest_location.longitude,
    }));

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-block">
          <h1>System Overview Dashboard</h1>
          <p>Real-time geofence surveillance, boundary monitoring, and pet statuses</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/add-pet" className="btn btn-primary">
            + Register New Pet
          </Link>
          <Link to="/tracking" className="btn btn-outline">
            🛰️ Live Tracking Map
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-danger">
          <span>{error}</span>
        </div>
      )}

      {/* Active Alerts Banner if any */}
      {summary.active_alerts > 0 && (
        <div className="alert-banner alert-danger">
          <div>
            <strong>⚠️ Geofence Attention Required:</strong> {summary.active_alerts} unread escape alert(s) registered!
          </div>
          <Link to="/alerts" className="btn btn-sm" style={{ backgroundColor: '#ffffff', color: '#b91c1c' }}>
            Review Alerts &rarr;
          </Link>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            🐾
          </div>
          <div>
            <div className="stat-val">{summary.total_pets}</div>
            <div className="stat-lbl">Registered Pets</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
            🛡️
          </div>
          <div>
            <div className="stat-val" style={{ color: '#16a34a' }}>{summary.pets_inside}</div>
            <div className="stat-lbl">Inside Safe Zones</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
            🚨
          </div>
          <div>
            <div className="stat-val" style={{ color: '#dc2626' }}>{summary.pets_outside}</div>
            <div className="stat-lbl">Outside / Escape Risk</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            🔔
          </div>
          <div>
            <div className="stat-val" style={{ color: '#d97706' }}>{summary.active_alerts}</div>
            <div className="stat-lbl">Active Unread Alerts</div>
          </div>
        </div>
      </div>

      {/* Map Showing Latest Pet Locations */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Live Geolocation Fleet Map</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Displaying latest reported coordinates across all registered pets
            </span>
          </div>
          <span className="badge badge-simulated">OpenStreetMap &bull; Leaflet</span>
        </div>

        <div className="map-card-wrapper" style={{ height: '360px' }}>
          {mapMarkers.length > 0 ? (
            <LeafletMap markers={mapMarkers} zoom={15} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              No location coordinates recorded yet. Click "+ Register New Pet" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Pet Cards Grid & Recent Alerts Side-by-Side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Pet Cards Section */}
        <div>
          <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div className="card-title">Your Registered Pets ({pets.length})</div>
          </div>

          {pets.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No pets registered to your account yet.</p>
              <Link to="/add-pet" className="btn btn-primary btn-sm">Add First Pet</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pets.map((pet) => (
                <div key={pet.id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          backgroundColor: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.3rem',
                        }}
                      >
                        {pet.species.toLowerCase() === 'cat' ? '🐱' : '🐶'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--navy-primary)' }}>
                          {pet.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {pet.species} &bull; {pet.breed || 'Standard'} &bull; {pet.age ? `${pet.age} yrs` : 'Age N/A'}
                        </div>
                      </div>
                    </div>

                    <div>
                      {pet.status === 'INSIDE' && <span className="badge badge-inside">Inside Safe Zone</span>}
                      {pet.status === 'OUTSIDE' && <span className="badge badge-outside">🚨 Outside Safe Zone</span>}
                      {pet.status === 'UNKNOWN' && <span className="badge" style={{ backgroundColor: '#f1f5f9' }}>No Fix</span>}
                    </div>
                  </div>

                  {pet.latest_location && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.75rem 0', background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                      📍 Lat: {pet.latest_location.latitude?.toFixed(4)}, Lon: {pet.latest_location.longitude?.toFixed(4)} &bull; {pet.latest_location.distance_from_center}m from center
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <Link to={`/pets/${pet.id}`} className="btn btn-outline btn-sm">Details</Link>
                    <Link to={`/tracking?petId=${pet.id}`} className="btn btn-accent btn-sm">Track Map</Link>
                    <Link to={`/history?petId=${pet.id}`} className="btn btn-outline btn-sm">History</Link>
                    <Link to={`/risk?petId=${pet.id}`} className="btn btn-outline btn-sm">Risk Score</Link>
                    <Link to={`/safe-zone?petId=${pet.id}`} className="btn btn-outline btn-sm">Settings</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Alerts Column */}
        <div>
          <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div className="card-title">Recent Boundary Alerts</div>
            <Link to="/alerts" style={{ fontSize: '0.82rem' }}>View All</Link>
          </div>

          <div className="card">
            {recentAlerts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
                ✅ All clear! No boundary breaches logged.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    style={{
                      padding: '0.75rem',
                      borderLeft: alert.alert_type === 'ESCAPE' ? '3px solid #dc2626' : '3px solid #16a34a',
                      backgroundColor: alert.is_read ? '#ffffff' : '#fef2f2',
                      border: '1px solid var(--border-color)',
                      borderLeftWidth: '3px',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <strong>{alert.pet_name}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {alert.created_at ? new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', marginTop: '0.25rem', color: alert.alert_type === 'ESCAPE' ? '#991b1b' : '#166534' }}>
                      {alert.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
