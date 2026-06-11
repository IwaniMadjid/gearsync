import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Package, Wrench, AlertCircle, Activity, 
  ArrowRight, BarChart3, PieChart as PieChartIcon, Clock 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const [data, setData] = useState({
    stocks: [],
    pendingBOM: [],
    pendingRepairs: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [stocksRes, bomRes, repairsRes] = await Promise.all([
          api.get('/stocks'),
          api.get('/supplies/pending'),
          api.get('/repairs/pending')
        ]);
        
        setData({
          stocks: stocksRes.data.data,
          pendingBOM: bomRes.data.data,
          pendingRepairs: repairsRes.data.data
        });
      } catch (error) {
        console.error("Gagal menarik data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // --- AGREGASI DATA UNTUK METRIK & GRAFIK ---
  const totalAset = data.stocks.reduce((acc, item) => acc + Number(item.total_modal), 0);
  const totalStok = data.stocks.length;
  
  // Agregasi untuk Pie Chart (Distribusi Grade)
  const gradeCount = data.stocks.reduce((acc, item) => {
    acc[item.grade] = (acc[item.grade] || 0) + 1;
    return acc;
  }, {});
  
  const pieData = [
    { name: 'Grade A', value: gradeCount['Grade A'] || 0, color: '#34d399' }, // Emerald-400
    { name: 'Grade B', value: gradeCount['Grade B'] || 0, color: '#60a5fa' }, // Blue-400
    { name: 'Grade C', value: gradeCount['Grade C'] || 0, color: '#fbbf24' }, // Yellow-400
    { name: 'Grade D', value: gradeCount['Grade D'] || 0, color: '#f87171' }, // Red-400
  ].filter(item => item.value > 0);

  // Agregasi untuk Bar Chart (Ketersediaan per Jenis)
  const jenisCount = data.stocks.reduce((acc, item) => {
    acc[item.jenis] = (acc[item.jenis] || 0) + 1;
    return acc;
  }, {});
  
  const barData = Object.keys(jenisCount).map(key => ({
    name: key,
    jumlah: jenisCount[key]
  }));

  // --- LOGIKA STOK TERTUA ---
  const sortedOldestStocks = [...data.stocks]
    .map(item => {
      // Hitung umur secara dinamis dari tgl_masuk jika belum dihitung dari backend
      const ageInDays = item.umur_stok !== undefined 
        ? Number(item.umur_stok) 
        : Math.floor((new Date() - new Date(item.tgl_masuk)) / (1000 * 60 * 60 * 24));
      return { ...item, calculatedAge: ageInDays || 0 };
    })
    .sort((a, b) => b.calculatedAge - a.calculatedAge)
    .slice(0, 4); // Ambil 4 terlama

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-zinc-500"><Activity className="w-6 h-6 animate-spin mr-2"/> Memuat Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER & TANGGAL */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Ringkasan Operasional</h1>
          <p className="text-zinc-400 text-sm mt-1">Data terkini pada {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Nilai Aset</p>
              <h3 className="text-2xl font-mono font-bold text-emerald-400">Rp {totalAset.toLocaleString('id-ID')}</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-500" /></div>
          </div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Item Stok</p>
              <h3 className="text-2xl font-mono font-bold text-zinc-100">{totalStok} <span className="text-sm text-zinc-500 font-sans font-normal">Pcs</span></h3>
            </div>
            <div className="p-2 bg-zinc-800 rounded-lg"><Package className="w-5 h-5 text-zinc-400" /></div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Antrean BOM / QC</p>
              <h3 className="text-2xl font-mono font-bold text-orange-500">{data.pendingBOM.length} <span className="text-sm text-zinc-500 font-sans font-normal">Tugas</span></h3>
            </div>
            <div className="p-2 bg-orange-500/10 rounded-lg"><AlertCircle className="w-5 h-5 text-orange-500" /></div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Perlu Reparasi</p>
              <h3 className="text-2xl font-mono font-bold text-red-400">{data.pendingRepairs.length} <span className="text-sm text-zinc-500 font-sans font-normal">Item</span></h3>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg"><Wrench className="w-5 h-5 text-red-500" /></div>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pie Chart: Distribusi Grade */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center mb-6">
            <PieChartIcon className="w-4 h-4 mr-2 text-zinc-400" /> Distribusi Kualitas (Grade) Stok
          </h3>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(24, 24, 27, 1)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
                    itemStyle={{ color: '#f4f4f5' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-sm">Belum ada data stok.</div>
            )}
          </div>
        </div>

        {/* Bar Chart: Kategori Barang */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center mb-6">
            <BarChart3 className="w-4 h-4 mr-2 text-zinc-400" /> Ketersediaan Berdasarkan Kategori
          </h3>
          <div className="h-64">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#27272a' }}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
                  />
                  <Bar dataKey="jumlah" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-sm">Belum ada data stok.</div>
            )}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS / ALERTS (DIUBAH MENJADI 3 KOLOM SEJAJAR) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Antrean BOM Terlama */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-orange-500" /> Prioritas BOM / QC
            </h3>
            <Link to="/bom" className="text-xs text-orange-500 hover:text-orange-400 flex items-center">Semua <ArrowRight className="w-3 h-3 ml-1" /></Link>
          </div>
          <div className="p-0 flex-1">
            {data.pendingBOM.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-sm">Semua kedatangan diproses.</div>
            ) : (
              <ul className="divide-y divide-zinc-800/50">
                {data.pendingBOM.slice(0, 4).map(item => (
                  <li key={item.no_order} className="p-4 hover:bg-zinc-800/30 transition-colors flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{item.nama_barang}</p>
                      <p className="text-xs text-zinc-500 mt-1 font-mono">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-orange-500 mt-1 bg-orange-500/10 px-2 py-0.5 rounded inline-block">Menunggu QC</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Antrean Reparasi Grade Tertinggi Modal */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center">
              <Wrench className="w-4 h-4 mr-2 text-red-500" /> Prioritas Reparasi
            </h3>
            <Link to="/repair" className="text-xs text-orange-500 hover:text-orange-400 flex items-center">Semua <ArrowRight className="w-3 h-3 ml-1" /></Link>
          </div>
          <div className="p-0 flex-1">
            {data.pendingRepairs.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-sm">Tidak ada perbaikan.</div>
            ) : (
              <ul className="divide-y divide-zinc-800/50">
                {data.pendingRepairs.sort((a, b) => b.total_modal - a.total_modal).slice(0, 4).map(item => (
                  <li key={item.id_stock} className="p-4 hover:bg-zinc-800/30 transition-colors flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{item.nama_barang}</p>
                      <p className="text-xs text-zinc-500 mt-1"><span className="text-blue-400 font-semibold">{item.grade}</span> • {item.lokasi_rak}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-zinc-400">Rp {(Number(item.total_modal)/1000).toLocaleString('id-ID')}K</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* SECTION BARU: Stok Tertua */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-red-400" /> Stok Tertua
            </h3>
            <Link to="/stock" className="text-xs text-orange-500 hover:text-orange-400 flex items-center">Semua <ArrowRight className="w-3 h-3 ml-1" /></Link>
          </div>
          <div className="p-0 flex-1">
            {sortedOldestStocks.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-sm">Tidak ada data stok.</div>
            ) : (
              <ul className="divide-y divide-zinc-800/50">
                {sortedOldestStocks.map(item => (
                  <li key={item.id_stock} className="p-4 hover:bg-zinc-800/30 transition-colors flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{item.nama_barang}</p>
                      <p className="text-xs text-zinc-500 mt-1"><span className="text-orange-400 font-semibold">{item.grade}</span> • {item.lokasi_rak}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[10px] font-bold px-2 py-1 rounded inline-block ${item.calculatedAge > 30 ? 'bg-red-950/50 text-red-400' : 'bg-zinc-800 text-zinc-300'}`}>
                        {item.calculatedAge} Hari
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}