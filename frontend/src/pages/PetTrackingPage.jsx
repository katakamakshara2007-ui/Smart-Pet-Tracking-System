import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { petApi, trackingApi } from '../api';
import LeafletMap from '../components/LeafletMap';

const PetTrackingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPetId = searchParams.get('petId');

  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(initialPetId || '');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Manual coordinate input states
  const [inputLat, setInputLat] = useState('');
  const [inputLon, setInputLon] = useState('');

  // Auto-walk simulation state
  const [isAutoWalking, setIsAutoWalking] = useState(false);
  const walkIntervalRef = useRef(null);

  // Load all user pets
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

  // Fetch current tracking state when selected pet changes
  const fetchTracking = async (petId) => {
    if (!petId) return;
    try {
      const res = await trackingApi.getLatest(petId);
      if (res.data && res.data.data) {
        setTrackingData(res.data.data);
        const loc = res.data.data.location;
        if (loc) {
          setInputLat(loc.latitude.toString());
          setInputLon(loc.longitude.toString());
        } else if (res.data.data.safe_zone) {
          setInputLat(res.data.data.safe_zone.center_latitude.toString());
          setInputLon(res.data.data.safe_zone.center_longitude.toString());
        }
      }
    } catch (err) {
      console.error('Failed to fetch tracking data', err);
    }
  };

  useEffect(() => {
    if (selectedPetId) {
      setSearchParams({ petId: selectedPetId });
      fetchTracking(selectedPetId);
    }
  }, [selectedPetId]);

  // Clean up auto-walk timer
  useEffect(() => {
    return () => {
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
    };
  }, []);

  const handlePetChange = (e) => {
    setSelectedPetId(e.target.value);
    setFeedback(null);
    setIsAutoWalking(false);
    if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
  };

  // Submit simulated GPS update
  const submitCoordinates = async (lat, lon) => {
    if (!selectedPetId) return;
    setUpdating(true);
    setFeedback(null);

    try {
      const res = await trackingApi.submitLocation(selectedPetId, {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        is_simulated: true,
      });

      const result = res.data.data;
      setTrackingData((prev) => ({
        ...prev,
        location: result.location,
        safe_zone: result.safe_zone,
      }));
      setInputLat(lat.toString());
      setInputLon(lon.toString());

      if (result.state_transition === 'ESCAPED') {
        setFeedback({
          type: 'danger',
          message: `🚨 ESCAPE ALERT DISPATCHED: Pet crossed the safe zone perimeter (${result.distance_from_center}m from center)!`,
        });
      } else if (result.state_transition === 'RETURNED') {
        setFeedback({
          type: 'success',
          message: `✅ Pet has safely re-entered the safe zone (${result.distance_from_center}m from center).`,
        });
      } else if (!result.is_inside) {
        setFeedback({
          type: 'warning',
          message: `⚠️ Pet remains outside safe zone perimeter (${result.distance_from_center}m from center).`,
        });
      } else {
        setFeedback({
          type: 'info',
          message: `📍 GPS position updated (${result.distance_from_center}m from center). Pet is inside safe perimeter.`,
        });
      }
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to submit GPS coordinates.',
      });
    } finally {
      setUpdating(false);
    }
  };

  // Manual Form submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    submitCoordinates(inputLat, inputLon);
  };

  // Click on map to move
  const handleMapClick = (latlng) => {
    submitCoordinates(latlng.lat, latlng.lng);
  };

  // Step Move Buttons (0.0003 deg latitude is ~33 meters)
  const handleStepMove = (direction) => {
    const curLat = parseFloat(inputLat) || 17.4200;
    const curLon = parseFloat(inputLon) || 78.6560;
    const delta = 0.00025; // ~28 meters

    let newLat = curLat;
    let newLon = curLon;

    if (direction === 'NORTH') newLat += delta;
    if (direction === 'SOUTH') newLat -= delta;
    if (direction === 'EAST') newLon += delta;
    if (direction === 'WEST') newLon -= delta;

    submitCoordinates(newLat.toFixed(6), newLon.toFixed(6));
  };

  // Preset location buttons
  const handlePreset = (type) => {
    if (!trackingData?.safe_zone) return;
    const sz = trackingData.safe_zone;
    const cLat = parseFloat(sz.center_latitude);
    const cLon = parseFloat(sz.center_longitude);

    if (type === 'HOME') {
      submitCoordinates(cLat.toFixed(6), cLon.toFixed(6));
    } else if (type === 'NEAR_BOUNDARY') {
      // ~75m North (inside a 100m radius)
      submitCoordinates((cLat + 0.00065).toFixed(6), cLon.toFixed(6));
    } else if (type === 'JUST_OUTSIDE') {
      // ~130m North (outside a 100m radius - triggers alert)
      submitCoordinates((cLat + 0.00120).toFixed(6), cLon.toFixed(6));
    } else if (type === 'FAR_OUTSIDE') {
      // ~280m North (far outside)
      submitCoordinates((cLat + 0.00250).toFixed(6), cLon.toFixed(6));
    }
  };

  // Toggle realistic walk simulation
  const toggleAutoWalk = () => {
    if (isAutoWalking) {
      setIsAutoWalking(false);
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
    } else {
      setIsAutoWalking(true);
      let stepCount = 0;
      walkIntervalRef.current = setInterval(() => {
        stepCount += 1;
        const currentLat = parseFloat(inputLat) || 17.4200;
        const currentLon = parseFloat(inputLon) || 78.6560;
        // Small random wander outwards
        const randLat = currentLat + (Math.random() * 0.0003 - 0.0001);
        const randLon = currentLon + (Math.random() * 0.0003 - 0.0001);
        submitCoordinates(randLat.toFixed(6), randLon.toFixed(6));

        if (stepCount >= 10) {
          setIsAutoWalking(false);
          clearInterval(walkIntervalRef.current);
        }
      }, 3000);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>Loading tracking maps...</div>;
  }

  if (pets.length === 0) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center', padding: '2rem' }}>
        <h3>No Pets Found</h3>
        <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0' }}>
          Please add a pet first before accessing tracking features.
        </p>
        <Link to="/add-pet" className="btn btn-primary btn-sm">Register a Pet</Link>
      </div>
    );
  }

  const loc = trackingData?.location;
  const sz = trackingData?.safe_zone;
  const mapCenter = loc ? [loc.latitude, loc.longitude] : sz ? [sz.center_latitude, sz.center_longitude] : [17.4200, 78.6560];

  return (
    <div>
      {/* Header and Pet Picker */}
      <div className="page-header">
        <div className="page-title-block">
          <h1>Pet Tracking Map &amp; Geofence Monitor</h1>
          <p>Real-time location positioning, simulated hardware GPS fix, and boundary enforcement</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Active Pet:</label>
          <select className="form-control" style={{ width: 'auto' }} value={selectedPetId} onChange={handlePetChange}>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.species})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Feedback Banner */}
      {feedback && (
        <div className={`alert-banner alert-${feedback.type}`}>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Live Status Bar Card */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CURRENT STATUS</div>
            <div>
              {loc?.is_inside === true && <span className="badge badge-inside">Inside Safe Zone</span>}
              {loc?.is_inside === false && <span className="badge badge-outside">🚨 Outside Safe Zone</span>}
              {!loc && <span className="badge">No GPS Fix</span>}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>COORDINATES</div>
            <div style={{ fontWeight: 600 }}>
              {loc ? `${loc.latitude?.toFixed(6)}, ${loc.longitude?.toFixed(6)}` : 'Waiting for GPS fix...'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DISTANCE TO CENTER</div>
            <div style={{ fontWeight: 600 }}>
              {loc ? `${loc.distance_from_center} meters` : '0 m'} (Permitted: {sz?.radius_meters || 100}m)
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>LAST REPORTED</div>
            <div style={{ fontSize: '0.85rem' }}>
              {loc?.timestamp ? new Date(loc.timestamp).toLocaleTimeString() : 'N/A'}
            </div>
          </div>
        </div>

        <div>
          <span className="badge badge-simulated">
            ● GPS Simulation Mode: Active
          </span>
        </div>
      </div>

      {/* Two Column Layout: Map & Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) minmax(280px, 1fr)', gap: '1.25rem' }}>
        {/* Left Column: Interactive Map */}
        <div className="card" style={{ padding: '0.5rem' }}>
          <div style={{ padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)' }}>
              Interactive Tracking Map (Click anywhere on map to drop simulated GPS point)
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Blue dashed circle = Safe Zone
            </span>
          </div>

          <div className="map-card-wrapper" style={{ height: '500px' }}>
            {sz && (
              <LeafletMap
                center={mapCenter}
                zoom={16}
                safeZone={sz}
                currentLocation={loc ? { ...loc, pet_name: pets.find(p => p.id === parseInt(selectedPetId))?.name } : null}
                onMapClick={handleMapClick}
              />
            )}
          </div>
        </div>

        {/* Right Column: GPS Simulator Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Quick Presets Panel */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ fontSize: '0.95rem' }}>Scenario Presets</div>
              <span className="badge badge-simulated">Quick Test</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Instantly jump to test locations to trigger geofence boundaries:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button onClick={() => handlePreset('HOME')} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start' }}>
                🏠 Home Center (Inside: 0m)
              </button>
              <button onClick={() => handlePreset('NEAR_BOUNDARY')} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start' }}>
                ⚠️ Near Boundary Edge (~75m)
              </button>
              <button onClick={() => handlePreset('JUST_OUTSIDE')} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', color: '#b91c1c' }}>
                🚨 Breach Boundary (~130m - Escape Alert)
              </button>
              <button onClick={() => handlePreset('FAR_OUTSIDE')} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', color: '#991b1b' }}>
                🏃 Far Stray Out of Perimeter (~280m)
              </button>
            </div>
          </div>

          {/* D-Pad Directional Controls */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ fontSize: '0.95rem' }}>Step Movement (25m Steps)</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', margin: '0.5rem 0' }}>
              <button onClick={() => handleStepMove('NORTH')} className="btn btn-outline btn-sm" style={{ width: '120px' }}>
                ▲ North (+25m)
              </button>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button onClick={() => handleStepMove('WEST')} className="btn btn-outline btn-sm" style={{ width: '110px' }}>
                  ◀ West (-25m)
                </button>
                <button onClick={() => handleStepMove('EAST')} className="btn btn-outline btn-sm" style={{ width: '110px' }}>
                  East (+25m) ▶
                </button>
              </div>
              <button onClick={() => handleStepMove('SOUTH')} className="btn btn-outline btn-sm" style={{ width: '120px' }}>
                ▼ South (-25m)
              </button>
            </div>

            <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <button
                type="button"
                onClick={toggleAutoWalk}
                className={`btn btn-sm ${isAutoWalking ? 'btn-danger' : 'btn-accent'}`}
                style={{ width: '100%' }}
              >
                {isAutoWalking ? '⏹ Stop Auto-Walk Simulation' : '▶ Start Auto-Walk Live Demo (10 Steps)'}
              </button>
            </div>
          </div>

          {/* Manual Lat/Lon Entry */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ fontSize: '0.95rem' }}>Manual Coordinates Input</div>
            </div>
            <form onSubmit={handleManualSubmit}>
              <div className="form-group" style={{ marginBottom: '0.6rem' }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                  value={inputLat}
                  onChange={(e) => setInputLat(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Longitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                  value={inputLon}
                  onChange={(e) => setInputLon(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }} disabled={updating}>
                {updating ? 'Transmitting Fix...' : 'Transmit Simulated GPS Fix'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetTrackingPage;
