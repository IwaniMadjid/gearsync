import React, { useState, useEffect } from 'react';
import { Hammer, X } from 'lucide-react';
import api from '../services/api';

export default function Repair() {
  const [repairItems, setRepairItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  
  // FIX 1: Hapus updateGrade, ganti dengan newGrade yang default-nya mengikuti grade saat ini, dan tambah foto
  const [formData, setFormData] = useState({ 
    tambahan_biaya: '', 
    catatan: '', 
    newGrade: 'Grade A', 
    lokasi_rak_baru: '',
    foto: null 
  });

  const fetchRepairs = async () => { 
    const res = await api.get('/repairs/pending'); 
    setRepairItems(res.data.data); 
  };
  
  useEffect(() => { fetchRepairs(); }, []);

  const openRepairModal = (item) => { 
    setActiveItem(item); 
    setFormData({ 
      tambahan_biaya: '', 
      catatan: '', 
      newGrade: item.grade, // Set default dropdown ke grade saat ini
      lokasi_rak_baru: item.lokasi_rak,
      foto: null 
    }); 
    setIsModalOpen(true); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // FIX 2: Gunakan FormData agar bisa mengirim file gambar ke backend Flask
    const payload = new FormData();
    payload.append('id_stock', activeItem.id_stock);
    payload.append('tambahan_biaya', formData.tambahan_biaya);
    payload.append('catatan', formData.catatan);
    payload.append('grade_sebelum', activeItem.grade);
    payload.append('grade_sesudah', formData.newGrade);
    payload.append('lokasi_rak_baru', formData.lokasi_rak_baru);
    
    if (formData.foto) {
      payload.append('foto', formData.foto);
    }

    try {
      await api.post('/repairs/execute', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsModalOpen(false); 
      fetchRepairs();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menyimpan log reparasi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-xl font-bold text-zinc-100 mb-4">Meja Reparasi Komponen</h2>
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs">
            <tr>
              <th className="p-4">SKU / Nama</th>
              <th className="p-4">Grade & Rak</th>
              <th className="p-4 text-center">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {repairItems.map((item) => (
              <tr key={item.id_stock} className="hover:bg-zinc-800/40 transition-colors">
                <td className="p-4">
                  <div className="font-mono text-orange-500 font-semibold">{item.id_stock}</div>
                  <div className="text-zinc-200">{item.nama_barang}</div>
                </td>
                <td className="p-4">
                  <span className="text-blue-400 font-semibold">{item.grade}</span>
                  <div className="text-xs text-zinc-500 mt-1">{item.lokasi_rak}</div>
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => openRepairModal(item)} className="bg-zinc-800 text-orange-400 hover:text-orange-300 border border-zinc-700 hover:border-orange-500 px-3 py-1.5 rounded text-xs font-semibold transition-colors">
                    <Hammer className="w-3 h-3 inline mr-1" /> Input Reparasi
                  </button>
                </td>
              </tr>
            ))}
            {repairItems.length === 0 && (
              <tr><td colSpan="3" className="p-8 text-center text-zinc-500">Tidak ada komponen yang masuk meja reparasi.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && activeItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center">
                <Hammer className="w-5 h-5 mr-2 text-orange-500" /> Log Tindakan Reparasi
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">BIAYA TAMBAHAN (Rp)</label>
                  <input type="number" value={formData.tambahan_biaya} onChange={(e) => setFormData({...formData, tambahan_biaya: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 text-orange-400 font-mono px-3 py-2 rounded focus:border-orange-500 focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">PINDAH RAK</label>
                  <input type="text" value={formData.lokasi_rak_baru} onChange={(e) => setFormData({...formData, lokasi_rak_baru: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-2 rounded focus:border-orange-500 focus:outline-none" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">CATATAN TINDAKAN</label>
                <input type="text" placeholder="Misal: Ganti kaca OCA, lem ulang..." value={formData.catatan} onChange={(e) => setFormData({...formData, catatan: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-2 rounded focus:border-orange-500 focus:outline-none" required />
              </div>

              {/* FIX 3: Beri kebebasan memilih semua Grade */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">GRADE SETELAH REPARASI</label>
                <select value={formData.newGrade} onChange={(e) => setFormData({...formData, newGrade: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 text-emerald-400 font-semibold px-3 py-2 rounded focus:border-orange-500 focus:outline-none">
                  <option value="Grade A">Grade A (Normal)</option>
                  <option value="Grade B">Grade B (Minus Fisik)</option>
                  <option value="Grade C">Grade C (Gagal Sempurna)</option>
                  <option value="Grade D">Grade D (Mati Total)</option>
                </select>
              </div>

              {/* FIX 4: Input Foto Upload */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">FOTO BUKTI SETELAH REPAIR</label>
                <input type="file" accept="image/*" onChange={(e) => setFormData({...formData, foto: e.target.files[0]})} className="w-full text-sm text-zinc-400 file:bg-zinc-800 file:text-zinc-300 file:border-0 file:py-2 file:px-3 file:rounded" />
              </div>

              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded font-bold mt-6 transition-colors">
                Simpan Log & Perbarui Stok
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}