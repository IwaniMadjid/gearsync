import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Save, ArrowDownToLine, Package, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { T, Card, CardHeader, Field, Input, Select, GoldBtn, ModalOverlay, ModalBox, ModalHeader, THead } from './ui';

// FUNGSI GENERATOR SKU OTOMATIS
const generateSKU = (jenis, seri) => {
  const partMap = {
    'Unit': 'UNI', 'LCD': 'LCD', 'Baterai': 'BAT',
    'Frame LCD': 'FRM', 'List LCD': 'LST', 'Cover Backdoor': 'BCK', 'Lem Advise': 'LEM'
  };
  const kode = partMap[jenis] || 'GEN';
  const s = (seri || '').toUpperCase().replace(/\s+/g, '');
  const suffix = s.includes('5G') ? 'G' : s.includes('LTE') ? 'L' : 'N';
  let singkatan = s.replace('5G', '').replace('LTE', '').replace(/\//g, '');
  singkatan = singkatan.replace('ULTRA', 'U').replace('+', 'P').replace('FOLD', 'FD').replace('FLIP', 'FP');
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `${kode}-${singkatan}${suffix}-${rnd}`;
};

export default function Supplies() {
  const [fakturList, setFakturList] = useState([]);
  const [suppliesList, setSuppliesList] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSupplyDetail, setSelectedSupplyDetail] = useState(null);

  const [selectedFakturNo, setSelectedFakturNo] = useState('');
  const [fakturDetail, setFakturDetail] = useState(null);
  const [items, setItems] = useState([]);
  const [tglMasuk, setTglMasuk] = useState(new Date().toISOString().split('T')[0]);

  // STATE UNTUK NOTIFIKASI KUSTOM (TOAST)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // FUNGSI PEMANGGIL NOTIFIKASI
  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    // Notifikasi hilang otomatis setelah 3,5 detik
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  const fetchData = async () => {
    try {
      const [resPurchases, resSupplies] = await Promise.all([
        api.get('/purchases').catch(() => ({ data: { data: [] } })),
        api.get('/supplies').catch(() => ({ data: { data: [] } }))
      ]);
      setFakturList(resPurchases.data.data || []);
      setSuppliesList(resSupplies.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil data", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const pendingFakturs = fakturList.filter(f => f.status_kedatangan !== 'Barang Tiba');

  const handleSelectFaktur = (noFaktur) => {
    setSelectedFakturNo(noFaktur);
    if (!noFaktur) { setFakturDetail(null); setItems([]); return; }
    
    const targetFaktur = pendingFakturs.find(f => f.no_faktur === noFaktur);
    if (targetFaktur) {
      setFakturDetail(targetFaktur);
      let rawItems = [];
      try { rawItems = typeof targetFaktur.items === 'string' ? JSON.parse(targetFaktur.items) : (targetFaktur.items || []); } catch { rawItems = []; }
      
      const physicalItems = rawItems.filter(item => item.jenis !== 'Ongkir').map((item, idx) => ({
        ...item, 
        id_row: `${Date.now()}-${idx}`,
        sku: generateSKU(item.jenis, item.seri), 
        imei: '', 
        lokasi_rak: '', 
        foto: null
      }));
      setItems(physicalItems);
    }
  };

  const updateItemManual = (id_row, field, value) => setItems(items.map(i => i.id_row === id_row ? { ...i, [field]: value } : i));

  const closeAndResetModal = () => {
    setIsModalOpen(false); setSelectedFakturNo(''); setFakturDetail(null); setItems([]); setTglMasuk(new Date().toISOString().split('T')[0]);
  };

  const handleSubmitArrival = async (e) => {
    e.preventDefault();
    
    // MENGGANTI NATIVE ALERT DENGAN TOAST KUSTOM
    if (!selectedFakturNo) return showToast("Silakan pilih nomor faktur terlebih dahulu!", "error");
    if (items.length === 0) return showToast("Tidak ada item fisik dalam manifes ini.", "error");
    if (items.some(i => !i.imei || !i.lokasi_rak)) return showToast("Nomor IMEI dan Lokasi Rak pada semua baris wajib diisi!", "error");

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append('no_faktur', selectedFakturNo);
    fd.append('tgl_masuk', tglMasuk);
    fd.append('komponen', JSON.stringify(items.map(({ foto, id_row, ...rest }) => ({ ...rest }))));
    items.forEach((item, index) => { if (item.foto) fd.append(`foto_item_${index}`, item.foto); });

    try {
      await api.post('/supplies/execute', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast("SKU Diterima", "success");
      closeAndResetModal();
      fetchData(); 
    } catch (error) {
      showToast("Gagal memproses kedatangan barang. Periksa koneksi server Anda.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFakturAsal = (noOrder) => {
    if (!noOrder) return '-';
    if (noOrder.includes('INV-')) {
      const parts = noOrder.split('-');
      return parts.slice(1, -1).join('-');
    }
    return noOrder; 
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
      
      {/* NOTIFIKASI KUSTOM MELAYANG (TOAST) */}
      {toast.show && (
        <div style={{
          position: 'fixed', bottom: 32, right: 32, zIndex: 99999,
          background: T.raised, border: `1px solid ${toast.type === 'success' ? T.jade : T.ember}`,
          padding: '14px 24px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)', color: T.textPri, fontSize: '0.85rem', fontWeight: 500,
          transition: 'all 0.3s ease-in-out'
        }}>
          {toast.type === 'success' ? <CheckCircle size={18} color={T.jade} /> : <AlertCircle size={18} color={T.ember} />}
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: T.textPri, letterSpacing: '-0.02em', margin: 0 }}>Kedatangan Barang.</h1>
          <p style={{ color: T.textSec, fontSize: '0.85rem', marginTop: 4 }}>Daftar logistik dan aset yang telah fisik tiba di gudang dari supplier.</p>
        </div>
        <GoldBtn onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px' }}>
          <ArrowDownToLine size={16} /> Proses Kedatangan Baru
        </GoldBtn>
      </div>

      <Card>
        <CardHeader title="Histori Manifes Barang Tiba (Supplies)" gold />
        <div style={{ overflowX: 'auto', minHeight: 400 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <THead cols={['Tgl. Masuk & Kode SKU', 'Identitas Barang', 'Nomor IMEI / Seri', 'Lokasi & Harga Beli', {label: 'Status QC', align: 'center'}, {label: 'Aksi', align: 'center'}]} />
            <tbody>
              {suppliesList.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: T.textMut, fontSize: '0.85rem', fontWeight: 600 }}>Belum ada barang yang tiba di gudang.</td></tr>
              ) : (
                suppliesList.map((item) => (
                  <tr key={item.id_supply || item.no_order} style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.raised} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.75rem', color: T.textSec, fontFamily: 'JetBrains Mono, monospace' }}>{new Date(item.tgl_masuk).toLocaleDateString('id-ID')}</div>
                      <div style={{ fontSize: '0.9rem', color: T.gold, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                        {item.sku || 'SKU-PENDING'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: T.textMut, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.supplier}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.9rem', color: T.textPri, fontWeight: 600 }}>{item.nama_barang}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: '0.65rem', background: T.overlay, color: T.textSec, padding: '2px 6px', borderRadius: 3, border: `1px solid ${T.border2}`, fontWeight: 600 }}>{item.jenis}</span>
                        <span style={{ fontSize: '0.75rem', color: T.textSec }}>{item.brand}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: T.textPri }}>{item.imei || '-'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.8rem', color: T.textPri, fontWeight: 600 }}>{item.lokasi_rak}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: T.textSec, marginTop: 4 }}>Rp {Number(item.modal_awal).toLocaleString('id-ID')}</div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 4, background: item.status_proses === 'Selesai' ? T.jadeBg : T.emberBg, color: item.status_proses === 'Selesai' ? T.jade : T.ember, border: `1px solid ${item.status_proses === 'Selesai' ? T.jade : T.ember}30` }}>{item.status_proses}</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button onClick={() => setSelectedSupplyDetail(item)} style={{ background: T.overlay, border: `1px solid ${T.border2}`, color: T.textPri, borderRadius: 4, padding: '6px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
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

      {/* MODAL DETAIL BARANG */}
      {selectedSupplyDetail && (
        <ModalOverlay onClose={() => setSelectedSupplyDetail(null)}>
          <ModalBox style={{ maxWidth: 500 }}>
            <ModalHeader title="Rincian Fisik Barang Tiba" onClose={() => setSelectedSupplyDetail(null)} />
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div style={{ textAlign: 'center', background: T.raised, padding: 20, borderRadius: 6, border: `1px dashed ${T.border2}` }}>
                {selectedSupplyDetail.foto ? (
                  <img src={`http://127.0.0.1:5000${selectedSupplyDetail.foto}`} alt="Fisik Barang" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 4 }} 
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} 
                  />
                ) : null}
                <div style={{ display: selectedSupplyDetail.foto ? 'none' : 'block', color: T.textMut, fontSize: '0.8rem', fontStyle: 'italic' }}>
                  Tidak ada unggahan foto fisik.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>Nama & Brand</p>
                  <p style={{ fontSize: '0.85rem', color: T.textPri, fontWeight: 600, marginTop: 4 }}>{selectedSupplyDetail.nama_barang}</p>
                  <p style={{ fontSize: '0.75rem', color: T.textSec }}>{selectedSupplyDetail.brand}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>Faktur Asal / Order</p>
                  <p style={{ fontSize: '0.85rem', color: T.gold, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, marginTop: 4 }}>
                    {getFakturAsal(selectedSupplyDetail.no_order)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>Nomor SKU Terdaftar</p>
                  <p style={{ fontSize: '0.85rem', color: T.jade, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, marginTop: 4 }}>{selectedSupplyDetail.sku}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>Harga Modal Beli</p>
                  <p style={{ fontSize: '0.9rem', color: T.textPri, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, marginTop: 4 }}>Rp {Number(selectedSupplyDetail.modal_awal).toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>Nomor IMEI</p>
                  <p style={{ fontSize: '0.85rem', color: T.textPri, fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>{selectedSupplyDetail.imei || '-'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>Lokasi Rak</p>
                  <p style={{ fontSize: '0.85rem', color: T.textPri, fontWeight: 600, marginTop: 4 }}>{selectedSupplyDetail.lokasi_rak}</p>
                </div>
              </div>

            </div>
          </ModalBox>
        </ModalOverlay>
      )}

      {/* MODAL FORMULIR KEDATANGAN BARANG */}
      {isModalOpen && (
        <ModalOverlay onClose={closeAndResetModal}>
          <ModalBox style={{ maxWidth: 950, maxHeight: '90vh' }}>
            <ModalHeader title="Verifikasi Manifes Barang Tiba" onClose={closeAndResetModal} />
            <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <Field label="Pilih No. Faktur Pembelian (Status Pending)" gold>
                  <Select value={selectedFakturNo} onChange={e => handleSelectFaktur(e.target.value)}>
                    <option value="">-- Hubungkan ke Faktur Terbuka --</option>
                    {pendingFakturs.map(f => {
                      let count = 0; try { count = JSON.parse(f.items || '[]').length; } catch { count = 0; }
                      return <option key={f.no_faktur} value={f.no_faktur}>{f.no_faktur} | {f.supplier} | {count} Item | Rp {Number(f.total_nominal).toLocaleString('id-ID')}</option>
                    })}
                  </Select>
                </Field>
                <Field label="Tanggal Masuk (Fisik Tiba)"><Input type="date" value={tglMasuk} onChange={e => setTglMasuk(e.target.value)} required /></Field>
              </div>

              {/* PERBAIKAN: METODE BAYAR DIGANTI MENJADI TANGGAL ORDER */}
              {fakturDetail && (
                <div style={{ background: T.goldBg, border: `1px solid ${T.gold}40`, borderRadius: 6, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <div>
                      <p style={{ fontSize: '0.65rem', color: T.gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supplier</p>
                      <p style={{ fontSize: '0.85rem', color: T.textPri, fontWeight: 600, marginTop: 2 }}>{fakturDetail.supplier}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.65rem', color: T.gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tanggal Order</p>
                      <p style={{ fontSize: '0.85rem', color: T.textPri, fontWeight: 600, marginTop: 2 }}>
                        {fakturDetail.tgl_pembelian ? new Date(fakturDetail.tgl_pembelian).toLocaleDateString('id-ID') : '-'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.65rem', color: T.gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Tagihan</p>
                      <p style={{ fontSize: '0.85rem', color: fakturDetail.status_bayar === 'Lunas' ? T.jade : T.ember, fontWeight: 800, marginTop: 2, textTransform: 'uppercase' }}>{fakturDetail.status_bayar}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.65rem', color: T.gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Pembelian</p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', color: T.gold, fontWeight: 600, marginTop: 2 }}>Rp {Number(fakturDetail.total_nominal).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              )}

              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Package size={16} color={T.jade} /><span style={{ fontSize: '0.85rem', fontWeight: 600, color: T.textPri }}>Pengisian Atribut Fisik Aset</span><span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: T.jade, background: T.jadeBg, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{items.length} Komponen Fisik</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {items.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: T.textMut, fontSize: '0.8rem', fontStyle: 'italic', background: T.raised, borderRadius: 6, border: `1px dashed ${T.border2}` }}>Silakan pilih nomor faktur di atas untuk memuat manifes item.</div>
                  ) : (
                    items.map((item, idx) => (
                      <div key={item.id_row} style={{ background: T.raised, border: `1px solid ${T.border2}`, borderRadius: 6, padding: '16px', display: 'flex', gap: 20, borderLeft: `3px solid ${T.jade}` }}>
                        <div style={{ width: '30%', borderRight: `1px solid ${T.border2}`, paddingRight: 16 }}>
                          <span style={{ fontSize: '0.65rem', color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: T.overlay, padding: '2px 6px', borderRadius: 3 }}>Item {idx + 1} ({item.jenis})</span>
                          <div style={{ fontSize: '0.9rem', color: T.textPri, fontWeight: 600, marginTop: 8 }}>{item.nama_barang}</div>
                          {/* SKU YANG BARU DIGENERATE MUNCUL DISINI! */}
                          <div style={{ fontSize: '0.8rem', color: T.gold, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, marginTop: 4 }}>{item.sku}</div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: T.textSec, marginTop: 6, fontWeight: 600 }}>Rp {Number(item.harga_beli).toLocaleString('id-ID')}</div>
                        </div>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', gap: 16 }}>
                          <Field label="Nomor IMEI / Serial Unit" gold><Input value={item.imei} onChange={e => updateItemManual(item.id_row, 'imei', e.target.value)} placeholder="Ketik IMEI fisik..." style={{ fontFamily: 'JetBrains Mono, monospace', color: T.gold }} required /></Field>
                          <Field label="Lokasi Rak" gold><Input value={item.lokasi_rak} onChange={e => updateItemManual(item.id_row, 'lokasi_rak', e.target.value)} placeholder="Misal: RAK-A1" required /></Field>
                          <Field label="Foto Fisik Barang"><div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 3, padding: '6px 10px' }}><input type="file" accept="image/*" onChange={e => updateItemManual(item.id_row, 'foto', e.target.files[0])} style={{ fontSize: '0.7rem', color: T.textSec, width: '100%' }} /></div></Field>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, background: 'rgba(12,11,15,0.8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: T.textMut }}><ClipboardCheck size={14} color={T.jade} /><span>SKU akan dicetak dan masuk antrean <strong>Task Board</strong>.</span></div>
              <GoldBtn onClick={handleSubmitArrival} disabled={isSubmitting || items.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Save size={14} /> {isSubmitting ? 'Memproses...' : 'Sahkan Barang Tiba'}</GoldBtn>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
    </div>
  );
}