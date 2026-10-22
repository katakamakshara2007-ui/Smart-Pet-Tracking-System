import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { petApi, trackingApi } from '../api';
import LeafletMap from '../components/LeafletMap';

const MovementHistoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPetId = searchParams.get('petId');

  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(initialPetId || '');
  const [history, setHistory] = useState([]);
  const [safeZone, setSafeZone] = useState(null);
  const [loading, setLoading] = useState(true);

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
        console.error('Failed to load pets list', err);
      } finally {
        setLoading(false);
      }
    };
    loadPets();
  }, []);

  // Fetch history for selected pet
  const fetchHistory = async (petId) => {
    if (!petId) return;
    try {
      const [histRes, petRes] = await Promise.all([
        trackingApi.getHistory(petId, 200),
        petApi.get(petId),
      ]);
      setHistory(histRes.data.data || []);
      setSafeZone(petRes.data.data?.safe_zone || null);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  useEffect(() => {
    if (selectedPetId) {
      setSearchParams({ petId: selectedPetId });
      fetchHistory(selectedPetId);
    }
  }, [selectedPetId]);

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all recorded movement history for this pet?')) {
      try {
        await trackingApi.clearHistory(selectedPetId);
        setHistory([]);
      } catch (err) {
        alert('Failed to clear history');
      }
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>Loading movement logs...</div>;
  }

  // Convert history array to polyline coordinates in chronological order
  // history is returned desc (newest first); polyline coordinates ordered oldest -> newest
  const polylineCoords = [...history]
    .reverse()
    .filter((loc) => loc.latitude && loc.longitude)
    .map((loc) => [loc.latitude, loc.longitude]);

  const latestPoint = history.length > 0 ? history[0] : null;
  const activePetName = pets.find((p) => p.id === parseInt(selectedPetId, 10))?.name || 'Pet';

  return (
    <div>
      <div className="page-header">
        <div className="page-title-block">
          <h1>Movement &amp; Trajectory History</h1>
          <p>Chronological GPS breadcrumb tracking and boundary compliance logs</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Select Pet:</label>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={selectedPetId}
            onChange={(e) => setSelectedPetId(e.target.value)}
          >
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.species})
              </option>
            ))}
          </select>
          {history.length > 0 && (
            <button onClick={handleClearHistory} className="btn btn-outline btn-sm" style={{ color: '#dc2626' }}>
              Clear Log
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <h3>No Movement Data Found</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1rem 0' }}>
            There are no GPS coordinates logged yet for {activePetName}.
          </p>
          <Link to={`/tracking?petId=${selectedPetId}`} className="btn btn-primary btn-sm">
            Open Simulator &amp; Add GPS Points
          </Link>
        </div>
      ) : (
        <>
          {/* Breadcrumb Map Card */}
          <div className="card" style={{ marginBottom: '1.5rem', padding: '0.75rem' }}>
            <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                  Breadcrumb Trajectory Trail Map ({history.length} fixes)
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                  Blue line illustrates the chronological path taken by {activePetName}
                </span>
              </div>
              <span className="badge badge-simulated">Breadcrumb Trail</span>
            </div>

            <div className="map-card-wrapper" style={{ height: '380px' }}>
              <LeafletMap
                center={latestPoint ? [latestPoint.latitude, latestPoint.longitude] : [17.4200, 78.6560]}
                zoom={16}
                safeZone={safeZone}
                currentLocation={latestPoint ? { ...latestPoint, pet_name: activePetName } : null}
                polylineCoords={polylineCoords}
              />
            </div>
          </div>

          {/* Historical Coordinate Records Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Boundary Status</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Distance from Center</th>
                  <th>Data Source</th>
                </tr>
              </thead>
              <tbody>
                {history.map((loc, idx) => (
                  <tr key={loc.id || idx}>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {loc.timestamp ? new Date(loc.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td>
                      {loc.is_inside ? (
                        <span className="badge badge-inside">Inside Safe Zone</span>
                      ) : (
                        <span className="badge badge-outside">Perimeter Breached</span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{loc.latitude?.toFixed(6)}</td>
                    <td style={{ fontFamily: 'monospace' }}>{loc.longitude?.toFixed(6)}</td>
                    <td style={{ fontWeight: 600 }}>{loc.distance_from_center} meters</td>
                    <td>
                      <span className="badge badge-simulated" style={{ fontSize: '0.7rem' }}>
                        {loc.is_simulated ? 'Simulated Fix' : 'Hardware GPS'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default MovementHistoryPage;
