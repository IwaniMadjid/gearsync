import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Plus, X, CheckCircle2, ChevronDown } from 'lucide-react';
import api from '../services/api';

// --- SUB-KOMPONEN: SEARCHABLE SELECT (ANTI AUTO-PICK BROWSER) ---
function SearchableSelect({ label, options, value, onChange, placeholder, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const selectedOpt = options.find(o => o.value === value);
    setSearch(selectedOpt ? selectedOpt.label : '');
  }, [value]); 

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        const selectedOpt = options.find(o => o.value === value);
        setSearch(selectedOpt ? selectedOpt.label : '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, options]);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type="text"
          autoComplete="off" 
          disabled={disabled}
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-2 pr-10 rounded text-sm disabled:opacity-40 focus:border-orange-500 focus:outline-none transition-colors"
        />
        <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-zinc-500 pointer-events-none" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-950 border border-zinc-700 rounded shadow-2xl max-h-56 overflow-y-auto divide-y divide-zinc-900/50">
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-xs text-zinc-500 text-center">Tidak ditemukan hasil</div>
          ) : (
            filteredOptions.map(opt => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setSearch(opt.label);
                  setIsOpen(false);
                }}
                className={`p-2.5 text-xs cursor-pointer hover:bg-orange-600 hover:text-white transition-colors ${value === opt.value ? 'bg-zinc-900 text-orange-400 font-bold' : 'text-zinc-300'}`}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// --- KOMPONEN UTAMA SUPPLY ---
