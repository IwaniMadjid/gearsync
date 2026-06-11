import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Supply from './pages/Supply';
import BOM from './pages/BOM';
import Repair from './pages/Repair';
import Stock from './pages/Stock';
import MasterData from './pages/MasterData';
import SalesEntry from './pages/SalesEntry';

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-zinc-950 font-sans">
        <Sidebar />
        
        <div className="flex-1 overflow-auto flex flex-col">
          <header className="bg-zinc-900/50 backdrop-blur-md border-b border-zinc-800 p-4 sticky top-0 z-10">
            <h2 className="text-xl font-semibold text-zinc-100 capitalize">GearSync Modul</h2>
          </header>
          
          <main className="p-6 flex-1">
            <Routes>
              {/* Route default, sementara kita arahkan ke Supply dulu */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/supply" element={<Supply />} />
              <Route path="/bom" element={<BOM />} />
              <Route path="/repair" element={<Repair />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/master-data" element={<MasterData />} />
              <Route path="/sales" element={<SalesEntry />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}