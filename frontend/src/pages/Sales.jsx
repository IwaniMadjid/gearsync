import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Plus, Trash2, Save, ArrowLeft, Eye, TrendingUp, Calendar, Filter, CheckSquare } from 'lucide-react';
import api from '../services/api';
import { T, Card, CardHeader, Field, Input, Select, GoldBtn, THead, ModalOverlay, ModalBox, ModalHeader } from './ui';

// KOMPONEN: PENCARIAN STOK (SEARCHABLE DROPDOWN KHUSUS ASET) DENGAN FILTER & SELECT ALL
const SearchableStockDropdown = ({ availableStocks, onSelect, onSelectMultiple, selectedIds }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const [filterJenis, setFilterJenis] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const uniqueJenis = [...new Set(availableStocks.map(st => st.jenis))].filter(Boolean);
  const uniqueGrades = [...new Set(availableStocks.map(st => st.grade))].filter(Boolean);

  const filteredStocks = availableStocks
    .filter(st => !selectedIds.includes(st.id_stock))
    .filter(st => filterJenis === '' || st.jenis === filterJenis)
    .filter(st => filterGrade === '' || st.grade === filterGrade)
    .filter(st => 
      st.id_stock.toLowerCase().includes(search.toLowerCase()) || 
      st.nama_barang.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.umur_stok - a.umur_stok); 

  const handleSelectAll = () => {
    onSelectMultiple(filteredStocks);
    setIsOpen(false);
    setSearch('');
    setFilterJenis('');
    setFilterGrade('');
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div onClick={() => setIsOpen(!isOpen)}
        style={{
          background: T.raised, border: `1px dashed ${isOpen ? T.jade : T.border2}`, borderRadius: 4, padding: '10px 14px', 
          fontSize: '0.8rem', color: T.textMut, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s'
        }}>
        <Plus size={14} color={isOpen ? T.jade : T.textMut} />
        {isOpen ? "Tutup Pencarian Barang" : "Tambah Barang ke Keranjang..."}
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, background: T.surface, border: `1px solid ${T.border2}`, 
          borderRadius: 4, marginTop: 4, boxShadow: '0 12px 32px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', maxHeight: 380
        }}>
          <div style={{ padding: 8 }}>
            <input autoFocus type="text" placeholder="Cari berdasarkan SKU, Jenis, atau Nama..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: T.overlay, border: `1px solid ${T.border}`, color: T.textPri, padding: '10px 12px', fontSize: '0.8rem', borderRadius: 3, outline: 'none', fontFamily: 'JetBrains Mono, monospace' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 8px 8px 8px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ position: 'relative' }}>
              <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)}
                style={{ width: '100%', appearance: 'none', background: T.raised, color: filterJenis ? T.jade : T.textPri, border: `1px solid ${filterJenis ? T.jade : T.border2}`, padding: '6px 8px', fontSize: '0.75rem', borderRadius: 3, outline: 'none', cursor: 'pointer' }}>
                <option value="">-- Semua Jenis Sparepart --</option>
                {uniqueJenis.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
              <Filter size={12} style={{ position: 'absolute', right: 10, top: 8, color: T.textMut, pointerEvents: 'none' }} />
            </div>

            <div style={{ position: 'relative' }}>
              <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
                style={{ width: '100%', appearance: 'none', background: T.raised, color: filterGrade ? T.gold : T.textPri, border: `1px solid ${filterGrade ? T.gold : T.border2}`, padding: '6px 8px', fontSize: '0.75rem', borderRadius: 3, outline: 'none', cursor: 'pointer' }}>
                <option value="">-- Semua Grade --</option>
                {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <Filter size={12} style={{ position: 'absolute', right: 10, top: 8, color: T.textMut, pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: 4 }}>
            {filteredStocks.length === 0 ? (
              <div style={{ padding: '30px 20px', fontSize: '0.75rem', color: T.textMut, textAlign: 'center', fontStyle: 'italic' }}>
                Tidak ada stok tersedia yang cocok dengan filter yang dipilih.
              </div>
            ) : (
              <>
                {filteredStocks.length > 1 && (
                  <div onClick={handleSelectAll}
                    style={{ padding: '10px 12px', background: T.jadeBg, borderBottom: `1px solid ${T.jade}40`, color: T.jade, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: 3, marginBottom: 4, transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'} 
                    onMouseLeave={e => e.currentTarget.style.background = T.jadeBg}
                  >
                    <CheckSquare size={14} /> Tambahkan Semua ({filteredStocks.length} Item) ke Keranjang
                  </div>
                )}

                {filteredStocks.map(st => (
                  <div key={st.id_stock} onClick={() => { onSelect(st); setIsOpen(false); setSearch(''); setFilterJenis(''); setFilterGrade(''); }}
                    onMouseEnter={e => e.currentTarget.style.background = T.overlay} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${T.border}30` }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.65rem', background: T.surface, border: `1px solid ${T.border2}`, padding: '2px 6px', borderRadius: 3, color: T.textSec, fontWeight: 600 }}>
                          {st.jenis}
                        </span>
                        <span style={{ fontSize: '0.65rem', background: T.goldBg, border: `1px solid ${T.gold}40`, padding: '2px 6px', borderRadius: 3, color: T.gold, fontWeight: 800 }}>
                          {st.grade || 'NON-GRADE'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: T.textPri, fontWeight: 600 }}>{st.nama_barang}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: T.textSec, fontFamily: 'JetBrains Mono, monospace', marginTop: 4, fontWeight: 600 }}>{st.id_stock}</div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: st.umur_stok > 30 ? T.ember : T.jade, fontWeight: 700, textTransform: 'uppercase', background: st.umur_stok > 30 ? T.emberBg : T.jadeBg, padding: '2px 6px', borderRadius: 3, border: `1px solid ${st.umur_stok > 30 ? T.ember : T.jade}20` }}>
                        <Calendar size={10} /> {st.umur_stok} Hari
                      </div>
                      <div style={{ fontSize: '0.75rem', color: T.textMut, fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>Rp {Number(st.total_modal).toLocaleString('id-ID')}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Sales() {
  const [view, setView] = useState('list');
  const [salesList, setSalesList] = useState([]);
  const [availableStocks, setAvailableStocks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const [header, setHeader] = useState({
    tgl_transaksi: new Date().toISOString().split('T')[0],
    no_invoice: '',
    nama_pembeli: '',
    no_order_marketplace: '',
    sumber_penjualan: 'Toko Offline',
    metode_pembayaran: 'Tunai'
  });
  
  const [cart, setCart] = useState([]);

  const fetchData = async () => {
    try {
      const [resSales, resStocks] = await Promise.all([
        api.get('/sales').catch(() => ({ data: { data: [] } })),
        api.get('/inventory/available').catch(() => ({ data: { data: [] } }))
      ]);
      setSalesList(resSales.data.data || []);
      setAvailableStocks(resStocks.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil data", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSelectStock = (stock) => {
    setCart([...cart, { ...stock, harga_jual_aktual: '' }]);
  };

  const handleSelectMultipleStocks = (stocksArray) => {
    const newItems = stocksArray.map(st => ({ ...st, harga_jual_aktual: '' }));
    setCart([...cart, ...newItems]);
  };

  const removeCartItem = (id_stock) => setCart(cart.filter(i => i.id_stock !== id_stock));
  const clearCart = () => setCart([]); // FUNGSI HAPUS SEMUA KERANJANG

  const updateHargaJual = (id_stock, val) => {
    setCart(cart.map(i => i.id_stock === id_stock ? { ...i, harga_jual_aktual: val } : i));
  };

  const totalModal = cart.reduce((sum, i) => sum + Number(i.total_modal || 0), 0);
  const totalPenjualan = cart.reduce((sum, i) => sum + Number(i.harga_jual_aktual || 0), 0);
  const estimasiProfit = totalPenjualan - totalModal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Keranjang belanja masih kosong!");
    if (!header.no_invoice || !header.nama_pembeli) return alert("Nomor nota dan nama pembeli wajib diisi!");
    
    const isIncomplete = cart.some(i => !i.harga_jual_aktual);
    if (isIncomplete) return alert("Harga jual untuk semua item wajib diisi!");

    setIsSubmitting(true);
    const payload = {
      ...header,
      items: cart.map(item => ({
        id_stock: item.id_stock,
        harga_jual_aktual: Number(item.harga_jual_aktual)
      }))
    };

    try {
      await api.post('/sales', payload);
      alert("Transaksi Penjualan Berhasil!");
      setHeader({ tgl_transaksi: new Date().toISOString().split('T')[0], no_invoice: '', nama_pembeli: '', no_order_marketplace: '', sumber_penjualan: 'Toko Offline', metode_pembayaran: 'Tunai' });
      setCart([]);
      fetchData();
      setView('list');
    } catch (error) {
      alert("Gagal menyimpan transaksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view === 'list') {
    // Variabel kalkulasi profit untuk Detail Modal
    let detailModalAset = 0;
    let detailTotalBayar = 0;
    let detailProfit = 0;
    
    if (selectedDetail) {
      detailModalAset = (selectedDetail.items || []).reduce((sum, it) => sum + Number(it.total_modal || 0), 0);
      detailTotalBayar = Number(selectedDetail.total_bayar);
      detailProfit = detailTotalBayar - detailModalAset;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: T.textPri, margin: 0, letterSpacing: '-0.02em' }}>Sales.</h1>
            <p style={{ color: T.textSec, fontSize: '0.8rem', marginTop: 4 }}>Penjualan produk serta perhitungan profit.</p>
          </div>
          <GoldBtn onClick={() => setView('form')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShoppingCart size={14} /> Tambah Transaksi Baru
          </GoldBtn>
        </div>

        <Card>
          <CardHeader title="Histori Transaksi Penjualan" gold />
          <div style={{ overflowX: 'auto', minHeight: 400 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <THead cols={['Tanggal', 'No. Invoice', 'Pembeli & Sumber', 'Metode Bayar', {label: 'Total Penjualan', align: 'right'}, {label: 'Aksi', align: 'center'}]} />
              <tbody>
                {salesList.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: T.textMut, fontSize: '0.8rem' }}>Belum ada riwayat transaksi penjualan.</td></tr>
                ) : (
                  salesList.map((s) => (
                    <tr key={s.id_sales} style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = T.raised} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: T.textSec }}>
                        {s.tgl_transaksi ? new Date(s.tgl_transaksi).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono, monospace', color: T.jade, fontWeight: 800, fontSize: '0.85rem' }}>
                        {s.no_invoice}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: T.textPri, fontWeight: 600, fontSize: '0.85rem' }}>{s.nama_pembeli}</div>
                        <div style={{ color: T.textMut, fontSize: '0.7rem', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.sumber_penjualan}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: T.textSec, fontSize: '0.8rem' }}>{s.metode_pembayaran}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                         <div style={{ fontFamily: 'JetBrains Mono, monospace', color: T.gold, fontSize: '0.9rem', fontWeight: 600 }}>Rp {Number(s.total_bayar).toLocaleString('id-ID')}</div>
                         <div style={{ fontSize: '0.7rem', color: T.textMut, marginTop: 2 }}>{s.total_item} Item</div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button onClick={() => setSelectedDetail(s)} style={{ background: T.overlay, border: `1px solid ${T.border2}`, color: T.textPri, borderRadius: 4, padding: '6px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = T.goldBg; e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
                          onMouseLeave={e => { e.currentTarget.style.background = T.overlay; e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.textPri; }}>
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* MODAL DETAIL PENJUALAN DENGAN INFO PROFIT */}
        {selectedDetail && (
          <ModalOverlay onClose={() => setSelectedDetail(null)}>
            <ModalBox style={{ maxWidth: 900 }}>
              <ModalHeader title={`Nota Penjualan: ${selectedDetail.no_invoice}`} onClose={() => setSelectedDetail(null)} />
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, background: T.raised, padding: 16, borderRadius: 6, border: `1px solid ${T.border2}` }}>
                  <div>
                    <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>Pembeli</p>
                    <p style={{ fontSize: '0.85rem', color: T.textPri, fontWeight: 600, marginTop: 4 }}>{selectedDetail.nama_pembeli}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>Platform Penjualan</p>
                    <p style={{ fontSize: '0.85rem', color: T.textPri, fontWeight: 600, marginTop: 4 }}>{selectedDetail.sumber_penjualan}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>Metode Pembayaran</p>
                    <p style={{ fontSize: '0.85rem', color: T.textPri, fontWeight: 600, marginTop: 4 }}>{selectedDetail.metode_pembayaran}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>Tgl. Transaksi</p>
                    <p style={{ fontSize: '0.85rem', color: T.textPri, fontWeight: 600, marginTop: 4 }}>{selectedDetail.tgl_transaksi ? new Date(selectedDetail.tgl_transaksi).toLocaleDateString('id-ID') : '-'}</p>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: T.jade, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShoppingCart size={14} /> Rincian Barang Terjual & Analisa Profit
                  </h4>
                  <div style={{ border: `1px solid ${T.border2}`, borderRadius: 6, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <THead cols={['SKU & Jenis', 'Identitas Barang', {label: 'Modal Aset', align: 'right'}, {label: 'Harga Jual', align: 'right'}, {label: 'Profit / Item', align: 'right'}]} />
                      <tbody>
                        {(selectedDetail.items || []).map((it, idx) => {
                          const modalItem = Number(it.total_modal || 0);
                          const jualItem = Number(it.harga_jual_aktual || 0);
                          const profitItem = jualItem - modalItem;
                          
                          return (
                            <tr key={idx} style={{ borderBottom: `1px solid ${T.border}`, background: T.surface }}>
                              <td style={{ padding: '12px 16px' }}>
                                 <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: T.gold, fontWeight: 600 }}>{it.id_stock}</div>
                                 <div style={{ fontSize: '0.7rem', color: T.textSec, marginTop: 2 }}>{it.jenis}</div>
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: T.textPri, fontWeight: 500 }}>
                                 {it.nama_barang}
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: T.textMut, fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>
                                Rp {modalItem.toLocaleString('id-ID')}
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: T.textPri, fontFamily: 'JetBrains Mono, monospace', textAlign: 'right', fontWeight: 600 }}>
                                Rp {jualItem.toLocaleString('id-ID')}
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: profitItem >= 0 ? T.jade : T.ember, fontFamily: 'JetBrains Mono, monospace', textAlign: 'right', fontWeight: 800 }}>
                                {profitItem > 0 ? '+' : ''}{profitItem.toLocaleString('id-ID')}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, borderTop: `1px dashed ${T.border2}`, paddingTop: 20 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Modal Aset</p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.2rem', color: T.textSec, fontWeight: 600, marginTop: 4 }}>Rp {detailModalAset.toLocaleString('id-ID')}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.65rem', color: T.jade, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pendapatan Transaksi</p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.2rem', color: T.jade, fontWeight: 600, marginTop: 4 }}>Rp {detailTotalBayar.toLocaleString('id-ID')}</p>
                  </div>
                  <div style={{ textAlign: 'right', background: 'rgba(34, 197, 94, 0.05)', padding: '8px 16px', borderRadius: 6, borderRight: `3px solid ${detailProfit >= 0 ? T.jade : T.ember}` }}>
                    <p style={{ fontSize: '0.65rem', color: T.textPri, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profit Kotor Akhir</p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.4rem', color: detailProfit >= 0 ? T.jade : T.ember, fontWeight: 800, marginTop: 4 }}>
                      {detailProfit > 0 ? '+' : ''}Rp {detailProfit.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

              </div>
            </ModalBox>
          </ModalOverlay>
        )}
      </div>
    );
  }

  // VIEW: FORM PENCATATAN TRANSAKSI BARU
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <button type="button" onClick={() => setView('list')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: T.textSec, cursor: 'pointer', fontSize: '0.75rem', padding: '4px 0', marginBottom: 4 }}><ArrowLeft size={13} /> Kembali ke Riwayat Penjualan</button>
      </div>

      <Card>
        <CardHeader title="Informasi Nota Penjualan" gold action={<GoldBtn type="submit" disabled={isSubmitting || cart.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Save size={13} /> {isSubmitting ? 'Menyimpan...' : 'Eksekusi Penjualan'}</GoldBtn>} />
        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <Field label="Tanggal Transaksi"><Input type="date" value={header.tgl_transaksi} onChange={(e) => setHeader({...header, tgl_transaksi: e.target.value})} required /></Field>
          <Field label="No. Order / Invoice" gold><Input value={header.no_invoice} onChange={(e) => setHeader({...header, no_invoice: e.target.value})} placeholder="INV-OUT-XXXX" style={{ fontFamily: 'JetBrains Mono, monospace', color: T.gold }} required /></Field>
          <Field label="Nama Pembeli"><Input value={header.nama_pembeli} onChange={(e) => setHeader({...header, nama_pembeli: e.target.value})} placeholder="Nama customer..." required /></Field>
          <Field label="Sumber Penjualan"><Select value={header.sumber_penjualan} onChange={(e) => setHeader({...header, sumber_penjualan: e.target.value})}><option value="Toko Offline">Toko Offline</option><option value="Shopee">Shopee</option><option value="Tokopedia">Tokopedia</option><option value="TikTok Shop">TikTok Shop</option><option value="Facebook Marketplace">Facebook Marketplace</option></Select></Field>
          <Field label="Metode Pembayaran"><Select value={header.metode_pembayaran} onChange={(e) => setHeader({...header, metode_pembayaran: e.target.value})}><option value="Tunai">Tunai</option><option value="Transfer Bank">Transfer Bank</option><option value="QRIS">QRIS</option><option value="Saldo E-Commerce">Saldo E-Commerce</option></Select></Field>
        </div>
      </Card>

      <Card>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(12, 11, 15, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 5, height: 5, background: T.jade, borderRadius: 1, transform: 'rotate(45deg)' }} /><span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.textSec }}>Keranjang Belanja Keluar</span></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: T.jade, fontWeight: 600 }}>{cart.length} Item Terpilih</span>
            {/* TOMBOL HAPUS SEMUA DI HEADER KERANJANG */}
            {cart.length > 0 && (
              <button type="button" onClick={clearCart} style={{ background: T.emberBg, border: `1px solid ${T.ember}40`, color: T.ember, borderRadius: 4, padding: '4px 10px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = T.emberBg}>
                <Trash2 size={12} /> Kosongkan
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <SearchableStockDropdown 
            availableStocks={availableStocks} 
            onSelect={handleSelectStock} 
            onSelectMultiple={handleSelectMultipleStocks} 
            selectedIds={cart.map(i => i.id_stock)} 
          />

          {cart.length > 0 && (
            <div style={{ border: `1px solid ${T.border2}`, borderRadius: 6, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <THead cols={['SKU & Jenis', 'Grade & Nama Barang', {label: 'Harga Modal', align: 'right'}, {label: 'Harga Jual (Rp)', align: 'right'}, {label: '', align: 'center'}]} />
                <tbody>
                  {cart.map(item => (
                    <tr key={item.id_stock} style={{ borderBottom: `1px solid ${T.border}`, background: T.surface }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: T.gold, fontWeight: 600 }}>{item.id_stock}</div>
                        <div style={{ fontSize: '0.65rem', color: T.textMut, marginTop: 2, textTransform: 'uppercase' }}>{item.jenis}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.65rem', background: T.goldBg, border: `1px solid ${T.gold}40`, padding: '2px 6px', borderRadius: 3, color: T.gold, fontWeight: 800 }}>
                            {item.grade || 'NON-GRADE'}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: T.textPri, fontWeight: 500 }}>{item.nama_barang}</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: T.textSec, marginTop: 4 }}>{item.brand} | Umur: {item.umur_stok} Hari</div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.8rem', color: T.textMut, fontFamily: 'JetBrains Mono, monospace' }}>
                        Rp {Number(item.total_modal).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '8px 14px', textAlign: 'right', width: 200 }}>
                        <Input 
                          type="number" 
                          value={item.harga_jual_aktual} 
                          onChange={(e) => updateHargaJual(item.id_stock, e.target.value)} 
                          placeholder="0" 
                          style={{ fontFamily: 'JetBrains Mono, monospace', color: T.jade, textAlign: 'right' }} 
                          required 
                        />
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', width: 50 }}>
                        <button type="button" onClick={() => removeCartItem(item.id_stock)} style={{ background: 'none', border: 'none', color: T.textMut, cursor: 'pointer', padding: 4 }} onMouseEnter={e => e.currentTarget.style.color = T.ember} onMouseLeave={e => e.currentTarget.style.color = T.textMut}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Card style={{ padding: '16px 20px', borderLeft: `3px solid ${T.border2}`, background: T.raised }}>
          <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Akumulasi Modal Aset</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.2rem', color: T.textSec, fontWeight: 600, marginTop: 4 }}>Rp {totalModal.toLocaleString('id-ID')}</p>
        </Card>
        <Card style={{ padding: '16px 20px', borderLeft: `3px solid ${T.jade}`, background: T.jadeBg }}>
          <p style={{ fontSize: '0.65rem', color: T.jade, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Penjualan</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.3rem', color: T.jade, fontWeight: 800, marginTop: 4 }}>Rp {totalPenjualan.toLocaleString('id-ID')}</p>
        </Card>
        <Card style={{ padding: '16px 20px', borderLeft: `3px solid ${estimasiProfit >= 0 ? T.gold : T.ember}`, background: T.surface, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: 10, top: 20, opacity: 0.1 }}><TrendingUp size={48} color={estimasiProfit >= 0 ? T.gold : T.ember} /></div>
          <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimasi Profit Kotor</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.3rem', color: estimasiProfit >= 0 ? T.gold : T.ember, fontWeight: 800, marginTop: 4 }}>
            {estimasiProfit > 0 ? '+' : ''} Rp {estimasiProfit.toLocaleString('id-ID')}
          </p>
        </Card>
      </div>

    </form>
  );
}