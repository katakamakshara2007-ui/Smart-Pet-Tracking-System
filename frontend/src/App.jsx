import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AddPetPage from './pages/AddPetPage';
import PetDetailsPage from './pages/PetDetailsPage';
import PetTrackingPage from './pages/PetTrackingPage';
import SafeZoneSettingsPage from './pages/SafeZoneSettingsPage';
import AlertsPage from './pages/AlertsPage';
import MovementHistoryPage from './pages/MovementHistoryPage';
import EscapeRiskPage from './pages/EscapeRiskPage';
import UserProfilePage from './pages/UserProfilePage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/add-pet" element={<ProtectedRoute><AddPetPage /></ProtectedRoute>} />
              <Route path="/pets/:id" element={<ProtectedRoute><PetDetailsPage /></ProtectedRoute>} />
              <Route path="/tracking" element={<ProtectedRoute><PetTrackingPage /></ProtectedRoute>} />
              <Route path="/safe-zone" element={<ProtectedRoute><SafeZoneSettingsPage /></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><MovementHistoryPage /></ProtectedRoute>} />
              <Route path="/risk" element={<ProtectedRoute><EscapeRiskPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />

              {/* Default redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
