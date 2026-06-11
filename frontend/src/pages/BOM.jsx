import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { T, Card, CardHeader, Field, Input, Select, GoldBtn, ModalOverlay, ModalBox, ModalHeader, THead, Badge } from './ui';

export default function BOM() {
  const [pendingItems, setPendingItems]     = useState([]);
  const [masterSpareparts, setMasterSpareparts] = useState([]);
  const [activeItem, setActiveItem]         = useState(null);
  const [isBOMOpen, setIsBOMOpen]           = useState(false);
  const [isGradeOpen, setIsGradeOpen]       = useState(false);
  const [bomItems, setBomItems]             = useState([]);
  const [gradeForm, setGradeForm]           = useState({ grade: 'Grade A', jenis_cacat: 'Normal', lokasi_rak: '', tindakan: 'Jual', foto: null });

  const fetchData = async () => {
    const [p, s] = await Promise.all([api.get('/supplies/pending'), api.get('/master/sparepart')]);
    setPendingItems(p.data.data); setMasterSpareparts(s.data.data);
  };
  useEffect(() => { fetchData(); }, []);

  const getCacatOptions = (jenis, grade) => {
    if (!masterSpareparts.length) return ['Normal'];
    const f = masterSpareparts.filter(p => p.part.toLowerCase() === jenis.toLowerCase() && p.grade === grade);
    const all = f.flatMap(p => p.jenis_cacat?.split(',').map(s => s.trim()).filter(Boolean) || []);
    return all.length ? [...new Set(all)] : grade === 'Grade A' ? ['Normal','NEW'] : ['(Isi di Master Data)'];
  };

  const openBOM = item => {
    setActiveItem(item);
    const c = getCacatOptions('LCD', 'Grade A');
    setBomItems([{ id: Date.now(), jenis: 'LCD', brand: item.brand, grade: 'Grade A', jenis_cacat: c[0], persentase: 0, lokasi_rak: item.lokasi_rak, tindakan: 'Jual', foto: null }]);
    setIsBOMOpen(true);
  };

  const openGrade = item => {
    setActiveItem(item);
    const c = getCacatOptions(item.jenis, 'Grade A');
    setGradeForm({ grade: 'Grade A', jenis_cacat: c[0], lokasi_rak: item.lokasi_rak, tindakan: 'Jual', foto: null });
    setIsGradeOpen(true);
  };

  const addBomItem = () => {
    const c = getCacatOptions('Baterai', 'Grade A');
    setBomItems([...bomItems, { id: Date.now(), jenis: 'Baterai', brand: activeItem.brand, grade: 'Grade A', jenis_cacat: c[0], persentase: 0, lokasi_rak: activeItem.lokasi_rak, tindakan: 'Jual', foto: null }]);
  };

  const updateBom = (id, field, value) => setBomItems(bomItems.map(item => {
    if (item.id !== id) return item;
    if (field === 'jenis') { const c = getCacatOptions(value, item.grade); return {...item, jenis: value, jenis_cacat: c[0]}; }
    if (field === 'grade') { const c = getCacatOptions(item.jenis, value); return {...item, grade: value, jenis_cacat: c[0]}; }
    return {...item, [field]: field === 'persentase' ? Number(value) : value};
  }));

  const executeBOM = async () => {
    if (bomItems.reduce((a,i) => a + i.persentase, 0) !== 100) return alert('Total persentase harus 100%');
    const fd = new FormData();
    fd.append('no_order', activeItem.no_order);
    fd.append('modal_induk', activeItem.modal_awal);
    fd.append('komponen', JSON.stringify(bomItems.map(({foto, ...rest}) => ({...rest, nama: `${rest.jenis} ${activeItem.nama_barang}`}))));
    bomItems.forEach((item, i) => { if (item.foto) fd.append(`foto_${i}`, item.foto); });
    try { await api.post('/bom/execute', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); setIsBOMOpen(false); fetchData(); }
    catch { alert('Gagal eksekusi BOM'); }
  };

  const executeGrading = async () => {
    const fd = new FormData();
    Object.entries({ no_order: activeItem.no_order, sku: activeItem.sku, nama_barang: activeItem.nama_barang, jenis: activeItem.jenis, brand: activeItem.brand, modal_awal: activeItem.modal_awal, grade: gradeForm.grade, jenis_cacat: gradeForm.jenis_cacat, lokasi_rak: gradeForm.lokasi_rak, tindakan: gradeForm.tindakan }).forEach(([k,v]) => fd.append(k, v));
    if (gradeForm.foto) fd.append('foto', gradeForm.foto);
    try { await api.post('/grading/execute', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); setIsGradeOpen(false); fetchData(); }
    catch { alert('Gagal grading'); }
  };

  const totalPct = bomItems.reduce((a,i) => a + i.persentase, 0);
  const jenisList = ['LCD','Baterai','Frame LCD','List LCD','Cover Backdoor','Lem Advise'];
  const gradeList = ['Grade A','Grade B','Grade C','Grade D','Bahan'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <CardHeader title="Antrean BOM & QC" gold />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <THead cols={['SKU / Nama','IMEI','Modal Dasar',{ label: 'Tindakan', align: 'center' }]} />
            <tbody>
              {pendingItems.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: T.textMut, fontSize: '0.78rem' }}>Tidak ada item menunggu proses.</td></tr>
              )}
              {pendingItems.map(item => (
                <tr key={item.no_order} style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.raised}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: T.gold }}>{item.sku}</div>
                    <div style={{ fontSize: '0.82rem', color: T.textPri, marginTop: 3, fontWeight: 500 }}>{item.nama_barang}</div>
                    <div style={{ fontSize: '0.68rem', color: T.textMut, marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{item.jenis} · {item.brand}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: T.textSec }}>{item.imei || '—'}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', color: T.textPri }}>Rp {Number(item.modal_awal).toLocaleString('id-ID')}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {item.jenis === 'Unit'
                      ? <GoldBtn onClick={() => openBOM(item)}>Pecah BOM</GoldBtn>
                      : <button onClick={() => openGrade(item)} style={{ background: T.raised, border: `1px solid ${T.border2}`, color: T.textSec, borderRadius: 3, padding: '7px 14px', fontSize: '0.75rem', cursor: 'pointer' }}>Set Grade</button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* BOM Modal */}
      {isBOMOpen && activeItem && (
        <ModalOverlay onClose={() => setIsBOMOpen(false)}>
          <ModalBox style={{ maxWidth: 1000 }}>
            <ModalHeader title="Eksekusi Reverse BOM" onClose={() => setIsBOMOpen(false)} />
            <div style={{ padding: '16px 22px', flex: 1, overflowY: 'auto' }}>
              {/* Unit induk info */}
              <div style={{ background: T.goldBg, border: `1px solid rgba(200,166,96,0.15)`, borderRadius: 4, padding: '14px 18px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.6rem', color: T.gold, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Unit Induk</p>
                  <p style={{ fontSize: '1.05rem', fontWeight: 500, color: T.textPri }}>{activeItem.nama_barang}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.6rem', color: T.gold, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Modal Asal</p>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', color: T.textPri }}>Rp {Number(activeItem.modal_awal).toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* BOM items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {bomItems.map(item => {
                  const modal = (item.persentase / 100) * Number(activeItem.modal_awal);
                  const cacatList = getCacatOptions(item.jenis, item.grade);
                  return (
                    <div key={item.id} style={{ background: T.raised, border: `1px solid ${T.border2}`, borderRadius: 4, padding: '14px 16px', display: 'flex', gap: 14, borderLeft: `3px solid ${T.gold}` }}>
                      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                        <Field label="Jenis Part" gold><Select value={item.jenis} onChange={e => updateBom(item.id,'jenis',e.target.value)}>{jenisList.map(j => <option key={j} value={j}>{j}</option>)}</Select></Field>
                        <Field label="Grade QC"><Select value={item.grade} onChange={e => updateBom(item.id,'grade',e.target.value)}>{gradeList.map(g => <option key={g} value={g}>{g}</option>)}</Select></Field>
                        <Field label="Jenis Cacat" gold><Select value={item.jenis_cacat} onChange={e => updateBom(item.id,'jenis_cacat',e.target.value)}>{cacatList.map(c => <option key={c} value={c}>{c}</option>)}</Select></Field>
                        <Field label="Tindakan"><Select value={item.tindakan} onChange={e => updateBom(item.id,'tindakan',e.target.value)}><option value="Jual">Langsung Jual</option><option value="Perbaiki">Masuk Reparasi</option></Select></Field>
                        <Field label="Alokasi %" gold>
                          <Input type="number" min={0} max={100} value={item.persentase} onChange={e => updateBom(item.id,'persentase',e.target.value)} style={{ color: T.gold, fontFamily: 'JetBrains Mono, monospace' }} />
                        </Field>
                        <Field label="Nilai (auto)">
                          <div style={{ background: T.overlay, border: `1px solid ${T.border}`, borderRadius: 3, padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: T.textSec }}>
                            Rp {modal.toLocaleString('id-ID')}
                          </div>
                        </Field>
                        <Field label="Lokasi Rak">
                          <Input value={item.lokasi_rak} onChange={e => updateBom(item.id,'lokasi_rak',e.target.value)} placeholder="Rak…" />
                        </Field>
                        <Field label="Foto">
                          <input type="file" accept="image/*" onChange={e => updateBom(item.id,'foto',e.target.files[0])} style={{ fontSize: '0.72rem', color: T.textSec, width: '100%' }} />
                        </Field>
                      </div>
                      <button onClick={() => setBomItems(bomItems.filter(i => i.id !== item.id))} style={{ alignSelf: 'center', background: 'none', border: 'none', color: T.textMut, cursor: 'pointer', padding: 6, transition: 'color 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.color = T.ember}
                        onMouseLeave={e => e.currentTarget.style.color = T.textMut}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button onClick={addBomItem} style={{ marginTop: 12, width: '100%', border: `1px dashed ${T.border2}`, background: 'none', borderRadius: 4, padding: '11px', fontSize: '0.78rem', color: T.textMut, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'border-color 0.15s, color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.textMut; }}>
                <Plus size={13} /> Tambah Komponen
              </button>
            </div>

            <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(12,11,15,0.5)', flexShrink: 0 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', color: totalPct === 100 ? T.jade : T.ember, fontWeight: 600 }}>
                Alokasi: {totalPct}%
              </span>
              <GoldBtn onClick={executeBOM} disabled={totalPct !== 100}>Konversi & Simpan</GoldBtn>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}

      {/* Grading Modal */}
      {isGradeOpen && activeItem && (
        <ModalOverlay onClose={() => setIsGradeOpen(false)}>
          <ModalBox style={{ maxWidth: 600 }}>
            <ModalHeader title="Set Grade & Evaluasi Fisik" onClose={() => setIsGradeOpen(false)} />
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
              {/* Item info */}
              <div style={{ background: T.raised, border: `1px solid ${T.border2}`, borderRadius: 4, padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><p style={{ fontSize: '0.6rem', color: T.textMut, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Nama</p><p style={{ fontSize: '0.9rem', color: T.textPri, fontWeight: 500 }}>{activeItem.nama_barang}</p></div>
                <div><p style={{ fontSize: '0.6rem', color: T.textMut, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Modal Asal</p><p style={{ fontFamily: 'JetBrains Mono, monospace', color: T.jade }}>Rp {Number(activeItem.modal_awal).toLocaleString('id-ID')}</p></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Grade QC">
                  <Select value={gradeForm.grade} onChange={e => { const g = e.target.value; const c = getCacatOptions(activeItem.jenis, g); setGradeForm({...gradeForm, grade: g, jenis_cacat: c[0]}); }}>
                    {gradeList.map(g => <option key={g} value={g}>{g}</option>)}
                  </Select>
                </Field>
                <Field label="Jenis Cacat" gold>
                  <Select value={gradeForm.jenis_cacat} onChange={e => setGradeForm({...gradeForm, jenis_cacat: e.target.value})}>
                    {getCacatOptions(activeItem.jenis, gradeForm.grade).map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </Field>
                <Field label="Tindakan Lanjut">
                  <Select value={gradeForm.tindakan} onChange={e => setGradeForm({...gradeForm, tindakan: e.target.value})}>
                    <option value="Jual">Siap Jual</option><option value="Perbaiki">Masuk Reparasi</option>
                  </Select>
                </Field>
                <Field label="Lokasi Rak Baru">
                  <Input value={gradeForm.lokasi_rak} onChange={e => setGradeForm({...gradeForm, lokasi_rak: e.target.value})} placeholder="Rak B-12…" />
                </Field>
              </div>
              <Field label="Foto Bukti Kondisi Fisik">
                <div style={{ background: T.raised, border: `1px solid ${T.border2}`, borderRadius: 4, padding: '12px 14px' }}>
                  <input type="file" accept="image/*" onChange={e => setGradeForm({...gradeForm, foto: e.target.files[0]})} style={{ fontSize: '0.75rem', color: T.textSec, width: '100%' }} />
                </div>
              </Field>
              <GoldBtn onClick={executeGrading} style={{ width: '100%', padding: '11px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <CheckCircle2 size={14} /> Sahkan & Pindahkan ke Stok
                </span>
              </GoldBtn>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
    </div>
  );
}