import React, { useState, useEffect } from 'react';
import { 
  FileText, User, ShoppingBag, Package, Trash2, 
  Search, PlusCircle, CreditCard, Save, AlertTriangle, Info 
} from 'lucide-react';
import api from '../services/api';

export default function SalesEntry() {
  // --- STATE UTAMA ---
  const [availableStocks, setAvailableStocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State untuk Invoice Header
  const [header, setHeader] = useState({
    no_invoice: '', // Bisa diisi manual atau auto-generate
    sumber_penjualan: 'Offline / Toko Fisik',
    nama_pembeli: '',
    no_order_marketplace: '',
    metode_pembayaran: 'Cash'
  });

  // State untuk Detail Items (Keranjang/Items Terjual)
  const [itemsToSell, setItemsToSell] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ambil Data Barang Siap Jual untuk Dropdown
  const fetchAvailableStocks = async () => {
    try {
      const res = await api.get('/inventory/available');
      setAvailableStocks(res.data.data);
    } catch (error) {
      console.error("Gagal mengambil data stok", error);
    }
  };

  useEffect(() => { fetchAvailableStocks(); }, []);

  // --- LOGIKA FORMULIR DETAIL (MENAMBAH BARANG TERJUAL) ---
  const handleAddItemFromSearch = (idStockToAdd) => {
    if (!idStockToAdd) return;
    
    // Cari barang lengkap dari daftar master
    const stockItem = availableStocks.find(s => s.id_stock === idStockToAdd);
    
    if (!stockItem) return;
    // Hindari duplikasi barang fisik yang sama
    if (itemsToSell.some(i => i.id_stock === idStockToAdd)) return alert("Barang ini sudah ada di daftar.");

    // Tambahkan ke daftar jual dengan default harga jual modal+10% (Contoh saja)
    setItemsToSell([...itemsToSell, { 
      ...stockItem, 
      harga_jual_aktual: Math.round(Number(stockItem.total_modal) * 1.1) 
    }]);
    
    // Bersihkan search bar
    setSearchQuery('');
  };

  const removeItem = (idStockToRemove) => {
    setItemsToSell(itemsToSell.filter(i => i.id_stock !== idStockToRemove));
  };

  const updateItemPrice = (idStockToUpdate, newPrice) => {
    setItemsToSell(itemsToSell.map(i => 
      i.id_stock === idStockToUpdate ? { ...i, harga_jual_aktual: Number(newPrice) } : i
    ));
  };

  // --- LOGIKA KALKULASI TOTAL ---
  const totalModal_InternalView = itemsToSell.reduce((sum, i) => sum + Number(i.total_modal), 0);
  const totalPenjualan = itemsToSell.reduce((sum, i) => sum + i.harga_jual_aktual, 0);
  const totalItem = itemsToSell.length;
  const estimasiLaba = totalPenjualan - totalModal_InternalView;

  // --- LOGIKA SIMPAN & EXEKUSI PENJUALAN ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (totalItem === 0) return alert("Pilih minimal satu barang yang terjual!");
    
    // Validasi No Invoice jika diisi manual
    if (!header.no_invoice && header.sumber_penjualan !== 'Offline / Toko Fisik') {
        return alert("Pencatatan Marketplace wajib mengisi No. Invoice/Order dari Marketplace!");
    }

    setIsSubmitting(true);

    // Generate No Invoice Auto jika kosong (untuk offline)
    const finalNoInvoice = header.no_invoice || `GS-TRAD-${Date.now().toString().slice(-6)}`;

    const payload = {
      no_invoice: finalNoInvoice,
      sumber_penjualan: header.sumber_penjualan,
      nama_pembeli: header.nama_pembeli,
      no_order_marketplace: header.no_order_marketplace,
      metode_pembayaran: header.metode_pembayaran,
      items: itemsToSell.map(item => ({
        id_stock: item.id_stock,
        harga_jual_aktual: item.harga_jual_aktual
      }))
    };

    try {
      await api.post('/sales', payload);
      alert(`Pencatatan Penjualan ${finalNoInvoice} Berhasil Disimpan. Stok Sudah Dikurangi.`);
      
      // Reset Form Total
      setHeader({ no_invoice: '', sumber_penjualan: 'Offline / Toko Fisik', nama_pembeli: '', no_order_marketplace: '', metode_pembayaran: 'Cash' });
      setItemsToSell([]);
      fetchAvailableStocks(); 
    } catch (error) {
      alert("Gagal menyimpan pencatatan. Pastikan No Invoice belum pernah digunakan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* HEADER SECTION (GAYA FORMULIR LINIER) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-orange-600 rounded-xl text-white"><FileText className="w-5 h-5"/></div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Formulir Pencatatan Penjualan</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Catat histori barang terjual untuk sinkronisasi modal & laba secara administratif.</p>
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg flex items-center transition-all">
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Menyimpan...' : 'Sahkan & Kurangi Stok'}
          </button>
        </div>

        <div className="p-6 bg-zinc-900 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Baris 1 */}
          <div className="md:col-span-4">
            <label className="text-xs font-bold text-zinc-400 mb-1.5 block tracking-wide">SUMBER PENJUALAN / JALUR ORDER</label>
            <div className="relative">
              <ShoppingBag className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500"/>
              <select value={header.sumber_penjualan} onChange={(e) => setHeader({...header, sumber_penjualan: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 pl-10 pr-3 py-2 rounded-lg text-sm focus:border-orange-500 focus:outline-none appearance-none">
                <option value="Offline / Toko Fisik">Offline / Toko Fisik</option>
                <option value="Shopee">Marketplace: Shopee</option>
                <option value="Tokopedia">Marketplace: Tokopedia</option>
                <option value="TikTok Shop">Marketplace: TikTok Shop</option>
              </select>
            </div>
          </div>
          
          <div className="md:col-span-4">
            <label className="text-xs font-bold text-zinc-400 mb-1.5 block tracking-wide">NO. INVOICE / ORDER MARKETPLACE</label>
            <input type="text" placeholder="Masukkan Kode Nota (Manual/ Marketplace)" value={header.no_invoice} onChange={(e) => setHeader({...header, no_invoice: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono px-3 py-2 rounded-lg text-sm focus:border-orange-500 focus:outline-none placeholder-zinc-700"/>
            <p className="text-[10px] text-zinc-600 mt-1">Kosongkan jika ingin auto-generate (Khusus Offline).</p>
          </div>

          <div className="md:col-span-4">
            <label className="text-xs font-bold text-zinc-400 mb-1.5 block tracking-wide">METODE PEMBAYARAN TERIMA</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500"/>
              <select value={header.metode_pembayaran} onChange={(e) => setHeader({...header, metode_pembayaran: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 pl-10 pr-3 py-2 rounded-lg text-sm focus:border-orange-500 focus:outline-none appearance-none">
                <option value="Cash">Tunai / Cash</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Saldo Marketplace">Saldo Marketplace (Escrow)</option>
              </select>
            </div>
          </div>

          {/* Baris 2 (Kondisional Sesuai Request Anda) */}
          <div className="md:col-span-12 border-t border-zinc-800 pt-5 mt-2 space-y-4">
            <h4 className="text-[11px] text-orange-500 font-bold uppercase tracking-wider flex items-center"><User className="w-3.5 h-3.5 mr-1.5"/> Identitas Pembeli</h4>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-zinc-400 mb-1 block">NAMA PEMBELI (TRADISIONAL / OFFLINE)</label>
                <input type="text" placeholder="Isi untuk transaksi di Toko Fisik..." value={header.nama_pembeli} onChange={(e) => setHeader({...header, nama_pembeli: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-3 py-2 rounded-lg text-sm focus:border-orange-500 focus:outline-none placeholder-zinc-700"/>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 mb-1 block">NO. ORDER MARKETPLACE (KHUSUS ONLINE)</label>
                <input type="text" placeholder="Isi No. Order / Resi Marketplace..." value={header.no_order_marketplace} onChange={(e) => setHeader({...header, no_order_marketplace: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono px-3 py-2 rounded-lg text-sm focus:border-orange-500 focus:outline-none placeholder-zinc-700"/>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL ITEMS SECTION (LINIER - GAYA ERP) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white"><Package className="w-5 h-5"/></div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Daftar Barang Fisik Terjual</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Pilih barang spesifik dari gudang yang fisiknya sudah keluar.</p>
            </div>
          </div>
          <span className="bg-zinc-800 text-emerald-400 font-mono text-xl font-black px-4 py-1.5 rounded-lg border border-emerald-900/40">
            {totalItem} Pcs
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Search/ Select Barang dari Stok */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 relative space-y-2">
            <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center"><Search className="w-3.5 h-3.5 mr-1.5"/> Pilih Barang Siap Jual (Gudang)</label>
            <select 
              value={searchQuery}
              onChange={(e) => handleAddItemFromSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-emerald-300 px-3 py-2.5 rounded text-xs focus:border-orange-500 focus:outline-none"
            >
              <option value="">-- Ketik / Pilih Kode STK- (Hanya Menampilkan Stok Tersedia) --</option>
              {availableStocks.map(stock => (
                <option key={stock.id_stock} value={stock.id_stock}>
                  [{stock.id_stock}] {stock.nama_barang} (Mod: {(Number(stock.total_modal)/1000).toLocaleString('id-ID')}K)
                </option>
              ))}
            </select>
          </div>

          {/* Tabel Daftar Barang di Jual */}
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="p-4 w-12">No</th>
                  <th className="p-4 w-40">Kode STK</th>
                  <th className="p-4">Nama / Grade</th>
                  <th className="p-4 w-56 text-orange-500">Harga Jual Laporan (Edit)</th>
                  <th className="p-4 w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/30">
                {itemsToSell.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-zinc-600 text-xs italic">Belum ada barang dipilih. Gunakan select-box di atas.</td>
                  </tr>
                ) : (
                  itemsToSell.map((item, index) => (
                    <tr key={item.id_stock} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-zinc-600">{index + 1}</td>
                      <td className="p-4 font-mono text-xs text-orange-400">{item.id_stock}</td>
                      <td className="p-4">
                        <div className="font-bold text-zinc-100 text-sm">{item.nama_barang}</div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-500 font-medium">
                          <span className="bg-zinc-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-950 uppercase">{item.grade}</span> 
                          • Modal: Rp {Number(item.total_modal).toLocaleString('id-ID')}
                          • <AlertTriangle className="w-3 h-3 text-orange-500/50"/> {item.jenis_cacat || 'Normal'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="relative">
                          <span className="absolute left-2.5 top-2.5 text-zinc-600 text-xs font-medium">Rp</span>
                          <input 
                            type="number" 
                            value={item.harga_jual_aktual}
                            onChange={(e) => updateCartPrice(item.id_stock, e.target.value)}
                            className="w-full bg-zinc-950 border border-orange-900/50 text-orange-300 font-bold font-mono pl-8 pr-3 py-2.5 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
                            placeholder="Harga jual deal..."
                          />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button type="button" onClick={() => removeItem(item.id_stock)} className="text-zinc-600 hover:text-red-500 p-2 hover:bg-red-950 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SUMMARY TOTAL SEJAJAR (RAPI & PREMANEN) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-8 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center space-x-3.5 text-zinc-400 text-xs italic">
          <Info className="w-10 h-10 text-orange-600/50 shrink-0"/>
          <p>
            Pencatatan ini akan mengubah status barang di gudang menjadi <strong className="text-red-400">'Terjual'</strong> dan secara otomatis me-rekonsiliasi keuangan berdasarkan <strong className="text-emerald-400">Total Modal (Gudang)</strong> dibanding <strong className="text-orange-400">Harga Jual (Formulir)</strong> untuk laporan Laba-Rugi.
          </p>
        </div>

        <div className="md:col-span-4 bg-zinc-950 border border-orange-950/40 p-6 rounded-2xl shadow-xl space-y-4 shadow-orange-950/10">
          <div className="flex justify-between items-end border-b border-zinc-800 pb-3">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wide">Total Modal Aset (Cost)</p>
            <p className="text-base font-mono font-medium text-zinc-400">Rp {totalModal_InternalView.toLocaleString('id-ID')}</p>
          </div>
          <div className="flex justify-between items-end border-b border-zinc-800 pb-3">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wide">Total Nilai Penjualan (Rev)</p>
            <p className="text-2xl font-mono font-bold text-emerald-400">Rp {totalPenjualan.toLocaleString('id-ID')}</p>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-orange-500 text-xs font-bold uppercase tracking-wide">Estimasi Keuntungan Bersih</p>
            <p className={`text-sm font-mono font-black px-2 py-1 rounded ${estimasiLaba >= 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'}`}>
              Rp {estimasiLaba.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

    </form>
  );
}