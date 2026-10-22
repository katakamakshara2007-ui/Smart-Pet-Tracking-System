import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { petApi } from '../api';

const AddPetPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    age: '',
    gender: 'Male',
    photo_url: '',
    description: '',
    // Initial Safe-Zone configuration
    center_latitude: 17.420000,
    center_longitude: 78.656000,
    radius_meters: 100,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Pet name is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await petApi.create({
        name: formData.name.trim(),
        species: formData.species,
        breed: formData.breed.trim(),
        age: formData.age ? parseInt(formData.age, 10) : null,
        gender: formData.gender,
        photo_url: formData.photo_url.trim(),
        description: formData.description.trim(),
        center_latitude: parseFloat(formData.center_latitude),
        center_longitude: parseFloat(formData.center_longitude),
        radius_meters: parseFloat(formData.radius_meters),
      });

      const newPet = res.data.data;
      navigate(`/tracking?petId=${newPet.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add pet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-title-block">
          <h1>Register New Pet</h1>
          <p>Add pet profile details and set initial geofence home parameters</p>
        </div>
        <Link to="/dashboard" className="btn btn-outline btn-sm">
          &larr; Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="alert-banner alert-danger">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.75rem' }}>
        <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Pet Identity &amp; Profile
        </h3>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Pet Name *</label>
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="e.g. Bruno"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Species *</label>
            <select
              name="species"
              className="form-control"
              value={formData.species}
              onChange={handleChange}
              required
            >
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Bird">Bird</option>
              <option value="Other">Other Domestic Pet</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Breed</label>
            <input
              type="text"
              name="breed"
              className="form-control"
              placeholder="e.g. Labrador Retriever / Persian"
              value={formData.breed}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Age (in years)</label>
            <input
              type="number"
              name="age"
              className="form-control"
              placeholder="e.g. 2"
              min="0"
              max="35"
              value={formData.age}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gender</label>
            <select
              name="gender"
              className="form-control"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Photo URL (Optional)</label>
          <input
            type="url"
            name="photo_url"
            className="form-control"
            placeholder="https://example.com/pet-photo.jpg"
            value={formData.photo_url}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description / Identifying Marks</label>
          <textarea
            name="description"
            rows="3"
            className="form-control"
            placeholder="Describe collar color, distinct markings, or behavioral traits..."
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <h3 style={{ margin: '1.5rem 0 1rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Initial Safe-Zone Perimeter
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Specify the home coordinates and safety radius in meters. Default preset: Anurag University campus / Hyderabad.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Center Latitude</label>
            <input
              type="number"
              step="any"
              name="center_latitude"
              className="form-control"
              value={formData.center_latitude}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Center Longitude</label>
            <input
              type="number"
              step="any"
              name="center_longitude"
              className="form-control"
              value={formData.center_longitude}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Permitted Radius (Meters)</label>
            <input
              type="number"
              step="1"
              name="radius_meters"
              className="form-control"
              min="10"
              max="5000"
              value={formData.radius_meters}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Link to="/dashboard" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving Pet...' : 'Register Pet & Begin Tracking'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPetPage;
