import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Supply from './pages/Supply';
import BOM from './pages/BOM';
import Repair from './pages/Repair';
import Stock from './pages/Stock';
import MasterData from './pages/MasterData';
import Sales from './pages/Sales';
import Purchasing from './pages/Purchasing';

export default function App() {
  return (
    <Router>
      <div className="flex h-screen overflow-hidden" style={{ background: '#0c0b0f' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-auto">
          <main className="flex-1 px-8 py-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"   element={<Dashboard />} />
              <Route path="/supply"      element={<Supply />} />
              <Route path="/bom"         element={<BOM />} />
              <Route path="/repair"      element={<Repair />} />
              <Route path="/stock"       element={<Stock />} />
              <Route path="/master-data" element={<MasterData />} />
              <Route path="/sales"       element={<Sales />} />
              <Route path="/purchasing"  element={<Purchasing />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}