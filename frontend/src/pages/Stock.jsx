import React, { useState, useEffect } from 'react';
import { Search, X, Layers, Clock, Calendar, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';
import { T, Card, CardHeader, Input, ModalOverlay, ModalBox, ModalHeader, THead, Field } from './ui';

export default function Stock() {
  const [stocks, setStocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDetail, setActiveDetail] = useState(null);

  useEffect(() => { 
    const fetchStocks = async () => { 
      try {
        const res = await api.get('/stocks'); 
        setStocks(res.data.data); 
      } catch (error) {
        console.error("Gagal mengambil data stok", error);
      }
    }; 
    fetchStocks(); 
  }, []);

  const filtered = stocks.filter(i => 
    i.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.id_stock.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fungsi pembantu warna umur stok (Menggunakan palet T)
  const getAgeStyle = (age) => {
    if (age <= 7) return { color: T.jade, border: `1px solid ${T.jade}40`, background: `${T.jade}15` };
    if (age <= 30) return { color: T.gold, border: `1px solid ${T.gold}40`, background: `${T.gold}15` };
    return { color: T.ember, border: `1px solid ${T.ember}40`, background: `${T.ember}15` }; // animate-pulse bisa ditambahkan via CSS jika diperlukan
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Kolom Pencarian Cepat */}
      <Card>
        <div style={{ padding: '16px 22px', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 10, color: T.textMut }} />
            <Input 
              placeholder="Cari ID Stok atau Nama Komponen..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>
        </div>
      </Card>

      {/* Tabel Utama */}
      <Card>
        <CardHeader title="Inventory Stok Gudang" gold />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <THead cols={['SKU', 'Grade & Rak', 'Umur Stok', { label: 'Aksi', align: 'center' }]} />
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 32, textAlign: 'center', color: T.textMut, fontSize: '0.78rem' }}>
                    Tidak ada data stok yang ditemukan.
                  </td>
                </tr>
              )}
              {filtered.map((item) => {
                const ageStyle = getAgeStyle(item.umur_stok);
                return (
                  <tr key={item.id_stock} style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.raised}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: T.gold }}>{item.id_stock}</div>
                      <div style={{ fontSize: '0.82rem', color: T.textPri, marginTop: 3, fontWeight: 500 }}>{item.nama_barang}</div>
                      <div style={{ fontSize: '0.68rem', color: T.textMut, marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>IMEI Induk: {item.imei_asal || '—'}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '0.82rem', color: T.jade, fontWeight: 600 }}>{item.grade}</div>
                      <div style={{ fontSize: '0.72rem', color: T.textSec, marginTop: 2 }}>{item.lokasi_rak}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 600, 
                        padding: '4px 8px', borderRadius: 4, ...ageStyle 
                      }}>
                        {item.umur_stok} Hari
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button onClick={() => setActiveDetail(item)} style={{ background: T.raised, border: `1px solid ${T.border2}`, color: T.textSec, borderRadius: 3, padding: '7px 14px', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.15s, border-color 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = T.gold; e.currentTarget.style.borderColor = T.gold; }}
                        onMouseLeave={e => { e.currentTarget.style.color = T.textSec; e.currentTarget.style.borderColor = T.border2; }}>
                        <Layers size={13} /> Detail Penuh
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Detail Semua Atribut */}
      {activeDetail && (
        <ModalOverlay onClose={() => setActiveDetail(null)}>
          <ModalBox style={{ maxWidth: 850 }}>
            <ModalHeader title="Informasi Detail Aset" onClose={() => setActiveDetail(null)} />
            
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>
              
              {/* Bagian Visual (Foto & QR) */}
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ background: T.raised, border: `1px solid ${T.border2}`, borderRadius: 4, padding: 14, flex: 1 }}>
                  <p style={{ fontSize: '0.6rem', color: T.textMut, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Visual Komponen Terakhir</p>
                  {activeDetail.foto ? (
                    <img src={`http://localhost:5000${activeDetail.foto}`} alt="Foto" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4, border: `1px solid ${T.border}` }} />
                  ) : (
                    <div style={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.overlay, borderRadius: 4, border: `1px solid ${T.border}`, fontSize: '0.7rem', color: T.textMut }}>No Foto</div>
                  )}
                </div>
                <div style={{ background: T.raised, border: `1px solid ${T.border2}`, borderRadius: 4, padding: 14, flex: 1 }}>
                  <p style={{ fontSize: '0.6rem', color: T.textMut, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>QR Code Identitas</p>
                  {activeDetail.qr_code ? (
                    <img src={`http://localhost:5000${activeDetail.qr_code}`} alt="QR" style={{ width: 100, height: 100, background: '#fff', padding: 4, borderRadius: 4 }} />
                  ) : (
                    <div style={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.overlay, borderRadius: 4, border: `1px solid ${T.border}`, fontSize: '0.7rem', color: T.textMut }}>No QR</div>
                  )}
                </div>
              </div>

              {/* Basic Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Kode SKU Tersimpan" gold>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: T.gold, fontWeight: 600 }}>{activeDetail.id_stock}</div>
                </Field>
                <Field label="Nomor Order Asal (Manifes)">
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: T.textPri }}>{activeDetail.no_order}</div>
                </Field>
                <div style={{ gridColumn: 'span 2' }}>
                  <Field label="Nama / Deskripsi Komponen">
                    <div style={{ fontSize: '1.05rem', color: T.textPri, fontWeight: 500 }}>{activeDetail.nama_barang}</div>
                  </Field>
                </div>
                <Field label="Identitas Kategori">
                  <div style={{ fontSize: '0.85rem', color: T.textSec }}>{activeDetail.jenis} — {activeDetail.brand}</div>
                </Field>
                <Field label="IMEI Bawaan (Turunan)">
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', background: T.overlay, padding: '4px 8px', borderRadius: 4, display: 'inline-block', fontSize: '0.75rem', color: T.textSec }}>
                    {activeDetail.imei_asal || 'Tidak Ada IMEI'}
                  </div>
                </Field>
                <Field label="Grade Saat Ini">
                  <div style={{ fontSize: '0.9rem', color: T.jade, fontWeight: 600 }}>{activeDetail.grade}</div>
                </Field>
                <Field label="Status Ketersediaan">
                  <div style={{ fontSize: '0.85rem', color: T.textPri, textTransform: 'uppercase', fontWeight: 500 }}>{activeDetail.status_barang}</div>
                </Field>
              </div>

              {/* Jejak Distribusi & Finansial */}
              <div>
                <p style={{ fontSize: '0.65rem', color: T.gold, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 600, borderBottom: `1px solid ${T.border}`, paddingBottom: 6 }}>Jejak Distribusi & Finansial</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Umur Stok">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: T.textPri }}>
                      <Clock size={14} color={T.textMut}/> {activeDetail.umur_stok} Hari Gudang
                    </div>
                  </Field>
                  <Field label="Tanggal Masuk">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: T.textPri }}>
                      <Calendar size={14} color={T.textMut}/> {activeDetail.tgl_masuk ? new Date(activeDetail.tgl_masuk).toLocaleDateString('id-ID') : '-'}
                    </div>
                  </Field>
                  <Field label="Lokasi Spesifik">
                    <div style={{ fontSize: '0.85rem', color: T.textSec }}>
                      {activeDetail.lokasi_toko} <span style={{ color: T.textMut }}>/</span> <span style={{ background: T.overlay, padding: '2px 6px', borderRadius: 3, border: `1px solid ${T.border}` }}>{activeDetail.lokasi_rak}</span>
                    </div>
                  </Field>
                  <Field label="Tujuan Tindakan">
                    <div style={{ fontSize: '0.85rem', color: T.gold, fontWeight: 600, textTransform: 'uppercase' }}>{activeDetail.tindakan || 'Jual'}</div>
                  </Field>
                  <div style={{ gridColumn: 'span 2' }}>
                    <Field label="Riwayat Modal Proporsional">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                        <div style={{ color: T.textSec, display: 'flex', justifyContent: 'space-between', maxWidth: 200 }}><span>Dasar:</span> <span>Rp {Number(activeDetail.modal_awal).toLocaleString('id-ID')}</span></div>
                        <div style={{ color: T.ember, display: 'flex', justifyContent: 'space-between', maxWidth: 200, borderBottom: `1px solid ${T.border}`, paddingBottom: 4 }}><span>Repair:</span> <span>+Rp {Number(activeDetail.biaya_reparasi).toLocaleString('id-ID')}</span></div>
                        <div style={{ color: T.textPri, display: 'flex', justifyContent: 'space-between', maxWidth: 200, fontWeight: 600, paddingTop: 2, fontSize: '0.9rem' }}><span>Total:</span> <span>Rp {Number(activeDetail.total_modal).toLocaleString('id-ID')}</span></div>
                      </div>
                    </Field>
                  </div>
                </div>
              </div>

              {/* Alur Foto 3 Fase */}
              <div>
                <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', color: T.textMut, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>
                  <ImageIcon size={14} color={T.gold} /> Alur Dokumentasi Kamera Pemeriksaan
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  
                  {/* Fase 1 */}
                  <div style={{ background: T.raised, border: `1px solid ${T.border2}`, borderRadius: 4, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 600, background: T.overlay, padding: '2px 6px', borderRadius: 3, color: T.textMut }}>Fase 1</span>
                      <span style={{ fontSize: '0.6rem', color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kedatangan</span>
                    </div>
                    <div style={{ background: T.overlay, height: 120, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: `1px solid ${T.border}` }}>
                      {activeDetail.foto_datang ? <img src={`http://localhost:5000${activeDetail.foto_datang}`} alt="Datang" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.7rem', color: T.textMut, fontStyle: 'italic' }}>No Image</span>}
                    </div>
                  </div>

                  {/* Fase 2 */}
                  <div style={{ background: T.raised, border: `1px solid ${T.border2}`, borderRadius: 4, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 600, background: `${T.gold}20`, padding: '2px 6px', borderRadius: 3, color: T.gold }}>Fase 2</span>
                      <span style={{ fontSize: '0.6rem', color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em' }}>QC / Grading</span>
                    </div>
                    <div style={{ background: T.overlay, height: 120, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: `1px solid ${T.border}` }}>
                      {activeDetail.foto ? <img src={`http://localhost:5000${activeDetail.foto}`} alt="QC" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.7rem', color: T.textMut, fontStyle: 'italic' }}>No Image</span>}
                    </div>
                  </div>

                  {/* Fase 3 */}
                  <div style={{ background: T.raised, border: `1px solid ${T.border2}`, borderRadius: 4, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 600, background: `${T.jade}20`, padding: '2px 6px', borderRadius: 3, color: T.jade }}>Fase 3</span>
                      <span style={{ fontSize: '0.6rem', color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reparasi</span>
                    </div>
                    <div style={{ background: T.overlay, height: 120, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: `1px solid ${T.border}` }}>
                      {activeDetail.foto_reparasi ? <img src={`http://localhost:5000${activeDetail.foto_reparasi}`} alt="Reparasi" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.7rem', color: T.textMut, fontStyle: 'italic' }}>No Image</span>}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </ModalBox>
        </ModalOverlay>
      )}
    </div>
  );
}