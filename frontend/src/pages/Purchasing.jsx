import React, { useState, useEffect, useRef } from 'react';
import { Truck, Plus, Trash2, Save, ArrowLeft, Receipt, Eye, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { T, Card, CardHeader, Field, Input, Select, GoldBtn, THead, ModalOverlay, ModalBox, ModalHeader } from './ui';

const JENIS_OPTIONS = ['Unit', 'LCD', 'Baterai', 'Frame LCD', 'List LCD', 'Cover Backdoor', 'Lem Advise', 'Ongkir'];

// KOMPONEN: SEARCHABLE DROPDOWN
const SearchableDropdown = ({ value, onChange, options, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          background: T.raised, border: `1px solid ${isOpen ? T.gold : T.border2}`, borderRadius: 3,
          padding: '8px 12px', fontSize: '0.8rem', color: value ? T.textPri : T.textMut,
          cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', opacity: disabled ? 0.5 : 1, transition: 'border-color 0.15s'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || placeholder}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: T.textMut, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
          background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 4,
          marginTop: 4, boxShadow: '0 12px 32px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column',
          maxHeight: 250
        }}>
          <div style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}>
            <input 
              autoFocus type="text" placeholder="Cari seri..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: T.overlay, border: `1px solid ${T.border}`, color: T.textPri, padding: '8px 12px', fontSize: '0.75rem', borderRadius: 3, outline: 'none' }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: 4 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '0.75rem', color: T.textMut, textAlign: 'center', fontStyle: 'italic' }}>Seri tidak ditemukan.</div>
            ) : (
              filtered.map(opt => (
                <div key={opt} onClick={() => { onChange(opt); setIsOpen(false); setSearch(''); }}
                  onMouseEnter={e => e.currentTarget.style.background = T.overlay} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  style={{ padding: '8px 12px', fontSize: '0.75rem', color: T.textPri, cursor: 'pointer', borderRadius: 3 }}>
                  {opt}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Purchasing() {
  const [view, setView] = useState('list');
  const [purchasesList, setPurchasesList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [masterHp, setMasterHp] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State Modal Detail
  const [selectedDetail, setSelectedDetail] = useState(null);

  const [header, setHeader] = useState({
    no_faktur: '', tgl_pembelian: new Date().toISOString().split('T')[0], supplier: '', status_bayar: 'Tempo', bukti_bayar: null
  });
  const [items, setItems] = useState([]);

  const fetchData = async () => {
    try {
      const resPurchases = await api.get('/purchases').catch(() => ({ data: { data: [] } }));
      const resToko = await api.get('/master/toko').catch(() => ({ data: { data: [] } }));
      const resHp = await api.get('/master/hp').catch(() => ({ data: { data: [] } }));
      
      setPurchasesList(resPurchases.data.data || []);
      setSuppliers(resToko.data.data || []);
      setMasterHp(resHp.data.data || []);
      
      if (resToko.data.data?.length > 0) {
        setHeader(prev => ({ ...prev, supplier: resToko.data.data[0].nama_toko }));
      }
    } catch (error) {
      console.error("Gagal mengambil data", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const uniqueBrands = [...new Set(masterHp.map(h => h.brand))];

  const handleAddItem = () => setItems([...items, { id_temp: Date.now(), jenis: 'Unit', brand: uniqueBrands[0] || '', seri: '', harga_beli: '' }]);
  const removeItem = (id_temp) => setItems(items.filter(i => i.id_temp !== id_temp));
  const updateItem = (id_temp, field, value) => {
    setItems(items.map(i => {
      if (i.id_temp === id_temp) {
        if (field === 'brand') return { ...i, [field]: value, seri: '' };
        if (field === 'jenis' && value === 'Ongkir') return { ...i, [field]: value, brand: '', seri: '' };
        if (field === 'jenis' && value !== 'Ongkir' && i.jenis === 'Ongkir') return { ...i, [field]: value, brand: uniqueBrands[0] || '' };
        return { ...i, [field]: value };
      }
      return i;
    }));
  };

  const totalItem = items.length;
  const totalNominal = items.reduce((sum, i) => sum + Number(i.harga_beli || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalItem === 0) return alert("Tambahkan minimal 1 entri!");
    if (!header.no_faktur) return alert("Nomor Faktur wajib diisi!");
    
    const isIncomplete = items.some(i => i.jenis === 'Ongkir' ? !i.harga_beli : (!i.brand || !i.seri || !i.harga_beli));
    if (isIncomplete) return alert("Lengkapi semua rincian!");

    setIsSubmitting(true);
    const payload = new FormData();
    payload.append('no_faktur', header.no_faktur);
    payload.append('tgl_pembelian', header.tgl_pembelian);
    payload.append('supplier', header.supplier);
    payload.append('status_bayar', header.status_bayar);
    payload.append('total_nominal', totalNominal);
    if (header.bukti_bayar) payload.append('bukti_bayar', header.bukti_bayar);

    const formattedItems = items.map(({ id_temp, ...rest }) => ({
      ...rest, harga_beli: Number(rest.harga_beli), nama_barang: rest.jenis === 'Ongkir' ? 'Biaya Ongkos Kirim' : `${rest.brand} ${rest.seri}`, modal_awal: Number(rest.harga_beli) 
    }));
    payload.append('items', JSON.stringify(formattedItems));

    try {
      await api.post('/purchases', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setHeader({ no_faktur: '', tgl_pembelian: new Date().toISOString().split('T')[0], supplier: suppliers[0]?.nama_toko || '', status_bayar: 'Tempo', bukti_bayar: null });
      setItems([]);
      fetchData();
      setView('list');
    } catch (error) {
      alert("Gagal menyimpan faktur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseDetailItems = (itemsStr) => {
    try { return JSON.parse(itemsStr); } catch { return []; }
  };

  if (view === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: T.textPri, margin: 0 }}>Modul Pengadaan Barang</h2>
            <p style={{ color: T.textSec, fontSize: '0.75rem', marginTop: 4 }}>Daftar riwayat faktur masuk dan operasional pengiriman.</p>
          </div>
          <GoldBtn onClick={() => setView('form')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Tambah Pengadaan
          </GoldBtn>
        </div>

        <Card>
          <CardHeader title="Histori Transaksi Faktur" gold />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <THead cols={['Tanggal', 'No. Faktur', 'Supplier', {label: 'Total Tagihan', align: 'right'}, {label: 'Status Bayar', align: 'center'}, {label: 'Aksi', align: 'center'}]} />
              <tbody>
                {purchasesList.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: T.textMut, fontSize: '0.78rem' }}>Belum ada catatan pengadaan barang.</td></tr>
                ) : (
                  purchasesList.map((p) => (
                    <tr key={p.id_purchase || p.no_faktur} style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = T.raised} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: T.textSec }}>
                        {new Date(p.tgl_pembelian).toLocaleDateString('id-ID')}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', color: T.gold, fontWeight: 600, fontSize: '0.82rem' }}>
                        {p.no_faktur}
                      </td>
                      <td style={{ padding: '12px 16px', color: T.textPri, fontWeight: 500, fontSize: '0.82rem' }}>
                        {p.supplier}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: T.textPri, fontSize: '0.82rem' }}>
                        Rp {Number(p.total_nominal).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 2, background: p.status_bayar === 'Lunas' ? T.jadeBg : T.emberBg, color: p.status_bayar === 'Lunas' ? T.jade : T.ember, border: `1px solid ${p.status_bayar === 'Lunas' ? T.jade : T.ember}30` }}>
                          {p.status_bayar}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button onClick={() => setSelectedDetail(p)} style={{ background: T.overlay, border: `1px solid ${T.border2}`, color: T.textPri, borderRadius: 4, padding: '6px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
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

        {/* MODAL DETAIL FAKTUR */}
        {selectedDetail && (
          <ModalOverlay onClose={() => setSelectedDetail(null)}>
            <ModalBox style={{ maxWidth: 850 }}>
              <ModalHeader title={`Rincian Faktur: ${selectedDetail.no_faktur}`} onClose={() => setSelectedDetail(null)} />
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxHeight: '80vh', overflowY: 'auto' }}>
                
                {/* Info Umum Faktur */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, background: T.raised, padding: 16, borderRadius: 6, border: `1px solid ${T.border2}` }}>
                  <div>
                    <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supplier</p>
                    <p style={{ fontSize: '0.85rem', color: T.textPri, fontWeight: 600, marginTop: 4 }}>{selectedDetail.supplier}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tanggal Transaksi</p>
                    <p style={{ fontSize: '0.85rem', color: T.textPri, fontWeight: 600, marginTop: 4 }}>{new Date(selectedDetail.tgl_pembelian).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Kedatangan</p>
                    <p style={{ fontSize: '0.8rem', color: selectedDetail.status_kedatangan === 'Barang Tiba' ? T.jade : T.ember, fontWeight: 600, marginTop: 4, textTransform: 'uppercase' }}>
                      {selectedDetail.status_kedatangan}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: 24 }}>
                  
                  {/* KIRI: Tabel Rincian Manifes */}
                  <div>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 4, height: 4, background: T.gold, transform: 'rotate(45deg)' }} /> Manifes Barang
                    </h4>
                    <div style={{ border: `1px solid ${T.border2}`, borderRadius: 6, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <THead cols={['No', 'Jenis', 'Identitas Barang', {label: 'Harga Modal', align: 'right'}]} />
                        <tbody>
                          {parseDetailItems(selectedDetail.items).map((it, idx) => (
                            <tr key={idx} style={{ borderBottom: `1px solid ${T.border}`, background: T.surface }}>
                              <td style={{ padding: '10px 16px', fontSize: '0.75rem', color: T.textMut, textAlign: 'center' }}>{idx + 1}</td>
                              <td style={{ padding: '10px 16px', fontSize: '0.75rem', color: T.textSec }}>
                                <span style={{ background: T.overlay, padding: '2px 6px', borderRadius: 3, border: `1px solid ${T.border2}` }}>{it.jenis}</span>
                              </td>
                              <td style={{ padding: '10px 16px', fontSize: '0.8rem', color: T.textPri, fontWeight: 500 }}>{it.nama_barang}</td>
                              <td style={{ padding: '10px 16px', fontSize: '0.8rem', color: it.jenis === 'Ongkir' ? T.sky : T.gold, fontFamily: 'JetBrains Mono, monospace', textAlign: 'right', fontWeight: 600 }}>
                                Rp {Number(it.harga_beli).toLocaleString('id-ID')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* KANAN: Panel Bukti Bayar */}
                  <div>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 4, height: 4, background: T.gold, transform: 'rotate(45deg)' }} /> Bukti Nota
                    </h4>
                    <div style={{ background: T.raised, border: `1px dashed ${T.border2}`, borderRadius: 6, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 180 }}>
                      
                      {selectedDetail.bukti_bayar ? (
                        <>
                          {selectedDetail.bukti_bayar.endsWith('.pdf') ? (
                            <div style={{ padding: '20px 0', color: T.textMut, textAlign: 'center' }}>
                              <Receipt size={32} style={{ margin: '0 auto', marginBottom: 8, opacity: 0.5 }} />
                              <p style={{ fontSize: '0.75rem' }}>Dokumen berformat PDF</p>
                            </div>
                          ) : (
                            <img 
                              src={`http://127.0.0.1:5000${selectedDetail.bukti_bayar}`} 
                              alt="Bukti Bayar" 
                              style={{ maxWidth: '100%', maxHeight: 150, objectFit: 'contain', borderRadius: 4 }} 
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <a 
                            href={`http://127.0.0.1:5000${selectedDetail.bukti_bayar}`} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: T.surface, background: T.gold, padding: '6px 12px', borderRadius: 4, textDecoration: 'none', fontWeight: 600, width: '100%', justifyContent: 'center' }}
                          >
                            <ExternalLink size={14} /> Buka Lampiran
                          </a>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', color: T.textMut }}>
                          <Receipt size={28} style={{ margin: '0 auto', marginBottom: 8, opacity: 0.3 }} />
                          <p style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>No Image</p>
                        </div>
                      )}

                    </div>
                  </div>

                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: `1px dashed ${T.border2}`, paddingTop: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Tagihan Nota</p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.25rem', color: T.gold, fontWeight: 600 }}>Rp {Number(selectedDetail.total_nominal).toLocaleString('id-ID')}</p>
                  </div>
                </div>

              </div>
            </ModalBox>
          </ModalOverlay>
        )}
      </div>
    );
  }

  // VIEW: FORM TAMBAH
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <button type="button" onClick={() => setView('list')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: T.textSec, cursor: 'pointer', fontSize: '0.75rem', padding: '4px 0', marginBottom: 4 }}><ArrowLeft size={13} /> Kembali ke Daftar Pengadaan</button>
      </div>

      <Card>
        <CardHeader title="Formulir Faktur Pembelian Baru" gold action={<GoldBtn type="submit" disabled={isSubmitting || items.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Save size={13} /> {isSubmitting ? 'Memproses...' : 'Simpan Faktur'}</GoldBtn>} />
        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <Field label="No. Faktur / Invoice" gold><Input value={header.no_faktur} onChange={(e) => setHeader({...header, no_faktur: e.target.value})} placeholder="INV-SUP-XXXX" style={{ fontFamily: 'JetBrains Mono, monospace', color: T.gold }} required /></Field>
          <Field label="Tanggal Transaksi"><Input type="date" value={header.tgl_pembelian} onChange={(e) => setHeader({...header, tgl_pembelian: e.target.value})} required /></Field>
          <Field label="Toko / Supplier" gold><Select value={header.supplier} onChange={(e) => setHeader({...header, supplier: e.target.value})} required><option value="">-- Pilih Supplier --</option>{suppliers.map(s => <option key={s.id} value={s.nama_toko}>{s.nama_toko}</option>)}</Select></Field>
          <Field label="Status Nota"><Select value={header.status_bayar} onChange={(e) => setHeader({...header, status_bayar: e.target.value})}><option value="Tempo">Tempo / Utang</option><option value="Lunas">Lunas</option></Select></Field>
          <Field label="Upload Bukti Nota"><div style={{ background: T.raised, border: `1px solid ${T.border2}`, borderRadius: 3, padding: '5px 10px' }}><input type="file" accept="image/*,.pdf" onChange={(e) => setHeader({...header, bukti_bayar: e.target.files[0]})} style={{ fontSize: '0.72rem', color: T.textSec, width: '100%' }} /></div></Field>
        </div>
      </Card>

      <Card>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justify穫ontent: 'space-between', background: 'rgba(12, 11, 15, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 5, height: 5, background: T.jade, borderRadius: 1, transform: 'rotate(45deg)' }} /><span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.textSec }}>Rincian Barang & Operasional</span></div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: T.jade, fontWeight: 600 }}>{totalItem} Baris</span>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item) => {
            const isOngkir = item.jenis === 'Ongkir';
            const seriOptions = masterHp.filter(h => h.brand === item.brand).map(s => s.seri);

            return (
              <div key={item.id_temp} style={{ background: T.raised, border: `1px solid ${T.border2}`, borderRadius: 4, padding: '14px 16px', display: 'flex', gap: 14, borderLeft: `3px solid ${isOngkir ? T.sky : T.gold}` }}>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isOngkir ? '1fr 2fr' : '1.2fr 1fr 1fr 1.5fr', gap: 12 }}>
                  <Field label="Jenis Entri" gold={isOngkir}><Select value={item.jenis} onChange={(e) => updateItem(item.id_temp, 'jenis', e.target.value)}>{JENIS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</Select></Field>
                  {!isOngkir && (
                    <><Field label="Brand"><Select value={item.brand} onChange={(e) => updateItem(item.id_temp, 'brand', e.target.value)}>{uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}</Select></Field>
                    <Field label="Seri"><SearchableDropdown value={item.seri} onChange={(val) => updateItem(item.id_temp, 'seri', val)} options={seriOptions} placeholder="- Pilih Seri -" disabled={!item.brand} /></Field></>
                  )}
                  <Field label={isOngkir ? "Biaya Ongkir (Rp)" : "Harga Modal Beli (Rp)"} gold={!isOngkir}><Input type="number" value={item.harga_beli} onChange={(e) => updateItem(item.id_temp, 'harga_beli', e.target.value)} placeholder="0" style={{ fontFamily: 'JetBrains Mono, monospace', color: isOngkir ? T.sky : T.ember }} required /></Field>
                </div>
                <button type="button" onClick={() => removeItem(item.id_temp)} style={{ alignSelf: 'center', background: 'none', border: 'none', color: T.textMut, cursor: 'pointer', padding: 6, transition: 'color 0.12s' }} onMouseEnter={e => e.currentTarget.style.color = T.ember} onMouseLeave={e => e.currentTarget.style.color = T.textMut}><Trash2 size={15} /></button>
              </div>
            );
          })}
          <button type="button" onClick={handleAddItem} style={{ width: '100%', border: `1px dashed ${T.border2}`, background: 'none', borderRadius: 4, padding: '11px', fontSize: '0.78rem', color: T.textMut, cursor: 'pointer', display: 'flex', alignItems: 'center', justify穫ontent: 'center', gap: 6 }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.textMut; }}><Plus size={13} /> Tambah Baris Transaksi</button>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16 }}>
        <div style={{ background: T.raised, border: `1px solid ${T.border2}`, borderRadius: 4, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.78rem', color: T.textSec, lineHeight: 1.5 }}><Receipt size={18} color={T.sky} /><span>Nominal ter-rekonsiliasi otomatis. Unit akan masuk <strong>Task Board</strong>.</span></div>
        <Card style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', justify穫ontent: 'center', gap: 4, borderLeft: `3px solid ${T.gold}` }}><p style={{ fontSize: '0.6rem', color: T.textMut, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total Tagihan Faktur</p><p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.25rem', color: T.gold, fontWeight: 600 }}>Rp {totalNominal.toLocaleString('id-ID')}</p></Card>
      </div>
    </form>
  );
}