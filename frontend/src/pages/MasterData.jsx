import React, { useState, useEffect } from 'react';
import { Database, Smartphone, Store, Warehouse, Settings, Plus, Trash2, Activity, X } from 'lucide-react';
import api from '../services/api';

const KOMPONEN_UNIT = ['LCD', 'Baterai', 'Frame LCD', 'List LCD', 'Cover Backdoor', 'Lem Advise'];

export default function MasterData() {
  const [activeTab, setActiveTab] = useState('hp');
  const [dataList, setDataList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tabs = [
    { id: 'hp', label: 'Seri HP & Komponen', icon: Smartphone },
    { id: 'sparepart', label: 'Jenis Kerusakan', icon: Settings },
    { id: 'toko', label: 'Toko / Supplier', icon: Store },
    { id: 'gudang', label: 'Lokasi Gudang', icon: Warehouse },

  ];

  const fetchMasterData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/master/${activeTab}`);
      setDataList(response.data.data);
    } catch (error) {
      console.error("Gagal mengambil data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
    setIsModalOpen(false);
    
    if (activeTab === 'hp') {
      const defaultPrices = KOMPONEN_UNIT.reduce((acc, part) => ({...acc, [part]: {a: '', d: ''}}), {});
      setFormData({ jenis_produk: 'Unit', brand: 'Samsung', harga_parts: defaultPrices });
    } else if (activeTab === 'sparepart') {
      setFormData({ grade: 'Grade B' });
    } else {
      setFormData({});
    }
  }, [activeTab]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/master/${activeTab}`, formData);
      setIsModalOpen(false);
      fetchMasterData();
    } catch (error) {
      alert("Gagal menambahkan data.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    try {
      await api.delete(`/master/${activeTab}/${id}`);
      fetchMasterData();
    } catch (error) {
      alert("Gagal menghapus data.");
    }
  };

  // --- LOGIKA HEADER TABEL DINAMIS ---
  const renderTableHeader = () => {
    switch (activeTab) {
      case 'hp':
        return (
          <tr>
            <th className="p-3 w-1/4">Brand & Seri</th>
            <th className="p-3 w-1/4">Jenis Part</th>
            <th className="p-3 w-1/5 text-right">Harga Jual (A)</th>
            <th className="p-3 w-1/5 text-right">Harga Jual (D)</th>
            <th className="p-3 text-center w-16">Aksi</th>
          </tr>
        );
      case 'sparepart':
        return (
          <tr>
            <th className="p-3 w-1/4">Nama Part</th>
            <th className="p-3 w-1/6 text-center">Grade</th>
            <th className="p-3">Jenis Cacat Spesifik</th>
            <th className="p-3 text-center w-16">Aksi</th>
          </tr>
        );
      case 'toko':
        return (
          <tr>
            <th className="p-3">Nama Toko / Supplier</th>
            <th className="p-3 text-center w-16">Aksi</th>
          </tr>
        );
      case 'gudang':
        return (
          <tr>
            <th className="p-3">Lokasi / Kode Gudang</th>
            <th className="p-3 text-center w-16">Aksi</th>
          </tr>
        );
      case 'harga':
        return (
          <tr>
            <th className="p-3 w-1/2">Kode Grade</th>
            <th className="p-3 w-1/2 text-right">Standar Harga (Rp)</th>
            <th className="p-3 text-center w-16">Aksi</th>
          </tr>
        );
      default:
        return null;
    }
  };

  // --- LOGIKA ISI BARIS TABEL DINAMIS ---
  const renderTableRow = (item) => {
    switch (activeTab) {
      case 'hp':
        return (
          <>
            <td className="p-3 font-semibold text-zinc-200">{item.brand} {item.seri}</td>
            <td className="p-3">
              <span className="text-[10px] uppercase bg-orange-900/40 text-orange-500 px-2 py-1 rounded border border-orange-700/50 font-bold tracking-wider">
                {item.jenis_produk}
              </span>
            </td>
            <td className="p-3 text-right font-mono text-emerald-400 font-medium">Rp {Number(item.harga_grade_a).toLocaleString('id-ID')}</td>
            <td className="p-3 text-right font-mono text-red-400 font-medium">Rp {Number(item.harga_grade_d).toLocaleString('id-ID')}</td>
          </>
        );
      case 'sparepart':
        return (
          <>
            <td className="p-3 font-semibold text-zinc-200">{item.part}</td>
            <td className="p-3 text-center">
              <span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded font-bold border border-zinc-700">
                {item.grade}
              </span>
            </td>
            <td className="p-3 text-zinc-400">{item.jenis_cacat}</td>
          </>
        );
      case 'toko':
        return <td className="p-3 font-medium text-zinc-200">{item.nama_toko}</td>;
      case 'gudang':
        return <td className="p-3 font-medium text-zinc-200">{item.nama_gudang}</td>;
      case 'harga':
        return (
          <>
            <td className="p-3 font-medium text-zinc-200">{item.grade}</td>
            <td className="p-3 text-right font-mono text-orange-400 font-bold">Rp {Number(item.harga).toLocaleString('id-ID')}</td>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 shadow-lg">
        <h2 className="text-xl font-bold text-zinc-100 flex items-center mb-6">
          <Database className="w-5 h-5 mr-2 text-orange-500" /> Pusat Master Data
        </h2>
        
        {/* NAVIGASI TAB */}
        <div className="flex space-x-2 border-b border-zinc-800 pb-4 mb-6 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center px-4 py-2 rounded text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-md' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'}`}>
                <Icon className="w-4 h-4 mr-2" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* AREA TABEL UTAMA */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
            <h3 className="text-zinc-100 font-bold text-sm uppercase tracking-wider">Tabel Data Tersimpan</h3>
            <button onClick={() => setIsModalOpen(true)} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded text-xs font-semibold flex items-center shadow-lg transition-colors">
              <Plus className="w-4 h-4 mr-1.5" /> Tambah Data
            </button>
          </div>
          
          <div className="p-0 flex-1 overflow-x-auto">
            {isLoading ? (
              <div className="p-12 flex justify-center text-zinc-500"><Activity className="w-8 h-8 animate-spin"/></div>
            ) : dataList.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-sm">Belum ada data di tabel ini.</div>
            ) : (
              <table className="w-full text-left text-sm text-zinc-300 whitespace-nowrap">
                <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  {renderTableHeader()}
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {dataList.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-800/40 transition-colors group">
                      {renderTableRow(item)}
                      <td className="p-3 text-center">
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Hapus Data">
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* MODAL FORM TAMBAH DATA (TIDAK BERUBAH) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center uppercase tracking-wider text-sm">
                <Plus className="w-5 h-5 mr-2 text-emerald-400" /> Tambah Data Baru
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {activeTab === 'hp' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-2">JENIS PRODUK</label>
                    <select value={formData.jenis_produk || 'Unit'} onChange={(e) => setFormData({...formData, jenis_produk: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-3 rounded text-sm focus:border-orange-500 focus:outline-none">
                      <option value="Unit">Unit (Dipecah 6 Komponen)</option>
                      <option value="LCD">LCD Saja</option>
                      <option value="Baterai">Baterai Saja</option>
                      <option value="Frame LCD">Frame LCD</option>
                      <option value="List LCD">List LCD</option>
                      <option value="Cover Backdoor">Cover Backdoor</option>
                      <option value="Lem Advise">Lem Advise</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-2">BRAND</label>
                      <input type="text" value={formData.brand || ''} onChange={(e) => setFormData({...formData, brand: e.target.value})} placeholder="Samsung..." className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-3 rounded text-sm focus:border-orange-500 focus:outline-none" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-2">SERI</label>
                      <input type="text" value={formData.seri || ''} onChange={(e) => setFormData({...formData, seri: e.target.value})} placeholder="S26 Ultra..." className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-3 rounded text-sm focus:border-orange-500 focus:outline-none" required />
                    </div>
                  </div>

                  {formData.jenis_produk === 'Unit' ? (
                    <div className="mt-6 pt-4 border-t border-zinc-800 space-y-3">
                      <label className="block text-xs font-bold text-orange-500 mb-3 tracking-wider">TENTUKAN HARGA JUAL KE-6 KOMPONEN</label>
                      <div className="grid grid-cols-12 gap-2 text-[10px] text-zinc-500 font-semibold px-2">
                        <div className="col-span-4">NAMA PART</div>
                        <div className="col-span-4 text-center">HARGA GRADE A</div>
                        <div className="col-span-4 text-center">HARGA GRADE D</div>
                      </div>
                      {KOMPONEN_UNIT.map((part) => (
                        <div key={part} className="grid grid-cols-12 gap-2 items-center bg-zinc-950/50 p-2 rounded border border-zinc-800/50">
                          <div className="col-span-4 text-xs font-medium text-zinc-300">{part}</div>
                          <div className="col-span-4">
                            <input type="number" placeholder="Rp Grade A" value={formData.harga_parts?.[part]?.a || ''} onChange={(e) => {
                                setFormData(prev => ({...prev, harga_parts: {...prev.harga_parts, [part]: {...prev.harga_parts[part], a: e.target.value}}}));
                            }} className="w-full bg-zinc-900 border border-zinc-700 text-emerald-400 font-mono px-2 py-2 rounded text-xs focus:border-orange-500 focus:outline-none" required />
                          </div>
                          <div className="col-span-4">
                            <input type="number" placeholder="Rp Grade D" value={formData.harga_parts?.[part]?.d || ''} onChange={(e) => {
                                setFormData(prev => ({...prev, harga_parts: {...prev.harga_parts, [part]: {...prev.harga_parts[part], d: e.target.value}}}));
                            }} className="w-full bg-zinc-900 border border-zinc-700 text-red-400 font-mono px-2 py-2 rounded text-xs focus:border-orange-500 focus:outline-none" required />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-2">HARGA JUAL GRADE A (RP)</label>
                        <input type="number" value={formData.harga_grade_a || ''} onChange={(e) => setFormData({...formData, harga_grade_a: e.target.value})} placeholder="Misal: 1500000" className="w-full bg-zinc-950 border border-zinc-700 text-emerald-400 font-mono px-3 py-3 rounded text-sm focus:border-orange-500 focus:outline-none" required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-2">HARGA JUAL GRADE D (RP)</label>
                        <input type="number" value={formData.harga_grade_d || ''} onChange={(e) => setFormData({...formData, harga_grade_d: e.target.value})} placeholder="Misal: 200000" className="w-full bg-zinc-950 border border-zinc-700 text-red-400 font-mono px-3 py-3 rounded text-sm focus:border-orange-500 focus:outline-none" required />
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {activeTab === 'sparepart' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-2">NAMA PART</label>
                      <input type="text" value={formData.part || ''} onChange={(e) => setFormData({...formData, part: e.target.value})} placeholder="LCD, Baterai..." className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-3 rounded text-sm focus:border-orange-500 focus:outline-none" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-2">GRADE</label>
                      <select value={formData.grade || 'Grade B'} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-3 rounded text-sm focus:border-orange-500 focus:outline-none">
                        <option value="Grade A">Grade A</option>
                        <option value="Grade B">Grade B</option>
                        <option value="Grade C">Grade C</option>
                        <option value="Grade D">Grade D</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-2">JENIS CACAT / KERUSAKAN</label>
                    <textarea value={formData.jenis_cacat || ''} onChange={(e) => setFormData({...formData, jenis_cacat: e.target.value})} placeholder="Retak kaca, tompel layar, IC lemah..." className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-3 rounded text-sm focus:border-orange-500 focus:outline-none" required rows="3" />
                  </div>
                </>
              )}

              {activeTab === 'toko' && (
                <div><label className="block text-xs font-semibold text-zinc-400 mb-2">NAMA TOKO / SUPPLIER</label><input type="text" value={formData.nama_toko || ''} onChange={(e) => setFormData({...formData, nama_toko: e.target.value})} placeholder="Contoh: Shopee King Sparepart" className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-3 rounded text-sm focus:border-orange-500 focus:outline-none" required /></div>
              )}

              {activeTab === 'gudang' && (
                <div><label className="block text-xs font-semibold text-zinc-400 mb-2">KODE / LOKASI GUDANG</label><input type="text" value={formData.nama_gudang || ''} onChange={(e) => setFormData({...formData, nama_gudang: e.target.value})} placeholder="Contoh: Warehouse A" className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-3 rounded text-sm focus:border-orange-500 focus:outline-none" required /></div>
              )}

              {activeTab === 'harga' && (
                <>
                  <div><label className="block text-xs font-semibold text-zinc-400 mb-2">KODE GRADE</label><input type="text" value={formData.grade || ''} onChange={(e) => setFormData({...formData, grade: e.target.value})} placeholder="Contoh: Grade C" className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-3 rounded text-sm focus:border-orange-500 focus:outline-none" required /></div>
                  <div><label className="block text-xs font-semibold text-zinc-400 mb-2">STANDAR HARGA (RP)</label><input type="number" value={formData.harga || ''} onChange={(e) => setFormData({...formData, harga: e.target.value})} placeholder="Contoh: 50000" className="w-full bg-zinc-950 border border-zinc-700 text-orange-400 font-mono px-3 py-3 rounded text-sm focus:border-orange-500 focus:outline-none" required /></div>
                </>
              )}

              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 mt-6 rounded transition-colors shadow-lg">
                Simpan Master Data
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}