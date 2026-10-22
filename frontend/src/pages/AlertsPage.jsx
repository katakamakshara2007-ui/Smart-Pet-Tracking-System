import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { alertApi, petApi } from '../api';

const AlertsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const petFilterParam = searchParams.get('petId');

  const [alerts, setAlerts] = useState([]);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(petFilterParam || '');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load pets for filter dropdown
  useEffect(() => {
    const loadPets = async () => {
      try {
        const res = await petApi.list();
        setPets(res.data.data || []);
      } catch (err) {
        console.error('Failed to load pets list', err);
      }
    };
    loadPets();
  }, []);

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const params = {};
      if (unreadOnly) params.unread_only = true;
      if (selectedPet) params.pet_id = selectedPet;

      const res = await alertApi.list(params);
      setAlerts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedPet, unreadOnly]);

  const handleMarkAsRead = async (alertId) => {
    try {
      await alertApi.markRead(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
      );
    } catch (err) {
      alert('Failed to mark alert as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await alertApi.markAllRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    } catch (err) {
      alert('Failed to mark all alerts as read.');
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await alertApi.delete(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (err) {
      alert('Failed to delete alert record.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-block">
          <h1>Geofence Breach &amp; Escape Alerts</h1>
          <p>Historical audit log of perimeter departures, safe returns, and threshold violations</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={handleMarkAllRead} className="btn btn-outline btn-sm">
            ✓ Mark All as Read
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Filter Pet:</label>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={selectedPet}
            onChange={(e) => setSelectedPet(e.target.value)}
          >
            <option value="">All Pets</option>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.species})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
            />
            Show Unread Only
          </label>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing <strong>{alerts.length}</strong> recorded event(s)
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading alerts log from MySQL...
        </div>
      ) : alerts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
          <h3>No Alerts To Display</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {unreadOnly
              ? 'All alerts have been reviewed and marked as read!'
              : 'No escape breaches recorded. Pets have remained inside their designated safe zones.'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Event Type</th>
                <th>Pet Name</th>
                <th>Alert Notification Message</th>
                <th>Coordinates</th>
                <th>Distance Beyond</th>
                <th>Time of Event</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} style={{ backgroundColor: alert.is_read ? 'transparent' : '#fef2f2' }}>
                  <td>
                    {alert.is_read ? (
                      <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>Read</span>
                    ) : (
                      <span className="badge badge-outside">New</span>
                    )}
                  </td>
                  <td>
                    {alert.alert_type === 'ESCAPE' && (
                      <span className="badge badge-outside">🚨 Escape Breach</span>
                    )}
                    {alert.alert_type === 'RETURN' && (
                      <span className="badge badge-inside">Safe Return</span>
                    )}
                    {alert.alert_type !== 'ESCAPE' && alert.alert_type !== 'RETURN' && (
                      <span className="badge">{alert.alert_type}</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--navy-primary)' }}>
                    <Link to={`/pets/${alert.pet_id}`}>{alert.pet_name}</Link>
                  </td>
                  <td style={{ maxWidth: '300px' }}>{alert.message}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {alert.latitude?.toFixed(4)}, {alert.longitude?.toFixed(4)}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {alert.distance_from_center}m
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {alert.created_at ? new Date(alert.created_at).toLocaleString() : 'N/A'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      {!alert.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(alert.id)}
                          className="btn btn-outline btn-sm"
                          title="Mark as Read"
                        >
                          ✓ Read
                        </button>
                      )}
                      <Link
                        to={`/tracking?petId=${alert.pet_id}`}
                        className="btn btn-outline btn-sm"
                        title="View Live Map"
                      >
                        Map
                      </Link>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#dc2626' }}
                        title="Delete Alert Record"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
