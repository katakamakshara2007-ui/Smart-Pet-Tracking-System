import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { petApi, safeZoneApi } from '../api';
import LeafletMap from '../components/LeafletMap';

const SafeZoneSettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPetId = searchParams.get('petId');

  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(initialPetId || '');
  const [safeZone, setSafeZone] = useState(null);

  const [centerLat, setCenterLat] = useState('17.420000');
  const [centerLon, setCenterLon] = useState('78.656000');
  const [radius, setRadius] = useState(100);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Load pets
  useEffect(() => {
    const loadPets = async () => {
      try {
        const res = await petApi.list();
        const list = res.data.data || [];
        setPets(list);
        if (list.length > 0 && !selectedPetId) {
          setSelectedPetId(list[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load pets', err);
      } finally {
        setLoading(false);
      }
    };
    loadPets();
  }, []);

  // Fetch safe zone for selected pet
  const fetchSafeZone = async (petId) => {
    if (!petId) return;
    try {
      const res = await safeZoneApi.get(petId);
      if (res.data && res.data.data) {
        const sz = res.data.data;
        setSafeZone(sz);
        setCenterLat(sz.center_latitude.toString());
        setCenterLon(sz.center_longitude.toString());
        setRadius(sz.radius_meters);
      }
    } catch (err) {
      console.error('Failed to fetch safe zone', err);
    }
  };

  useEffect(() => {
    if (selectedPetId) {
      setSearchParams({ petId: selectedPetId });
      setMessage(null);
      fetchSafeZone(selectedPetId);
    }
  }, [selectedPetId]);

  const handlePetChange = (e) => {
    setSelectedPetId(e.target.value);
  };

  // Map click sets center
  const handleMapClick = (latlng) => {
    setCenterLat(latlng.lat.toFixed(6));
    setCenterLon(latlng.lng.toFixed(6));
  };

  // Save to MySQL backend
  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedPetId) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await safeZoneApi.set(selectedPetId, {
        center_latitude: parseFloat(centerLat),
        center_longitude: parseFloat(centerLon),
        radius_meters: parseFloat(radius),
      });

      const updated = res.data.data;
      setSafeZone(updated);
      setMessage({
        type: 'success',
        text: 'Safe-Zone perimeter saved successfully to MySQL database!',
      });
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to update safe zone configuration.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>Loading safe-zone parameters...</div>;
  }

  if (pets.length === 0) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center', padding: '2rem' }}>
        <h3>No Pets Registered</h3>
        <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0' }}>
          Please add a pet first before configuring safe-zone boundaries.
        </p>
        <Link to="/add-pet" className="btn btn-primary btn-sm">Register a Pet</Link>
      </div>
    );
  }

  const previewZone = {
    center_latitude: parseFloat(centerLat) || 17.4200,
    center_longitude: parseFloat(centerLon) || 78.6560,
    radius_meters: parseFloat(radius) || 100,
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-block">
          <h1>Safe-Zone Geofence Configuration</h1>
          <p>Define circular geographical safety boundaries and permitted radius limits</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Configure For:</label>
          <select className="form-control" style={{ width: 'auto' }} value={selectedPetId} onChange={handlePetChange}>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.species})
              </option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div className={`alert-banner alert-${message.type}`}>
          <span>{message.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(320px, 1.5fr)', gap: '1.5rem' }}>
        {/* Settings Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Geofence Parameters</div>
            <span className="badge badge-inside">MySQL 8 Storage</span>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Center Latitude</label>
              <input
                type="number"
                step="any"
                className="form-control"
                value={centerLat}
                onChange={(e) => setCenterLat(e.target.value)}
                required
              />
              <small style={{ color: 'var(--text-muted)' }}>Or click anywhere on the adjacent map to place center.</small>
            </div>

            <div className="form-group">
              <label className="form-label">Center Longitude</label>
              <input
                type="number"
                step="any"
                className="form-control"
                value={centerLon}
                onChange={(e) => setCenterLon(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form-label">Permitted Radius</label>
                <span style={{ fontWeight: 700, color: 'var(--navy-primary)' }}>{radius} meters</span>
              </div>
              <input
                type="range"
                min="20"
                max="1000"
                step="5"
                style={{ width: '100%', accentColor: 'var(--navy-primary)', cursor: 'pointer' }}
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value, 10))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>20m (Small Yard)</span>
                <span>250m (Neighborhood)</span>
                <span>1000m (Farm/Ranch)</span>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Direct Radius Input (Meters)</label>
              <input
                type="number"
                min="10"
                max="10000"
                className="form-control"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={saving}>
              {saving ? 'Saving to Database...' : 'Save Geofence to MySQL'}
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <strong>💡 Haversine Formula Note:</strong> Any GPS fix recorded further than {radius} meters from this center point will automatically trigger an escape alert notification.
          </div>
        </div>

        {/* Live Map Preview & Interactive Center Picker */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Boundary Visualizer</div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Click anywhere on map to reposition safe-zone center
              </span>
            </div>
            <span className="badge badge-simulated">{radius}m Radius</span>
          </div>

          <div className="map-card-wrapper" style={{ height: '420px' }}>
            <LeafletMap
              center={[previewZone.center_latitude, previewZone.center_longitude]}
              zoom={16}
              safeZone={previewZone}
              onMapClick={handleMapClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafeZoneSettingsPage;
