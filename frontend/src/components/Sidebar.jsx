import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ArrowLeftRight,
  Wrench, Archive, Database, ShoppingCart, TrendingUp
} from 'lucide-react';

const navGroups = [
  {
    title: 'General',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Operational',
    items: [
      { path: '/supply', label: 'Raw Material', icon: Package },
      { path: '/bom', label: 'Grade', icon: ArrowLeftRight },
      { path: '/repair', label: 'Repair', icon: Wrench },
      { path: '/stock', label: 'Stock', icon: Archive }
    ]
  },
  {
    title: 'Finance',
    items: [
      { path: '/purchasing', label: 'Procurement', icon: ShoppingCart },
      { path: '/sales', label: 'Sales', icon: TrendingUp },
    ]
  },
  {
    title: 'Setting',
    items: [
      { path: '/master-data', label: 'Master Data', icon: Database }
    ]      
  }
];

export default function Sidebar() {
  return (
    <aside
      className="w-56 flex flex-col h-screen sticky top-0 shrink-0"
      style={{ background: '#0c0b0f', borderRight: '1px solid #22202b' }}
    >
      {/* Logo */}
      <div className="px-6 pt-8 pb-6" style={{ borderBottom: '1px solid #1a1820' }}>
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 0L14 7L7 14L0 7L7 0Z" fill="#7a7470" />
          </svg>
          <span style={{ fontFamily: 'DM Sans, serif', fontSize: '1.1rem', color: '#e8e0d0', letterSpacing: '0.04em' }}>
            GEAR<span style={{ color: '#c8a660' }}>SYNC</span>
          </span>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-4 space-y-6 overflow-y-auto py-6">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 pb-2 label-eyebrow" style={{ color: '#3d3a4d', fontSize: '0.65rem' }}>
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  style={({ isActive }) => ({
                    borderLeft: `2px solid ${isActive ? '#c8a660' : 'transparent'}`,
                    color: isActive ? '#c8a660' : '#7a7470',
                    background: isActive ? 'rgba(200, 166, 96, 0.06)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '2px',
                    fontSize: '0.8125rem',
                    transition: 'all 0.15s'
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={14} style={{ color: isActive ? '#c8a660' : '#524e4b' }} />
                      <span className="font-medium" style={{ color: isActive ? '#e8e0d0' : '#7a7470' }}>
                        {label}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5" style={{ borderTop: '1px solid #1a1820' }}>
        <p className="label-eyebrow" style={{ color: '#3d3a4d', fontSize: '0.6rem' }}>v0.9 · 2026</p>
      </div>
    </aside>
  );
}