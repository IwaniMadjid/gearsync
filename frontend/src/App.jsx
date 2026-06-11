import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Supply from './pages/Supply';
import BOM from './pages/BOM';
import Repair from './pages/Repair';
import Stock from './pages/Stock';
import MasterData from './pages/MasterData';
import SalesEntry from './pages/SalesEntry';
import Purchasing from './pages/Purchasing';

const PAGE_TITLES = {
  '/dashboard':   'Dasbor',
  '/supply':      'Kedatangan Barang',
  '/bom':         'Reverse BOM & QC',
  '/repair':      'Lab Reparasi',
  '/stock':       'Manajemen Stok',
  '/master-data': 'Master Data',
  '/sales':       'Pencatatan Jual',
};

function Header() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'GearSync';
  return (
    <header
      className="sticky top-0 z-10 px-8 py-4 flex items-center justify-between"
      style={{
        background: 'rgba(12, 11, 15, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1a1820',
      }}
    >
      <div>
        <h1 style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a7470' }}>
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <div style={{ width: 6, height: 6, background: '#72b08a', borderRadius: '50%' }} />
        <span style={{ fontSize: '0.7rem', color: '#524e4b', letterSpacing: '0.08em' }}>SISTEM AKTIF</span>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <Router>
      <div className="flex h-screen overflow-hidden" style={{ background: '#0c0b0f' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-auto">
          <Header />
          <main className="flex-1 px-8 py-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"   element={<Dashboard />} />
              <Route path="/supply"      element={<Supply />} />
              <Route path="/bom"         element={<BOM />} />
              <Route path="/repair"      element={<Repair />} />
              <Route path="/stock"       element={<Stock />} />
              <Route path="/master-data" element={<MasterData />} />
              <Route path="/sales"       element={<SalesEntry />} />
              <Route path="/purchasing"  element={<Purchasing />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}