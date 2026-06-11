import React, { useState, useEffect } from 'react';
import { Hammer, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { T, Card, CardHeader, Field, Input, Select, GoldBtn, ModalOverlay, ModalBox, ModalHeader, THead } from './ui';

export default function Repair() {
  const [repairItems, setRepairItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeItem, setActiveItem]   = useState(null);
  
  const [formData, setFormData] = useState({ 
    tambahan_biaya: '', 
    catatan: '', 
    newGrade: 'Grade A', 
    lokasi_rak_baru: '',
    foto: null 
  });

  const fetchRepairs = async () => { 
    try {
      const res = await api.get('/repairs/pending'); 
      setRepairItems(res.data.data); 
    } catch (error) {
      console.error("Gagal mengambil data", error);
    }
  };
  
  useEffect(() => { fetchRepairs(); }, []);

  const openRepairModal = (item) => { 
    setActiveItem(item); 
    setFormData({ 
      tambahan_biaya: '', 
      catatan: '', 
      newGrade: item.grade,
      lokasi_rak_baru: item.lokasi_rak,
      foto: null 
    }); 
    setIsModalOpen(true); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: T.textPri, margin: 0, letterSpacing: '-0.02em' }}>Repair.</h1>
        <p style={{ color: T.textSec, fontSize: '0.8rem', marginTop: 4 }}>Tahap perbaikan untuk produk cacat.</p>
      </div>
      <Card>
        <CardHeader title="Meja Reparasi Komponen" gold />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <THead cols={['SKU / Nama', 'Grade & Rak', { label: 'Tindakan', align: 'center' }]} />
            <tbody>
              {repairItems.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: 32, textAlign: 'center', color: T.textMut, fontSize: '0.78rem' }}>
                    Tidak ada komponen yang masuk meja reparasi.
                  </td>
                </tr>
              )}
              {repairItems.map(item => (
                <tr key={item.id_stock} style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.raised}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: T.gold }}>{item.id_stock}</div>
                    <div style={{ fontSize: '0.82rem', color: T.textPri, marginTop: 3, fontWeight: 500 }}>{item.nama_barang}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '0.82rem', color: T.textPri, fontWeight: 500 }}>{item.grade}</div>
                    <div style={{ fontSize: '0.68rem', color: T.textMut, marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{item.lokasi_rak}</div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button onClick={() => openRepairModal(item)} style={{ background: T.raised, border: `1px solid ${T.border2}`, color: T.textSec, borderRadius: 3, padding: '7px 14px', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.15s, border-color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = T.gold; e.currentTarget.style.borderColor = T.gold; }}
                      onMouseLeave={e => { e.currentTarget.style.color = T.textSec; e.currentTarget.style.borderColor = T.border2; }}>
                      <Hammer size={13} /> Input Reparasi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Repair Modal */}
      {isModalOpen && activeItem && (
        <ModalOverlay onClose={() => setIsModalOpen(false)}>
          <ModalBox style={{ maxWidth: 550 }}>
            <ModalHeader title="Log Tindakan Reparasi" onClose={() => setIsModalOpen(false)} />
            
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
              
              {/* Item Info Box */}
              <div style={{ background: T.raised, border: `1px solid ${T.border2}`, borderRadius: 4, padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: '0.6rem', color: T.textMut, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Objek Reparasi</p>
                  <p style={{ fontSize: '0.9rem', color: T.textPri, fontWeight: 500 }}>{activeItem.nama_barang}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.6rem', color: T.textMut, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>SKU Komponen</p>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: T.gold }}>{activeItem.id_stock}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Tambahan Biaya (Rp)" gold>
                  <Input 
                    type="number" 
                    value={formData.tambahan_biaya} 
                    onChange={e => setFormData({...formData, tambahan_biaya: e.target.value})} 
                    style={{ color: T.gold, fontFamily: 'JetBrains Mono, monospace' }} 
                  />
                </Field>
                <Field label="Pindah Rak">
                  <Input 
                    value={formData.lokasi_rak_baru} 
                    onChange={e => setFormData({...formData, lokasi_rak_baru: e.target.value})} 
                    placeholder="Lokasi baru..." 
                  />
                </Field>
              </div>

              <Field label="Catatan Tindakan">
                <Input 
                  value={formData.catatan} 
                  onChange={e => setFormData({...formData, catatan: e.target.value})} 
                  placeholder="Misal: Ganti kaca OCA, lem ulang..." 
                />
              </Field>

              <Field label="Grade Setelah Reparasi">
                <Select value={formData.newGrade} onChange={e => setFormData({...formData, newGrade: e.target.value})}>
                  <option value="Grade A">Grade A (Normal)</option>
                  <option value="Grade B">Grade B (Minus Fisik)</option>
                  <option value="Grade C">Grade C (Gagal Sempurna)</option>
                  <option value="Grade D">Grade D (Mati Total)</option>
                </Select>
              </Field>

              <Field label="Foto Bukti Setelah Repair">
                <div style={{ background: T.raised, border: `1px solid ${T.border2}`, borderRadius: 4, padding: '12px 14px' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => setFormData({...formData, foto: e.target.files[0]})} 
                    style={{ fontSize: '0.75rem', color: T.textSec, width: '100%' }} 
                  />
                </div>
              </Field>

              <GoldBtn onClick={handleSubmit} style={{ width: '100%', padding: '11px', marginTop: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <CheckCircle2 size={14} /> Simpan Log & Perbarui Stok
                </span>
              </GoldBtn>

            </div>
          </ModalBox>
        </ModalOverlay>
      )}
    </div>
  );
}