import React, { useState, useEffect } from 'react';
import { Database, Smartphone, Store, Warehouse, Settings, Plus, Trash2, Activity } from 'lucide-react';
import api from '../services/api';
import { T, Card, CardHeader, Field, Input, Select, GoldBtn, ModalOverlay, ModalBox, ModalHeader, THead } from './ui';

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

  // --- LOGIKA HEADER TABEL DINAMIS (Menggunakan komponen THead) ---
  const getTableColumns = () => {
    switch (activeTab) {
      case 'hp': return ['Brand & Seri', 'Jenis Part', {label: 'Harga Jual (A)', align: 'right'}, {label: 'Harga Jual (D)', align: 'right'}, {label: 'Aksi', align: 'center'}];
      case 'sparepart': return ['Nama Part', {label: 'Grade', align: 'center'}, 'Jenis Cacat Spesifik', {label: 'Aksi', align: 'center'}];
      case 'toko': return ['Nama Toko / Supplier', {label: 'Aksi', align: 'center'}];
      case 'gudang': return ['Lokasi / Kode Gudang', {label: 'Aksi', align: 'center'}];
      default: return [];
    }
  };

  // --- LOGIKA ISI BARIS TABEL DINAMIS ---
  const renderTableRow = (item) => {
    switch (activeTab) {
      case 'hp':
        return (
          <>
            <td style={{ padding: '12px 16px', color: T.textPri, fontWeight: 500 }}>{item.brand} {item.seri}</td>
            <td style={{ padding: '12px 16px' }}>
              <span style={{ fontSize: '0.65rem', background: `${T.gold}20`, color: T.gold, padding: '4px 8px', borderRadius: 4, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {item.jenis_produk}
              </span>
            </td>
            <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: T.jade, fontWeight: 500 }}>Rp {Number(item.harga_grade_a).toLocaleString('id-ID')}</td>
            <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: T.ember, fontWeight: 500 }}>Rp {Number(item.harga_grade_d).toLocaleString('id-ID')}</td>
          </>
        );
      case 'sparepart':
        return (
          <>
            <td style={{ padding: '12px 16px', color: T.textPri, fontWeight: 500 }}>{item.part}</td>
            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', background: T.overlay, color: T.textPri, padding: '4px 8px', borderRadius: 4, fontWeight: 600, border: `1px solid ${T.border}` }}>
                {item.grade}
              </span>
            </td>
            <td style={{ padding: '12px 16px', color: T.textSec, fontSize: '0.85rem' }}>{item.jenis_cacat}</td>
          </>
        );
      case 'toko':
        return <td style={{ padding: '12px 16px', color: T.textPri, fontWeight: 500 }}>{item.nama_toko}</td>;
      case 'gudang':
        return <td style={{ padding: '12px 16px', color: T.textPri, fontWeight: 500 }}>{item.nama_gudang}</td>;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Navigasi Tab */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
              style={{ 
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', 
                borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'all 0.2s',
                background: isActive ? T.gold : T.raised,
                color: isActive ? '#000' : T.textSec,
                border: `1px solid ${isActive ? T.gold : T.border}`,
                boxShadow: isActive ? `0 2px 10px ${T.gold}40` : 'none'
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      <Card>
        <div style={{ padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${T.border}` }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.textPri, fontWeight: 600, fontSize: '0.95rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            <Database size={16} color={T.gold} /> Data Tersimpan
          </h3>
          <GoldBtn onClick={() => setIsModalOpen(true)} style={{ padding: '8px 16px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Tambah Data
          </GoldBtn>
        </div>
        
        <div style={{ overflowX: 'auto', minHeight: 400 }}>
          {isLoading ? (
            <div style={{ padding: 60, display: 'flex', justifyContent: 'center', color: T.gold }}><Activity size={32} className="animate-spin" /></div>
          ) : dataList.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: T.textMut, fontSize: '0.85rem' }}>Belum ada data di tabel ini.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
              <THead cols={getTableColumns()} />
              <tbody>
                {dataList.map((item) => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.raised}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {renderTableRow(item)}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: T.textMut, cursor: 'pointer', padding: 6, transition: 'color 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = T.ember; }}
                        onMouseLeave={e => { e.currentTarget.style.color = T.textMut; }}
                        title="Hapus Data">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* MODAL FORM TAMBAH DATA */}
      {isModalOpen && (
        <ModalOverlay onClose={() => setIsModalOpen(false)}>
          <ModalBox style={{ maxWidth: activeTab === 'hp' ? 700 : 500 }}>
            <ModalHeader title="Tambah Data Master" onClose={() => setIsModalOpen(false)} />
            
            <div style={{ padding: 22, overflowY: 'auto', maxHeight: '75vh' }}>
              <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {activeTab === 'hp' && (
                  <>
                    <Field label="Jenis Produk">
                      <Select value={formData.jenis_produk || 'Unit'} onChange={(e) => setFormData({...formData, jenis_produk: e.target.value})}>
                        <option value="Unit">Unit (Dipecah 6 Komponen)</option>
                        <option value="LCD">LCD Saja</option>
                        <option value="Baterai">Baterai Saja</option>
                        <option value="Frame LCD">Frame LCD</option>
                        <option value="List LCD">List LCD</option>
                        <option value="Cover Backdoor">Cover Backdoor</option>
                        <option value="Lem Advise">Lem Advise</option>
                      </Select>
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <Field label="Brand"><Input value={formData.brand || ''} onChange={(e) => setFormData({...formData, brand: e.target.value})} placeholder="Samsung..." required /></Field>
                      <Field label="Seri"><Input value={formData.seri || ''} onChange={(e) => setFormData({...formData, seri: e.target.value})} placeholder="S26 Ultra..." required /></Field>
                    </div>

                    {formData.jenis_produk === 'Unit' ? (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <p style={{ fontSize: '0.65rem', color: T.gold, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>Tentukan Harga Jual Ke-6 Komponen</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '4fr 4fr 4fr', gap: 12, fontSize: '0.65rem', color: T.textMut, fontWeight: 600, letterSpacing: '0.05em' }}>
                          <div>NAMA PART</div><div style={{ textAlign: 'center' }}>HARGA GRADE A</div><div style={{ textAlign: 'center' }}>HARGA GRADE D</div>
                        </div>
                        
                        {KOMPONEN_UNIT.map((part) => (
                          <div key={part} style={{ display: 'grid', gridTemplateColumns: '4fr 4fr 4fr', gap: 12, alignItems: 'center', background: T.raised, padding: 8, borderRadius: 4, border: `1px solid ${T.border2}` }}>
                            <div style={{ fontSize: '0.8rem', color: T.textPri, fontWeight: 500 }}>{part}</div>
                            <Input type="number" placeholder="Rp Grade A" value={formData.harga_parts?.[part]?.a || ''} onChange={(e) => {
                              setFormData(prev => ({...prev, harga_parts: {...prev.harga_parts, [part]: {...prev.harga_parts[part], a: e.target.value}}}));
                            }} style={{ color: T.jade, fontFamily: 'JetBrains Mono, monospace' }} required />
                            <Input type="number" placeholder="Rp Grade D" value={formData.harga_parts?.[part]?.d || ''} onChange={(e) => {
                              setFormData(prev => ({...prev, harga_parts: {...prev.harga_parts, [part]: {...prev.harga_parts[part], d: e.target.value}}}));
                            }} style={{ color: T.ember, fontFamily: 'JetBrains Mono, monospace' }} required />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ marginTop: 8, paddingTop: 16, borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <Field label="Harga Jual Grade A (Rp)" gold>
                          <Input type="number" value={formData.harga_grade_a || ''} onChange={(e) => setFormData({...formData, harga_grade_a: e.target.value})} placeholder="1500000" style={{ color: T.jade, fontFamily: 'JetBrains Mono, monospace' }} required />
                        </Field>
                        <Field label="Harga Jual Grade D (Rp)">
                          <Input type="number" value={formData.harga_grade_d || ''} onChange={(e) => setFormData({...formData, harga_grade_d: e.target.value})} placeholder="200000" style={{ color: T.ember, fontFamily: 'JetBrains Mono, monospace' }} required />
                        </Field>
                      </div>
                    )}
                  </>
                )}
                
                {activeTab === 'sparepart' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <Field label="Nama Part"><Input value={formData.part || ''} onChange={(e) => setFormData({...formData, part: e.target.value})} placeholder="LCD, Baterai..." required /></Field>
                      <Field label="Grade QC">
                        <Select value={formData.grade || 'Grade B'} onChange={(e) => setFormData({...formData, grade: e.target.value})}>
                          <option value="Grade A">Grade A</option><option value="Grade B">Grade B</option><option value="Grade C">Grade C</option><option value="Grade D">Grade D</option>
                        </Select>
                      </Field>
                    </div>
                    <Field label="Jenis Cacat / Kerusakan">
                      <textarea value={formData.jenis_cacat || ''} onChange={(e) => setFormData({...formData, jenis_cacat: e.target.value})} placeholder="Retak kaca, tompel layar..." rows="3" required
                        style={{ width: '100%', background: T.overlay, border: `1px solid ${T.border}`, color: T.textPri, borderRadius: 4, padding: '10px 14px', fontSize: '0.85rem', outline: 'none', resize: 'vertical' }}
                      />
                    </Field>
                  </>
                )}

                {activeTab === 'toko' && (
                  <Field label="Nama Toko / Supplier"><Input value={formData.nama_toko || ''} onChange={(e) => setFormData({...formData, nama_toko: e.target.value})} placeholder="Shopee King Sparepart" required /></Field>
                )}

                {activeTab === 'gudang' && (
                  <Field label="Kode / Lokasi Gudang"><Input value={formData.nama_gudang || ''} onChange={(e) => setFormData({...formData, nama_gudang: e.target.value})} placeholder="Warehouse A" required /></Field>
                )}

                <GoldBtn type="submit" style={{ marginTop: 16, padding: '12px', justifyContent: 'center' }}>
                  Simpan Master Data
                </GoldBtn>

              </form>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
    </div>
  );
}