export default function Supply() {
  const [supplies, setSupplies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [masterShops, setMasterShops] = useState([]);
  const [masterSeries, setMasterSeries] = useState([]);
  
  const [formData, setFormData] = useState({
    tgl_masuk: '', supplier: '', status_bayar: 'ready', jenis: 'Unit', 
    brand: 'Samsung', seri: '', imei: '', modal_awal: '', lokasi_toko: 'Gudang Pusat', 
    lokasi_rak: '', foto: null 
  });

  const fetchData = async () => {
    try {
      const [suppliesRes, shopsRes, seriesRes] = await Promise.all([
        api.get('/supplies'),
        api.get('/master/toko'),
        api.get('/master/hp')
      ]);
      setSupplies(suppliesRes.data.data);
      setMasterShops(shopsRes.data.data);
      setMasterSeries(seriesRes.data.data);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplier || !formData.brand || !formData.seri) {
      return alert("Mohon lengkapi pilihan Supplier, Brand, dan Seri.");
    }

    // ==========================================
    // PERBAIKAN: LOGIKA STRUKTUR SKU PINTAR & RINGKAS
    // ==========================================
    const partMap = {
      'Unit': 'UNI', 'LCD': 'LCD', 'Baterai': 'BAT',
      'Frame LCD': 'FRM', 'List LCD': 'LST', 'Cover Backdoor': 'BCK', 'Lem Advise': 'LEM'
    };
    const kodePart = partMap[formData.jenis] || 'GEN';

    // Deteksi tipe jaringan (G = 5G, L = LTE, N = Normal/Tanpa Label)
    const seriUpper = formData.seri.toUpperCase().replace(/\s+/g, '');
    let jaringanSuffix = 'N'; 
    
    if (seriUpper.includes('5G')) {
      jaringanSuffix = 'G'; 
    } else if (seriUpper.includes('LTE')) {
      jaringanSuffix = 'L'; 
    }

    // Bersihkan nama seri untuk dimasukkan ke string tengah SKU
    const singkatanSeri = seriUpper
      .replace('5G', '')
      .replace('LTE', '')
      .replace('/', '')          
      .replace('ULTRA', 'U')
      .replace('+', 'P')
      .replace('FOLD', 'FD')
      .replace('FLIP', 'FP');

    // Menghasilkan kode pendek informatif, Contoh: LCD-S26UG-4829
    const skuFormat = `${kodePart}-${singkatanSeri}${jaringanSuffix}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const noOrder = `ORD-${Date.now()}`;
    const namaBarangFinal = formData.jenis === 'Unit' ? formData.seri : `${formData.jenis} ${formData.seri}`;

    const payload = new FormData();
    payload.append('no_order', noOrder);
    payload.append('sku', skuFormat);
    payload.append('tgl_masuk', formData.tgl_masuk);
    payload.append('supplier', formData.supplier);
    payload.append('status_bayar', formData.status_bayar);
    payload.append('jenis', formData.jenis);
    payload.append('brand', formData.brand);
    payload.append('imei', formData.imei);
    payload.append('nama_barang', namaBarangFinal);
    payload.append('modal_awal', formData.modal_awal);
    payload.append('lokasi_toko', formData.lokasi_toko);
    payload.append('lokasi_rak', formData.lokasi_rak);
    payload.append('status_proses', 'Pending');
    
    if (formData.foto) payload.append('foto', formData.foto);

    try {
      await api.post('/supplies', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setIsModalOpen(false);
      fetchData(); 
    } catch (error) { 
      alert("Gagal menyimpan kedatangan barang."); 
    }
  };

  const openModal = () => {
    setFormData({ 
      tgl_masuk: new Date().toISOString().split('T')[0], supplier: '', status_bayar: 'ready', 
      jenis: 'Unit', brand: 'Samsung', seri: '', imei: '', modal_awal: '', 
      lokasi_toko: 'Gudang Pusat', lokasi_rak: '', foto: null 
    });
    setIsModalOpen(true);
  };

  const filteredSupplies = supplies.filter(item => 
    item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.no_order.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uniqueBrands = useMemo(() => {
    return [...new Set(masterSeries.map(item => item.brand).filter(Boolean))];
  }, [masterSeries]);

  const availableSeries = useMemo(() => {
    return [...new Set(
      masterSeries.filter(item => item.brand === formData.brand).map(item => item.seri).filter(Boolean)
    )];
  }, [masterSeries, formData.brand]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between bg-zinc-900 p-4 rounded-lg border border-zinc-800">
        <div className="relative w-96">
          <Search className="absolute left-3 top-2.5 text-zinc-500 w-4 h-4" />
          <input type="text" placeholder="Cari Kode SKU, Manifes atau Nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-zinc-300 pl-10 pr-4 py-2 rounded text-sm focus:outline-none focus:border-orange-500" />
        </div>
        <button onClick={openModal} className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2 rounded text-sm font-semibold flex items-center shadow-lg transition-colors">
          <Plus className="w-4 h-4 mr-2" /> Log Barang Masuk
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs border-b border-zinc-800">
            <tr><th className="p-4">SKU / Tanggal</th><th className="p-4">Kategori & Nama</th><th className="p-4">Toko & Penyimpanan</th><th className="p-4">Modal Awal</th><th className="p-4">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filteredSupplies.map((item) => (
              <tr key={item.no_order} className="hover:bg-zinc-800/40 transition-colors">
                <td className="p-4">
                  <div className="font-mono text-orange-500 font-semibold">{item.sku}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{new Date(item.tgl_masuk).toLocaleDateString('id-ID')}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-zinc-200">{item.nama_barang}</div>
                  <div className="text-[10px] text-zinc-400 mt-1 uppercase">IMEI: {item.imei || '-'}</div>
                </td>
                <td className="p-4">
                  <div className="text-zinc-200">{item.supplier} / {item.lokasi_rak}</div>
                  <div className="text-xs text-orange-400 mt-1 uppercase font-semibold">{item.status_bayar}</div>
                </td>
                <td className="p-4 font-mono font-medium">Rp {Number(item.modal_awal).toLocaleString('id-ID')}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${item.status_proses === 'Selesai' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-orange-900/40 text-orange-500'}`}>{item.status_proses}</span>
                </td>
              </tr>
            ))}
            {filteredSupplies.length === 0 && (
              <tr><td colSpan="5" className="p-8 text-center text-zinc-500">Tidak ada riwayat kedatangan barang.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-zinc-950 p-5 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center"><Plus className="w-5 h-5 mr-2 text-orange-500" /> Form Kedatangan Barang</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* BARIS 1 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Tanggal Masuk</label>
                  <input type="date" name="tgl_masuk" value={formData.tgl_masuk} onChange={handleInputChange} required className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-2 rounded text-sm focus:border-orange-500 focus:outline-none" />
                </div>
                <SearchableSelect
                  label="Supplier"
                  options={masterShops.map(s => ({ label: s.nama_toko, value: s.nama_toko }))}
                  value={formData.supplier}
                  onChange={(val) => setFormData({ ...formData, supplier: val })}
                  placeholder="Ketik nama supplier..."
                />
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Status Bayar</label>
                  <select name="status_bayar" value={formData.status_bayar} onChange={handleInputChange} className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-2 rounded text-sm focus:border-orange-500 focus:outline-none">
                    <option value="Terjual">Terjual</option><option value="belumlunas">Belum Lunas</option><option value="cicilan">Cicilan</option><option value="tempo">Tempo</option><option value="refund">Refund</option><option value="belum bayar">Belum Bayar</option><option value="ready">Ready</option><option value="lunas">Lunas</option>
                  </select>
                </div>
              </div>

              {/* BARIS 2 */}
              <div className="grid grid-cols-3 gap-4">
                <SearchableSelect
                  label="Brand"
                  options={uniqueBrands.map(b => ({ label: b, value: b }))}
                  value={formData.brand}
                  onChange={(val) => setFormData({ ...formData, brand: val, seri: '' })}
                  placeholder="Cari Brand..."
                />
                <SearchableSelect
                  label="Seri HP"
                  options={availableSeries.map(s => ({ label: s, value: s }))}
                  value={formData.seri}
                  onChange={(val) => setFormData({ ...formData, seri: val })}
                  placeholder={formData.brand ? "Ketik seri hp..." : "Pilih brand dulu"}
                  disabled={!formData.brand}
                />
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Jenis Barang</label>
                  <select name="jenis" value={formData.jenis} onChange={handleInputChange} className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-2 rounded text-sm focus:border-orange-500 focus:outline-none">
                    <option value="Unit">Unit / HP Utuh</option><option value="LCD">LCD</option><option value="Baterai">Baterai</option><option value="Frame LCD">Frame LCD</option><option value="List LCD">List LCD</option><option value="Cover Backdoor">Cover Backdoor</option><option value="Lem Advise">Lem Advise</option>
                  </select>
                </div>
              </div>

              {/* BARIS 3 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">IMEI / S/N (Opsional)</label>
                  <input type="text" name="imei" placeholder="35xxxxxxxxxxxxx" value={formData.imei} onChange={handleInputChange} className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-2 rounded text-sm focus:border-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Lokasi Rak (Transit)</label>
                  <input type="text" name="lokasi_rak" placeholder="Rak A-1" value={formData.lokasi_rak} onChange={handleInputChange} required className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-2 rounded text-sm focus:border-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Modal Awal (Rp)</label>
                  <input type="number" name="modal_awal" placeholder="1500000" value={formData.modal_awal} onChange={handleInputChange} required className="w-full bg-zinc-950 border border-zinc-700 text-orange-400 font-mono font-bold px-3 py-2 rounded text-sm focus:border-orange-500 focus:outline-none" />
                </div>
              </div>

              {/* BARIS 4 */}
              <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-lg">
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Foto Bukti Barang Datang (Opsional)</label>
                <input type="file" accept="image/*" onChange={(e) => setFormData({...formData, foto: e.target.files[0]})} className="w-full text-sm text-zinc-400 file:bg-zinc-800 file:hover:bg-zinc-700 file:text-zinc-300 file:border-0 file:py-2 file:px-4 file:rounded-md file:mr-4 file:transition-colors focus:outline-none" />
              </div>
              
              <div className="flex justify-end pt-4 border-t border-zinc-800 mt-4">
                <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded text-sm font-bold flex items-center transition-colors"><CheckCircle2 className="w-5 h-5 mr-2" /> Simpan Ke Manifes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}