import React, { useState, useEffect } from 'react';
import { ArrowRight, Activity, BarChart3, Settings2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../services/api';

/* ─── Design tokens ─── */
const T = {
  bg:      '#0c0b0f',
  surface: '#131118',
  raised:  '#1a1820',
  border:  '#22202b',
  border2: '#2e2b3a',
  textPri: '#e8e0d0',
  textSec: '#7a7470',
  textMut: '#524e4b',
  gold:    '#c8a660',
  goldDim: '#a88845',
  jade:    '#72b08a',
  ember:   '#c47060',
  sky:     '#70a8c4',
};

const Card = ({ children, style, className = '' }) => (
  <div
    className={className}
    style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, ...style }}
  >
    {children}
  </div>
);

const Eyebrow = ({ children, gold }) => (
  <p style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: gold ? T.gold : T.textMut }}>
    {children}
  </p>
);

/* ─── Recharts custom tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.raised, border: `1px solid ${T.border2}`, borderRadius: 4, padding: '8px 12px' }}>
      {label && <p style={{ fontSize: '0.7rem', color: T.textSec, marginBottom: 4 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: '0.8rem', color: T.textPri, fontFamily: 'JetBrains Mono, monospace' }}>
          {p.name === 'revenue' ? 'Rp ' : ''}{p.value?.toLocaleString('id-ID')}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' atau 'ops'
  const [data, setData] = useState({ stocks: [], pendingBOM: [], pendingRepairs: [], sales: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, b, r, sls] = await Promise.all([
          api.get('/stocks'), api.get('/supplies/pending'), api.get('/repairs/pending'), api.get('/sales')
        ]);
        setData({ 
          stocks: s.data.data || [], 
          pendingBOM: b.data.data || [], 
          pendingRepairs: r.data.data || [],
          sales: sls.data.data || []
        });
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  if (isLoading) return (
    <div className="flex h-full items-center justify-center gap-3" style={{ color: T.textSec, padding: 40 }}>
      <Activity size={16} className="animate-spin" />
      <span style={{ fontSize: '0.8rem', letterSpacing: '0.08em' }}>Memuat analitik ruang mesin…</span>
    </div>
  );

  /* ==============================================================
     KALKULASI DATA: OPERASIONAL
  ============================================================== */
  const totalAset  = data.stocks.reduce((a, i) => a + Number(i.total_modal || 0), 0);
  const totalStok  = data.stocks.length;

  const gradeCount = data.stocks.reduce((a, i) => { a[i.grade] = (a[i.grade] || 0) + 1; return a; }, {});
  const opsPieData = [
    { name: 'Grade A', value: gradeCount['Grade A'] || 0, color: T.jade },
    { name: 'Grade B', value: gradeCount['Grade B'] || 0, color: T.sky },
    { name: 'Grade C', value: gradeCount['Grade C'] || 0, color: T.gold },
    { name: 'Grade D', value: gradeCount['Grade D'] || 0, color: T.ember },
  ].filter(i => i.value > 0);

  const opsBarData = Object.entries(
    data.stocks.reduce((a, i) => { a[i.jenis] = (a[i.jenis] || 0) + 1; return a; }, {})
  ).map(([name, jumlah]) => ({ name, jumlah }));

  const oldestStocks = [...data.stocks]
    .map(i => ({ ...i, age: i.umur_stok !== undefined ? Number(i.umur_stok) : Math.floor((new Date() - new Date(i.tgl_masuk)) / 86400000) }))
    .sort((a, b) => b.age - a.age).slice(0, 4);

  /* ==============================================================
     KALKULASI DATA: PENJUALAN (SALES INSIGHT)
  ============================================================== */
  const totalPendapatan = data.sales.reduce((sum, s) => sum + Number(s.total_bayar || 0), 0);
  const totalProfit = data.sales.reduce((sum, s) => {
    const modalTransaksi = (s.items || []).reduce((m, item) => m + Number(item.total_modal || 0), 0);
    return sum + (Number(s.total_bayar || 0) - modalTransaksi);
  }, 0);
  
  const marginProfit = totalPendapatan ? ((totalProfit / totalPendapatan) * 100).toFixed(1) : 0;
  const totalTransaksi = data.sales.length;

  // Pie Chart: Sumber Platform
  const platformCount = data.sales.reduce((a, s) => { a[s.sumber_penjualan] = (a[s.sumber_penjualan] || 0) + 1; return a; }, {});
  const platformColors = [T.jade, T.sky, T.gold, T.ember, T.goldDim];
  const salesPieData = Object.entries(platformCount).map(([name, value], idx) => ({ name, value, color: platformColors[idx % platformColors.length] }));

  // Bar Chart: Tren Pendapatan per Tanggal
  const trendMap = data.sales.reduce((a, s) => {
    const dateStr = s.tgl_transaksi ? new Date(s.tgl_transaksi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Unknown';
    a[dateStr] = (a[dateStr] || 0) + Number(s.total_bayar || 0);
    return a;
  }, {});
  const salesBarData = Object.entries(trendMap).map(([date, revenue]) => ({ date, revenue })).slice(-7); // Maksimal 7 hari terakhir

  // Data Item Terjual Terakhir (Untuk Alert Panel)
  const recentItems = data.sales.flatMap(s => s.items || []).slice(0, 5);

  return (
    <div className="space-y-6">

      {/* HEADER & TAB CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: T.textPri, margin: 0, letterSpacing: '-0.02em' }}>Analytics & Insight.</h1>
          <p style={{ color: T.textSec, fontSize: '0.8rem', marginTop: 4 }}>Pantau denyut finansial dan metrik operasional harian.</p>
        </div>
        
        <div style={{ display: 'flex', background: T.raised, padding: 4, borderRadius: 6, border: `1px solid ${T.border2}` }}>
          <button 
            onClick={() => setActiveTab('sales')}
            style={{ padding: '6px 14px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
              background: activeTab === 'sales' ? T.border2 : 'transparent', color: activeTab === 'sales' ? T.textPri : T.textMut }}>
            <BarChart3 size={13} /> Penjualan
          </button>
          <button 
            onClick={() => setActiveTab('ops')}
            style={{ padding: '6px 14px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
              background: activeTab === 'ops' ? T.border2 : 'transparent', color: activeTab === 'ops' ? T.textPri : T.textMut }}>
            <Settings2 size={13} /> Operasional
          </button>
        </div>
      </div>

      {activeTab === 'sales' ? (
        /* =========================================================
           TAB 1: DIMENSI PENJUALAN (SALES)
           ========================================================= */
        <>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Pendapatan', value: `Rp ${(totalPendapatan / 1e6).toFixed(1)}jt`, color: T.jade },
              { label: 'Profit Kotor',     value: `Rp ${(totalProfit / 1e6).toFixed(1)}jt`, color: T.gold },
              { label: 'Margin Profit',    value: `${marginProfit}%`, sub: 'Rasio', color: T.sky },
              { label: 'Total Transaksi',  value: `${totalTransaksi}`, sub: 'Nota', color: T.textPri },
            ].map(({ label, value, sub, color }) => (
              <Card key={label} style={{ padding: '20px 22px' }}>
                <Eyebrow>{label}</Eyebrow>
                <div className="mt-2 flex items-baseline gap-2">
                  <span style={{ fontSize: '1.6rem', fontWeight: 300, color, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em' }}>
                    {value}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: T.textMut, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{sub}</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
                <Eyebrow>Volume Berdasarkan Platform</Eyebrow>
              </div>
              <div style={{ height: 220, padding: '12px 8px' }}>
                {salesPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={salesPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                        {salesPieData.map((e, i) => <Cell key={i} fill={e.color} stroke={T.surface} strokeWidth={2} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: '0.7rem', color: T.textSec }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <Empty />}
              </div>
            </Card>

            <Card>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
                <Eyebrow>Tren Pendapatan Harian</Eyebrow>
              </div>
              <div style={{ height: 220, padding: '12px 8px' }}>
                {salesBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesBarData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <XAxis dataKey="date" stroke={T.textMut} tick={{ fontSize: 10, fill: T.textSec }} tickLine={false} axisLine={false} />
                      <YAxis stroke={T.textMut} tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={val => `Rp${val/1000}k`} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: T.raised }} />
                      <Bar dataKey="revenue" fill={T.jade} radius={[2, 2, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Empty />}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <AlertPanel title="Transaksi Terakhir" color={T.jade} link="/sales">
              {data.sales.length === 0 ? <EmptyRow text="Belum ada transaksi." /> :
                data.sales.slice(0, 4).map(i => (
                  <Row key={i.id_sales}
                    primary={i.no_invoice}
                    secondary={i.nama_pembeli}
                    badge={`Rp ${(Number(i.total_bayar)/1000).toFixed(0)}K`} badgeColor={T.jade} />
                ))}
            </AlertPanel>

            <AlertPanel title="Performa Platform" color={T.gold} link="/sales">
              {salesPieData.length === 0 ? <EmptyRow text="Data kosong." /> :
                [...salesPieData].sort((a, b) => b.value - a.value).slice(0, 4).map(i => (
                  <Row key={i.name}
                    primary={i.name}
                    secondary="Volume Transaksi"
                    badge={`${i.value} Nota`} badgeColor={T.gold} />
                ))}
            </AlertPanel>

            <AlertPanel title="Analisa Profit Item" color={T.sky} link="/sales">
              {recentItems.length === 0 ? <EmptyRow text="Belum ada item terjual." /> :
                recentItems.map((i, idx) => {
                  const p = Number(i.harga_jual_aktual) - Number(i.total_modal);
                  return (
                    <Row key={idx}
                      primary={i.nama_barang}
                      secondary={i.id_stock}
                      badge={p > 0 ? `+Rp${p/1000}k` : `Rp${p/1000}k`}
                      badgeColor={p > 0 ? T.sky : T.ember}
                    />
                  )
                })}
            </AlertPanel>
          </div>
        </>
      ) : (
        /* =========================================================
           TAB 2: DIMENSI OPERASIONAL (OPS)
           ========================================================= */
        <>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Nilai Aset', value: `Rp ${(totalAset / 1e6).toFixed(1)}jt`, sub: 'IDR', color: T.gold },
              { label: 'Item dalam Stok',  value: `${totalStok}`, sub: 'pcs', color: T.textPri },
              { label: 'Antrean BOM / QC', value: `${data.pendingBOM.length}`, sub: 'tugas', color: T.sky },
              { label: 'Perlu Reparasi',   value: `${data.pendingRepairs.length}`, sub: 'item', color: T.ember },
            ].map(({ label, value, sub, color }) => (
              <Card key={label} style={{ padding: '20px 22px' }}>
                <Eyebrow>{label}</Eyebrow>
                <div className="mt-2 flex items-baseline gap-2">
                  <span style={{ fontSize: '1.6rem', fontWeight: 300, color, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em' }}>
                    {value}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: T.textMut, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{sub}</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
                <Eyebrow>Distribusi grade</Eyebrow>
              </div>
              <div style={{ height: 220, padding: '12px 8px' }}>
                {opsPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={opsPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                        {opsPieData.map((e, i) => <Cell key={i} fill={e.color} stroke={T.surface} strokeWidth={2} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: '0.7rem', color: T.textSec }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <Empty />}
              </div>
            </Card>

            <Card>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
                <Eyebrow>Stok per kategori</Eyebrow>
              </div>
              <div style={{ height: 220, padding: '12px 8px' }}>
                {opsBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={opsBarData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 10, fill: T.textSec }} tickLine={false} axisLine={false} />
                      <YAxis stroke={T.textMut} tick={{ fontSize: 10, fill: T.textSec }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: T.raised }} />
                      <Bar dataKey="jumlah" fill={T.sky} radius={[2, 2, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Empty />}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <AlertPanel title="Prioritas BOM / QC" color={T.sky} link="/bom">
              {data.pendingBOM.length === 0 ? <EmptyRow text="Semua item diproses." /> :
                data.pendingBOM.slice(0, 4).map(i => (
                  <Row key={i.no_order}
                    primary={i.nama_barang}
                    secondary={i.sku}
                    badge="Menunggu QC" badgeColor={T.sky} />
                ))}
            </AlertPanel>

            <AlertPanel title="Prioritas Reparasi" color={T.ember} link="/repair">
              {data.pendingRepairs.length === 0 ? <EmptyRow text="Tidak ada perbaikan." /> :
                [...data.pendingRepairs].sort((a, b) => b.total_modal - a.total_modal).slice(0, 4).map(i => (
                  <Row key={i.id_stock}
                    primary={i.nama_barang}
                    secondary={<><span style={{ color: T.sky }}>{i.grade}</span> · {i.lokasi_rak}</>}
                    badge={`${(Number(i.total_modal) / 1000).toFixed(0)}K`} badgeColor={T.textSec} />
                ))}
            </AlertPanel>

            <AlertPanel title="Stok Tertua" color={T.jade} link="/stock">
              {oldestStocks.length === 0 ? <EmptyRow text="Tidak ada stok." /> :
                oldestStocks.map(i => (
                  <Row key={i.id_stock}
                    primary={i.nama_barang}
                    secondary={<><span style={{ color: T.gold }}>{i.grade}</span> · {i.lokasi_rak}</>}
                    badge={`${i.age} Hari`}
                    badgeColor={i.age > 30 ? T.ember : T.jade}
                  />
                ))}
            </AlertPanel>
          </div>
        </>
      )}

    </div>
  );
}

function AlertPanel({ title, color, link, children }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, background: color, borderRadius: 1, transform: 'rotate(45deg)' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textSec }}>
            {title}
          </span>
        </div>
        <Link to={link} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: T.textPri, opacity: 0.6, letterSpacing: '0.06em', textDecoration: 'none' }}>
          Semua <ArrowRight size={10} />
        </Link>
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </Card>
  );
}

function Row({ primary, secondary, badge, badgeColor }) {
  return (
    <div style={{ padding: '11px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <p style={{ fontSize: '0.8rem', color: T.textPri, fontWeight: 500 }}>{primary}</p>
        <p style={{ fontSize: '0.7rem', color: T.textSec, marginTop: 2 }}>{secondary}</p>
      </div>
      <span style={{ fontSize: '0.65rem', color: badgeColor, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em', fontWeight: 600 }}>
        {badge}
      </span>
    </div>
  );
}

function Empty() {
  return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3d3a4d', fontSize: '0.75rem' }}>Belum ada data tersedia.</div>;
}

function EmptyRow({ text }) {
  return <div style={{ padding: '24px 18px', textAlign: 'center', fontSize: '0.75rem', color: T.textMut }}>{text}</div>;
}