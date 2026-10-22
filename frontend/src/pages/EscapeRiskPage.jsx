import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { petApi, riskApi } from '../api';

const EscapeRiskPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPetId = searchParams.get('petId');

  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(initialPetId || '');
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  // Load pets list
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

  // Fetch risk calculation for selected pet
  const fetchRisk = async (petId) => {
    if (!petId) return;
    setCalculating(true);
    try {
      const res = await riskApi.getRisk(petId);
      setRiskData(res.data.data);
    } catch (err) {
      console.error('Failed to calculate risk', err);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    if (selectedPetId) {
      setSearchParams({ petId: selectedPetId });
      fetchRisk(selectedPetId);
    }
  }, [selectedPetId]);

  const handlePetChange = (e) => {
    setSelectedPetId(e.target.value);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>Loading risk analytics...</div>;
  }

  if (pets.length === 0) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center', padding: '2rem' }}>
        <h3>No Registered Pets</h3>
        <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0' }}>Add a pet first to assess escape risks.</p>
        <Link to="/add-pet" className="btn btn-primary btn-sm">Register a Pet</Link>
      </div>
    );
  }

  const isInsufficient = riskData?.risk_level === 'INSUFFICIENT_DATA';
  const riskScore = riskData?.risk_score ?? 0;
  const riskLevel = riskData?.risk_level || 'LOW';

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-title-block">
          <h1>Explainable Escape-Risk Prediction</h1>
          <p>Rule-based behavioral heuristics modeling boundary proximity, crossing volatility, and outward velocity</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Assess For:</label>
          <select className="form-control" style={{ width: 'auto' }} value={selectedPetId} onChange={handlePetChange}>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.species})
              </option>
            ))}
          </select>
          <button onClick={() => fetchRisk(selectedPetId)} className="btn btn-outline btn-sm" disabled={calculating}>
            {calculating ? 'Analyzing...' : '🔄 Re-evaluate'}
          </button>
        </div>
      </div>

      {/* Academic Disclaimer Notice */}
      <div className="alert-banner alert-info" style={{ marginBottom: '1.5rem' }}>
        <div>
          <strong>🎓 Academic Heuristic Model Notice:</strong> This risk scoring engine is a transparent, rule-based heuristic designed for demonstration in the B.Tech Data Science capstone project at Anurag University. It computes explainable weighted scores from spatial proximity and movement history. It does not claim to be a clinically validated black-box AI model.
        </div>
      </div>

      {isInsufficient ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h2 style={{ color: 'var(--navy-primary)' }}>Insufficient Data for Reliable Prediction</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '540px', margin: '0.75rem auto 1.5rem auto' }}>
            {riskData?.factors?.[0] || 'At least 3 sequential location points are required to calculate directional movement trajectories and escape probabilities.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <Link to={`/tracking?petId=${selectedPetId}`} className="btn btn-primary">
              🛰️ Open Tracking Simulator to Add Movement Points
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.8fr)', gap: '1.5rem' }}>
          {/* Risk Level & Gauge Card */}
          <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Computed Risk Index
            </div>

            <div
              style={{
                margin: '1.5rem auto',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: `8px solid ${
                  riskLevel === 'HIGH' ? '#ef4444' : riskLevel === 'MEDIUM' ? '#f59e0b' : '#22c55e'
                }`,
                backgroundColor: '#ffffff',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--navy-primary)' }}>
                {riskScore}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Score / 100
              </span>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              {riskLevel === 'LOW' && (
                <span className="badge badge-low" style={{ fontSize: '0.9rem', padding: '0.35rem 0.85rem' }}>
                  ✓ LOW ESCAPE RISK
                </span>
              )}
              {riskLevel === 'MEDIUM' && (
                <span className="badge badge-medium" style={{ fontSize: '0.9rem', padding: '0.35rem 0.85rem' }}>
                  ⚠️ MODERATE ESCAPE RISK
                </span>
              )}
              {riskLevel === 'HIGH' && (
                <span className="badge badge-high" style={{ fontSize: '0.9rem', padding: '0.35rem 0.85rem' }}>
                  🚨 HIGH ESCAPE RISK
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              Based on analysis of <strong>{riskData?.data_points_count || 0}</strong> recent location logs.
            </p>

            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', textAlign: 'left' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy-primary)', marginBottom: '0.35rem' }}>
                Actionable Recommendation:
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                {riskData?.recommendations}
              </p>
            </div>
          </div>

          {/* Explainable Factors Breakdown Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Transparent Heuristic Breakdown</div>
              <span className="badge badge-simulated">Explainable Data Science</span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Each contributing factor is scored using deterministic rules to explain why this risk score was generated:
            </p>

            {/* Contributing factors list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {riskData?.factors?.map((factor, index) => (
                <div
                  key={index}
                  style={{
                    padding: '0.85rem 1rem',
                    background: '#f8fafc',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--border-color)',
                    borderLeft: '4px solid var(--navy-primary)',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>
                    {factor}
                  </div>
                </div>
              ))}
            </div>

            {/* Scoring weights breakdown chart */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-primary)', marginBottom: '0.75rem' }}>
                Evaluation Weight Matrix:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
                <div style={{ padding: '0.6rem', background: '#f1f5f9', borderRadius: '4px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-primary)' }}>
                    {riskData?.proximity_score ?? 0} / 40
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Perimeter Proximity</div>
                </div>
                <div style={{ padding: '0.6rem', background: '#f1f5f9', borderRadius: '4px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-primary)' }}>
                    {riskData?.crossing_score ?? 0} / 35
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Boundary Crossings</div>
                </div>
                <div style={{ padding: '0.6rem', background: '#f1f5f9', borderRadius: '4px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-primary)' }}>
                    {riskData?.trajectory_score ?? 0} / 25
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Outward Trajectory</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscapeRiskPage;
