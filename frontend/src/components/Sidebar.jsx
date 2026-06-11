import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowLeftRight, Wrench, Settings } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/supply', label: 'Supply & Kedatangan', icon: Package },
    { path: '/bom', label: 'Reverse BOM & Grading', icon: ArrowLeftRight },
    { path: '/repair', label: 'Reparasi', icon: Wrench },
    { path: '/stock', label: 'Manajemen Stok', icon: Settings },
    { path: '/master-data', label: 'Master Data', icon: Settings },
    ({ path: '/sales', label: 'Sales Entry', icon: Settings }),
  ];

  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-black text-white flex items-center">
          <Wrench className="w-6 h-6 mr-2 text-orange-500" /> GEAR<span className="text-orange-500">SYNC</span>
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-orange-600/10 text-orange-500 border border-orange-500/20' : 'text-zinc-400 hover:bg-zinc-800'
                }`
              }
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}