import React, { useState, useEffect } from 'react';
import { FileText, User, ShoppingBag, Package, Trash2, Search, CreditCard, Save, AlertTriangle, Info } from 'lucide-react';
import api from '../services/api';
import { T, Card, Field, Input, Select, GoldBtn, THead } from './ui';

export default function SalesEntry() {
  const [availableStocks, setAvailableStocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [header, setHeader] = useState({
    no_invoice: '',
    sumber_penjualan: 'Offline / Toko Fisik',
    nama_pembeli: '',
    no_order_marketplace: '',
    metode_pembayaran: 'Cash'
  });

  const [itemsToSell, setItemsToSell] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAvailableStocks = async () => {
    try {
      const res = await api.get('/inventory/available');
      setAvailableStocks(res.data.data);
    } catch (error) {
      console.error("Gagal mengambil data stok", error);
    }
  };

  useEffect(() => { fetchAvailableStocks(); }, []);

  const handleAddItemFromSearch = (idStockToAdd) => {
    if (!idStockToAdd) return;
    const stockItem = availableStocks.find(s => s.id_stock === idStockToAdd);
    if (!stockItem) return;
    if (itemsToSell.some(i => i.id_stock === idStockToAdd)) return alert("Barang ini sudah ada di daftar.");

    setItemsToSell([...itemsToSell, { 
      ...stockItem, 
      harga_jual_aktual: Math.round(Number(stockItem.total_modal) * 1.1) 
    }]);
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

  const totalModal_InternalView = itemsToSell.reduce((sum, i) => sum + Number(i.total_modal), 0);
  const totalPenjualan = itemsToSell.reduce((sum, i) => sum + i.harga_jual_aktual, 0);
  const totalItem = itemsToSell.length;
  const estimasiLaba = totalPenjualan - totalModal_InternalView;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalItem === 0) return alert("Pilih minimal satu barang yang terjual!");
    if (!header.no_invoice && header.sumber_penjualan !== 'Offline / Toko Fisik') {
        return alert("Pencatatan Marketplace wajib mengisi No. Invoice/Order dari Marketplace!");
    }

    setIsSubmitting(true);
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      
      {/* HEADER SECTION */}
      <Card>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.overlay }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: T.gold, padding: 8, borderRadius: 8, display: 'flex' }}>
              <FileText size={20} color="#000" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', color: T.textPri, fontWeight: 600 }}>Formulir Pencatatan Penjualan</h2>
              <p style={{ fontSize: '0.75rem', color: T.textMut, marginTop: 2 }}>Catat histori barang terjual untuk sinkronisasi modal & laba secara administratif.</p>
            </div>
          </div>
          <GoldBtn type="submit" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
            <Save size={16} /> {isSubmitting ? 'Menyimpan...' : 'Sahkan & Kurangi Stok'}
          </GoldBtn>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Baris 1: Informasi Order */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            <Field label="SUMBER PENJUALAN / JALUR ORDER">
              <Select value={header.sumber_penjualan} onChange={(e) => setHeader({...header, sumber_penjualan: e.target.value})}>
                <option value="Offline / Toko Fisik">Offline / Toko Fisik</option>
                <option value="Shopee">Marketplace: Shopee</option>
                <option value="Tokopedia">Marketplace: Tokopedia</option>
                <option value="TikTok Shop">Marketplace: TikTok Shop</option>
              </Select>
            </Field>
            <Field label="NO. INVOICE / ORDER MARKETPLACE">
              <Input 
                value={header.no_invoice} 
                onChange={(e) => setHeader({...header, no_invoice: e.target.value})} 
                placeholder="Kosongkan jika auto-generate" 
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              />
            </Field>
            <Field label="METODE PEMBAYARAN TERIMA">
              <Select value={header.metode_pembayaran} onChange={(e) => setHeader({...header, metode_pembayaran: e.target.value})}>
                <option value="Cash">Tunai / Cash</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Saldo Marketplace">Saldo Marketplace (Escrow)</option>
              </Select>
            </Field>
          </div>

          {/* Baris 2: Identitas Pembeli */}
          <div style={{ paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <h4 style={{ fontSize: '0.7rem', color: T.gold, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} /> Identitas Pembeli
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="NAMA PEMBELI (TRADISIONAL / OFFLINE)">
                <Input value={header.nama_pembeli} onChange={(e) => setHeader({...header, nama_pembeli: e.target.value})} placeholder="Isi untuk transaksi di Toko Fisik..." />
              </Field>
              <Field label="NO. ORDER MARKETPLACE (KHUSUS ONLINE)">
                <Input value={header.no_order_marketplace} onChange={(e) => setHeader({...header, no_order_marketplace: e.target.value})} placeholder="Isi No. Order / Resi Marketplace..." style={{ fontFamily: 'JetBrains Mono, monospace' }} />
              </Field>
            </div>
          </div>
        </div>
      </Card>

      {/* DETAIL ITEMS SECTION */}
      <Card>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.overlay }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: T.jade, padding: 8, borderRadius: 8, display: 'flex' }}>
              <Package size={20} color="#000" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', color: T.textPri, fontWeight: 600 }}>Daftar Barang Fisik Terjual</h2>
              <p style={{ fontSize: '0.75rem', color: T.textMut, marginTop: 2 }}>Pilih barang spesifik dari gudang yang fisiknya sudah keluar.</p>
            </div>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', fontWeight: 600, color: T.jade, border: `1px solid ${T.jade}40`, background: `${T.jade}15`, padding: '6px 16px', borderRadius: 6 }}>
            {totalItem} Pcs
          </span>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Pilih Barang */}
          <div style={{ background: T.raised, padding: 16, borderRadius: 6, border: `1px solid ${T.border2}` }}>
            <Field label="Pilih Barang Siap Jual (Gudang)" gold>
              <Select value={searchQuery} onChange={(e) => handleAddItemFromSearch(e.target.value)}>
                <option value="">-- Ketik / Pilih Kode STK- (Hanya Menampilkan Stok Tersedia) --</option>
                {availableStocks.map(stock => (
                  <option key={stock.id_stock} value={stock.id_stock}>
                    [{stock.id_stock}] {stock.nama_barang} (Modal: {(Number(stock.total_modal)/1000).toLocaleString('id-ID')}K)
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {/* Tabel Keranjang */}
          <div style={{ overflowX: 'auto', border: `1px solid ${T.border2}`, borderRadius: 6 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <THead cols={['No', 'Kode STK', 'Nama / Grade', 'Harga Jual Laporan (Edit)', { label: 'Aksi', align: 'center' }]} />
              <tbody>
                {itemsToSell.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: T.textMut, fontSize: '0.8rem', fontStyle: 'italic' }}>
                      Belum ada barang dipilih. Gunakan dropdown di atas.
                    </td>
                  </tr>
                ) : (
                  itemsToSell.map((item, index) => (
                    <tr key={item.id_stock} style={{ borderBottom: `1px solid ${T.border}`, background: T.overlay }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', color: T.textSec, fontWeight: 600 }}>{index + 1}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', color: T.gold, fontSize: '0.8rem' }}>{item.id_stock}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: T.textPri, fontSize: '0.9rem' }}>{item.nama_barang}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: '0.7rem', color: T.textMut }}>
                          <span style={{ color: T.jade, background: `${T.jade}20`, padding: '2px 6px', borderRadius: 3, fontWeight: 600 }}>{item.grade}</span>
                          <span>• Modal: Rp {Number(item.total_modal).toLocaleString('id-ID')}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={10} color={T.gold} /> {item.jenis_cacat || 'Normal'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Input 
                          type="number" 
                          value={item.harga_jual_aktual}
                          onChange={(e) => updateCartPrice(item.id_stock, e.target.value)}
                          style={{ fontFamily: 'JetBrains Mono, monospace', color: T.gold, fontWeight: 600, width: '100%', maxWidth: 200 }}
                          placeholder="Harga jual..."
                        />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button type="button" onClick={() => removeItem(item.id_stock)} style={{ background: 'none', border: 'none', color: T.textMut, cursor: 'pointer', padding: 8, transition: 'color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = T.ember}
                          onMouseLeave={e => e.currentTarget.style.color = T.textMut}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* SUMMARY TOTAL SEJAJAR */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        
        {/* Info Box */}
        <Card style={{ background: T.raised, border: `1px solid ${T.border2}`, display: 'flex', alignItems: 'flex-start', padding: 22, gap: 16 }}>
          <Info size={32} color={T.gold} style={{ opacity: 0.8, flexShrink: 0 }} />
          <p style={{ color: T.textSec, fontSize: '0.85rem', lineHeight: 1.6 }}>
            Pencatatan ini akan mengubah status barang di gudang menjadi <strong style={{ color: T.ember }}>'Terjual'</strong> dan secara otomatis me-rekonsiliasi keuangan berdasarkan <strong style={{ color: T.jade }}>Total Modal (Cost)</strong> dibanding <strong style={{ color: T.gold }}>Harga Jual Laporan (Rev)</strong> untuk laporan Laba-Rugi.
          </p>
        </Card>

        {/* Kalkulator Box */}
        <Card>
          <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `1px solid ${T.border}`, paddingBottom: 12 }}>
              <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Modal Aset (Cost)</p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', color: T.textSec, fontSize: '1rem' }}>Rp {totalModal_InternalView.toLocaleString('id-ID')}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `1px solid ${T.border}`, paddingBottom: 12 }}>
              <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Penjualan (Rev)</p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', color: T.jade, fontSize: '1.25rem', fontWeight: 600 }}>Rp {totalPenjualan.toLocaleString('id-ID')}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <p style={{ fontSize: '0.65rem', color: T.gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimasi Keuntungan</p>
              <p style={{ 
                fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', fontWeight: 600, 
                color: estimasiLaba >= 0 ? T.jade : T.ember, 
                background: estimasiLaba >= 0 ? `${T.jade}15` : `${T.ember}15`, 
                padding: '4px 10px', borderRadius: 4 
              }}>
                Rp {estimasiLaba.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </Card>

      </div>

    </form>
  );
}