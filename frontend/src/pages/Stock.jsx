import React, { useState, useEffect } from 'react';
import { Search, X, Layers, Clock, Calendar, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';

export default function Stock() {
  const [stocks, setStocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDetail, setActiveDetail] = useState(null);

  useEffect(() => { 
    const fetchStocks = async () => { 
      const res = await api.get('/stocks'); 
      setStocks(res.data.data); 
    }; 
    fetchStocks(); 
  }, []);

  const filtered = stocks.filter(i => 
    i.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.id_stock.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fungsi pembantu warna umur stok
  const getAgeBadgeColor = (age) => {
    if (age <= 7) return 'bg-emerald-950 text-emerald-400 border-emerald-800';
    if (age <= 30) return 'bg-orange-950 text-orange-400 border-orange-800';
    return 'bg-red-950 text-red-400 border-red-800 animate-pulse';
  };

  return (
    <div className="space-y-4">
      <div className="flex bg-zinc-900 p-4 rounded-lg border border-zinc-800">
        <div className="relative w-96">
          <Search className="absolute left-3 top-2.5 text-zinc-500 w-4 h-4" />
          <input type="text" placeholder="Cari ID atau Nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-zinc-300 pl-10 pr-4 py-2 rounded text-sm focus:outline-none focus:border-orange-500" />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs">
            <tr>
              <th className="p-4">ID Stok (SKU)</th>
              <th className="p-4">Nama Barang</th>
              <th className="p-4">Grade & Rak</th>
              <th className="p-4">Umur Barang</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.map((item) => (
              <tr key={item.id_stock} className="hover:bg-zinc-800/40">
                <td className="p-4 font-mono text-orange-500 text-xs">{item.id_stock}</td>
                <td className="p-4">
                  <div className="font-medium text-zinc-200">{item.nama_barang}</div>
                  <div className="text-xs text-zinc-500 mt-1 uppercase">IMEI Induk: {item.imei_asal || '-'}</div>
                </td>
                <td className="p-4">
                  <span className="text-emerald-400 font-semibold">{item.grade}</span>
                  <div className="text-xs mt-1 text-zinc-400">{item.lokasi_rak}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${getAgeBadgeColor(item.umur_stok)}`}>
                    {item.umur_stok} Hari
                  </span>
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => setActiveDetail(item)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded text-xs font-semibold transition-colors">
                    <Layers className="w-3 h-3 inline mr-1" /> Detail Penuh
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="5" className="p-8 text-center text-zinc-500">Tidak ada data stok yang ditemukan.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail Semua Atribut (Data Hasil JOIN MySQL) */}
      {activeDetail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-5xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col"> 
            <div className="flex justify-between mb-6 border-b border-zinc-800 pb-4">
              <h3 className="text-xl font-bold text-zinc-100 flex items-center">
                Informasi Detail Aset
              </h3>
              <button onClick={() => setActiveDetail(null)} className="text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="grid grid-cols-2 gap-6 text-sm mb-6 border-b border-zinc-800 pb-6">
              {/* BAGIAN VISUAL LAMA (FOTO & QR) TETAP ADA */}
              <div className="col-span-2 flex gap-6 bg-zinc-950 p-4 rounded-lg border border-zinc-800 mb-2">
                <div>
                  <p className="text-zinc-500 text-xs font-semibold uppercase mb-2">Visual Komponen Terakhir</p>
                  {activeDetail.foto ? (
                    <img src={`http://localhost:5000${activeDetail.foto}`} alt="Foto Komponen" className="w-32 h-32 object-cover rounded border border-zinc-700 shadow-md" />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center bg-zinc-900 rounded border border-zinc-800 text-xs text-zinc-600">Tidak ada foto</div>
                  )}
                </div>
                <div>
                  <p className="text-zinc-500 text-xs font-semibold uppercase mb-2">QR Code Identitas</p>
                  {activeDetail.qr_code ? (
                    <img src={`http://localhost:5000${activeDetail.qr_code}`} alt="QR Code" className="w-32 h-32 bg-white p-1.5 rounded shadow-md" />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center bg-zinc-900 rounded border border-zinc-800 text-xs text-zinc-600">Belum ada QR</div>
                  )}
                </div>
              </div>

              <div><p className="text-zinc-500 mb-1">Kode SKU Tersimpan</p><p className="font-mono text-orange-500 font-bold">{activeDetail.id_stock}</p></div>
              <div><p className="text-zinc-500 mb-1">Nomor Order Asal (Manifes)</p><p className="font-mono text-zinc-300">{activeDetail.no_order}</p></div>
              <div className="col-span-2"><p className="text-zinc-500 mb-1">Nama / Deskripsi Komponen</p><p className="text-zinc-100 text-lg">{activeDetail.nama_barang}</p></div>
              <div><p className="text-zinc-500 mb-1">Identitas Kategori</p><p className="text-zinc-300">{activeDetail.jenis} - {activeDetail.brand}</p></div>
              <div><p className="text-zinc-500 mb-1">IMEI Bawaan (Turunan)</p><p className="text-zinc-300 font-mono bg-zinc-950 px-2 py-1 rounded inline-block">{activeDetail.imei_asal || 'Tidak Ada IMEI'}</p></div>
              <div><p className="text-zinc-500 mb-1">Grade Saat Ini</p><p className="text-emerald-400 font-bold">{activeDetail.grade}</p></div>
              <div><p className="text-zinc-500 mb-1">Status Ketersediaan</p><p className="text-zinc-300 uppercase font-semibold">{activeDetail.status_barang}</p></div>
              <div><p className="text-zinc-500 mb-1">Tujuan Tindakan</p><p className="text-orange-400 font-bold uppercase">{activeDetail.tindakan || 'Jual'}</p></div>
              
              <div className="col-span-2 border-t border-zinc-800 pt-4 mt-2"><p className="text-orange-500 font-semibold mb-3 tracking-wider text-xs">JEJAK DISTRIBUSI & FINANSIAL</p></div>
              <div>
                <p className="text-zinc-500 mb-1">Durasi Mengendap (Umur Stok)</p>
                <p className="text-zinc-300 font-mono flex items-center">
                   <Clock className="w-3.5 h-3.5 mr-1 text-zinc-500"/> {activeDetail.umur_stok} Hari Gudang
                </p>
              </div>
              <div>
                <p className="text-zinc-500 mb-1">Tanggal Masuk</p>
                <p className="text-zinc-300 font-mono flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-zinc-500"/> {activeDetail.tgl_masuk ? new Date(activeDetail.tgl_masuk).toLocaleDateString('id-ID') : '-'}
                </p>
              </div>
              <div><p className="text-zinc-500 mb-1">Lokasi Toko Pusat</p><p className="text-zinc-300">{activeDetail.lokasi_toko}</p></div>
              <div><p className="text-zinc-500 mb-1">Lokasi Rak Spesifik</p><p className="text-zinc-300 bg-zinc-950 px-2 py-1 rounded inline-block border border-zinc-800">{activeDetail.lokasi_rak}</p></div>
              <div><p className="text-zinc-500 mb-1">Status Pembayaran Supplier</p><p className="text-zinc-300 uppercase">{activeDetail.status_bayar}</p></div>
              <div><p className="text-zinc-500 mb-1">Riwayat Modal Proporsional</p>
                <div className="font-mono text-zinc-400">Dasar: Rp {Number(activeDetail.modal_awal).toLocaleString('id-ID')}</div>
                <div className="font-mono text-red-400 border-b border-zinc-700 pb-1 mb-1">Repair: +Rp {Number(activeDetail.biaya_reparasi).toLocaleString('id-ID')}</div>
                <div className="font-mono font-bold text-zinc-100 text-base">Total: Rp {Number(activeDetail.total_modal).toLocaleString('id-ID')}</div>
              </div>
            </div>

            {/* SEKSI BARU: ALUR FOTO 3 FASE DARI DATABASE (TIDAK MENGHAPUS YANG LAMA) */}
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center">
                <ImageIcon className="w-4 h-4 mr-1.5 text-orange-500" /> Alur Dokumentasi Kamera Pemeriksaan
              </h4>
              
              <div className="grid grid-cols-3 gap-4">
                {/* FASE 1: FOTO KEDATANGAN */}
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex flex-col space-y-2">
                  <span className="bg-zinc-900 text-zinc-400 text-[10px] font-bold px-2 py-1 rounded w-fit uppercase">Fase 1: Kedatangan</span>
                  <div className="bg-zinc-900 w-full h-48 rounded overflow-hidden border border-zinc-800 flex items-center justify-center">
                    {activeDetail.foto_datang ? (
                      <img src={`http://localhost:5000${activeDetail.foto_datang}`} alt="Datang" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-zinc-600 text-xs italic">Tidak ada foto</span>
                    )}
                  </div>
                </div>

                {/* FASE 2: FOTO QC / GRADING */}
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex flex-col space-y-2">
                  <span className="bg-orange-950 text-orange-400 text-[10px] font-bold px-2 py-1 rounded w-fit uppercase">Fase 2: Eksekusi BOM / QC</span>
                  <div className="bg-zinc-900 w-full h-48 rounded overflow-hidden border border-zinc-800 flex items-center justify-center">
                    {activeDetail.foto ? (
                      <img src={`http://localhost:5000${activeDetail.foto}`} alt="QC/Grading" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-zinc-600 text-xs italic">Tidak ada foto</span>
                    )}
                  </div>
                </div>

                {/* FASE 3: FOTO PASCA REPARASI */}
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex flex-col space-y-2">
                  <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded w-fit uppercase">Fase 3: Pasca Reparasi</span>
                  <div className="bg-zinc-900 w-full h-48 rounded overflow-hidden border border-zinc-800 flex items-center justify-center">
                    {activeDetail.foto_reparasi ? (
                      <img src={`http://localhost:5000${activeDetail.foto_reparasi}`} alt="Reparasi" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-zinc-600 text-xs italic">Belum masuk lab / tidak ada foto</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}