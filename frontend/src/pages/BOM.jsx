import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowLeftRight, Component, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function BOM() {
  const [pendingItems, setPendingItems] = useState([]);
  const [masterSpareparts, setMasterSpareparts] = useState([]);
  
  const [activeItem, setActiveItem] = useState(null);
  const [isBOMModalOpen, setIsBOMModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  
  const [bomItems, setBomItems] = useState([]);
  const [gradeForm, setGradeForm] = useState({ grade: 'Grade A', jenis_cacat: 'Normal', lokasi_rak: '', tindakan: 'Jual', foto: null });

  const fetchData = async () => {
    try {
      const [pendingRes, sparepartRes] = await Promise.all([
        api.get('/supplies/pending'),
        api.get('/master/sparepart')
      ]);
      setPendingItems(pendingRes.data.data);
      setMasterSpareparts(sparepartRes.data.data);
    } catch (error) {
      console.error("Gagal mengambil data", error);
    }
  };
  
  useEffect(() => { fetchData(); }, []);

  // LOGIKA FILTER CACAT UNIVERSAL SINKRON DATABASE
  const getCacatOptions = (jenisPart, selectedGrade) => {
    if (!masterSpareparts || masterSpareparts.length === 0) return ['Normal'];

    const filteredParts = masterSpareparts.filter(
      p => p.part.toLowerCase() === jenisPart.toLowerCase() && p.grade === selectedGrade
    );

    let extractedCacat = [];
    filteredParts.forEach(p => {
      if (p.jenis_cacat) {
        const splitArr = p.jenis_cacat.split(',').map(s => s.trim()).filter(Boolean);
        extractedCacat.push(...splitArr);
      }
    });

    if (extractedCacat.length === 0) {
      if (selectedGrade === 'Grade A') return ['Normal', 'NEW'];
      return ['(Isi Dulu di Master Data)'];
    }
    
    return [...new Set(extractedCacat)];
  };

  // --- LOGIKA REVERSE BOM ---
  const openBOMProcess = (item) => {
    setActiveItem(item);
    const initialCacatOpts = getCacatOptions('LCD', 'Grade A');
    
    setBomItems([{ 
      id: Date.now(), jenis: 'LCD', brand: item.brand, 
      grade: 'Grade A', jenis_cacat: initialCacatOpts[0], persentase: 0, 
      lokasi_rak: item.lokasi_rak, tindakan: 'Jual', foto: null 
    }]);
    setIsBOMModalOpen(true);
  };

  const handleAddBomItem = () => {
    const initialCacatOpts = getCacatOptions('Baterai', 'Grade A');
    setBomItems([...bomItems, { 
      id: Date.now(), jenis: 'Baterai', brand: activeItem.brand, 
      grade: 'Grade A', jenis_cacat: initialCacatOpts[0], persentase: 0, 
      lokasi_rak: activeItem.lokasi_rak, tindakan: 'Jual', foto: null 
    }]);
  };

  const updateBomItem = (id, field, value) => {
    setBomItems(bomItems.map(item => {
      if (item.id === id) {
        if (field === 'jenis') {
          const newOpts = getCacatOptions(value, item.grade);
          return { ...item, jenis: value, jenis_cacat: newOpts[0] };
        }
        if (field === 'grade') {
          const newOpts = getCacatOptions(item.jenis, value);
          return { ...item, grade: value, jenis_cacat: newOpts[0] };
        }
        return { ...item, [field]: (field === 'persentase' ? Number(value) : value) };
      }
      return item;
    }));
  };

  const handleRemoveBomItem = (id) => setBomItems(bomItems.filter(item => item.id !== id));

  const handleExecuteBOM = async () => {
    if (bomItems.reduce((acc, i) => acc + i.persentase, 0) !== 100) return alert("Total persentase harus 100%!");
    if (bomItems.some(i => i.jenis_cacat === '(Isi Dulu di Master Data)')) return alert("Ada komponen yang belum memiliki jenis cacat valid!");

    const formData = new FormData();
    formData.append('no_order', activeItem.no_order);
    formData.append('modal_induk', activeItem.modal_awal);
    
    const dataTeksKomponen = bomItems.map(item => {
      const { foto, ...rest } = item;
      return { ...rest, nama: `${item.jenis} ${activeItem.nama_barang}` };
    });
    
    formData.append('komponen', JSON.stringify(dataTeksKomponen));
    bomItems.forEach((item, index) => {
      if (item.foto) formData.append(`foto_${index}`, item.foto);
    });

    try {
      await api.post('/bom/execute', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setIsBOMModalOpen(false); 
      fetchData();
    } catch (error) {
      alert("Gagal eksekusi BOM");
    }
  };

  // --- LOGIKA GRADING (NON-UNIT) ---
  const openGradeProcess = (item) => {
    setActiveItem(item);
    const initialCacatOpts = getCacatOptions(item.jenis, 'Grade A');
    setGradeForm({ grade: 'Grade A', jenis_cacat: initialCacatOpts[0], lokasi_rak: item.lokasi_rak, tindakan: 'Jual', foto: null });
    setIsGradeModalOpen(true);
  };

  const handleExecuteGrading = async () => {
    if (gradeForm.jenis_cacat === '(Isi Dulu di Master Data)') return alert("Harap isi Jenis Cacat terlebih dahulu!");

    const formData = new FormData();
    formData.append('no_order', activeItem.no_order);
    formData.append('sku', activeItem.sku);
    formData.append('nama_barang', activeItem.nama_barang);
    formData.append('jenis', activeItem.jenis);
    formData.append('brand', activeItem.brand);
    formData.append('modal_awal', activeItem.modal_awal);
    formData.append('grade', gradeForm.grade);
    formData.append('jenis_cacat', gradeForm.jenis_cacat);
    formData.append('lokasi_rak', gradeForm.lokasi_rak);
    formData.append('tindakan', gradeForm.tindakan);
    if (gradeForm.foto) formData.append('foto', gradeForm.foto);

    try {
      await api.post('/grading/execute', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setIsGradeModalOpen(false); 
      fetchData();
    } catch (error) {
      alert("Gagal eksekusi Grading");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-xl font-bold text-zinc-100 mb-4 flex items-center">
          <ArrowLeftRight className="w-5 h-5 mr-2 text-orange-500" /> Antrean Reverse BOM & Grading
        </h2>
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs border-b border-zinc-800">
            <tr><th className="p-4">SKU / Nama</th><th className="p-4">IMEI</th><th className="p-4">Modal Dasar</th><th className="p-4 text-center">Tindakan</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {pendingItems.map((item) => (
              <tr key={item.no_order} className="hover:bg-zinc-800/40">
                <td className="p-4">
                  <div className="font-mono text-orange-500 font-semibold">{item.sku}</div>
                  <div className="text-zinc-200 mt-0.5">{item.nama_barang}</div>
                  <div className="text-xs text-zinc-500 mt-1 uppercase">{item.jenis} - {item.brand}</div>
                </td>
                <td className="p-4 text-zinc-400 font-mono">{item.imei || '-'}</td>
                <td className="p-4 font-mono font-medium">Rp {Number(item.modal_awal).toLocaleString('id-ID')}</td>
                <td className="p-4 text-center">
                  {item.jenis === 'Unit' ? (
                    <button onClick={() => openBOMProcess(item)} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded text-xs font-semibold shadow-lg">Pecah BOM</button>
                  ) : (
                    <button onClick={() => openGradeProcess(item)} className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded text-xs font-semibold border border-zinc-600">Set Grade</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL PECAH BOM */}
      {isBOMModalOpen && activeItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-6xl flex flex-col max-h-[95vh] shadow-2xl">
            <div className="bg-zinc-950 p-5 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center"><ArrowLeftRight className="w-5 h-5 mr-2 text-orange-500" /> Eksekusi Reverse BOM</h3>
              <button onClick={() => setIsBOMModalOpen(false)} className="text-zinc-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-zinc-900/50">
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg mb-6 flex justify-between items-center">
                <div>
                  <p className="text-orange-500 text-xs font-bold tracking-wider mb-1">DATA UNIT INDUK (SERI)</p>
                  <h4 className="text-xl font-bold text-zinc-100">{activeItem.nama_barang}</h4>
                </div>
                <div className="text-right">
                  <p className="text-orange-500 text-xs font-bold tracking-wider mb-1">TOTAL MODAL ASAL</p>
                  <p className="text-2xl font-mono font-bold text-zinc-100">Rp {Number(activeItem.modal_awal).toLocaleString('id-ID')}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {bomItems.map((item) => {
                  const calcModal = (item.persentase / 100) * Number(activeItem.modal_awal);
                  const cacatList = getCacatOptions(item.jenis, item.grade);

                  return (
                    <div key={item.id} className="flex bg-zinc-950 p-4 rounded-xl border border-zinc-800 shadow-sm relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
                      <div className="flex-1 space-y-4 pl-2 pr-6">
                        <div className="flex items-center gap-2 mb-2 bg-zinc-900 w-fit px-3 py-1.5 rounded-lg border border-zinc-800">
                          <Component className="w-4 h-4 text-orange-500" />
                          <span className="text-zinc-200 font-bold text-sm tracking-wide">{item.jenis} {activeItem.nama_barang}</span>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 mb-1">JENIS PART</label>
                            <select value={item.jenis} onChange={(e) => updateBomItem(item.id, 'jenis', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-2 rounded text-sm focus:border-orange-500 focus:outline-none">
                              <option value="LCD">LCD</option><option value="Baterai">Baterai</option><option value="Frame LCD">Frame LCD</option><option value="List LCD">List LCD</option><option value="Cover Backdoor">Cover Backdoor</option><option value="Lem Advise">Lem Advise</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 mb-1">GRADE QC</label>
                            <select value={item.grade} onChange={(e) => updateBomItem(item.id, 'grade', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-2 rounded text-sm focus:border-orange-500 focus:outline-none">
                              <option value="Grade A">Grade A</option><option value="Grade B">Grade B</option><option value="Grade C">Grade C</option><option value="Grade D">Grade D</option><option value="Bahan">Bahan</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-orange-500 mb-1">JENIS CACAT</label>
                            <select value={item.jenis_cacat} onChange={(e) => updateBomItem(item.id, 'jenis_cacat', e.target.value)} className="w-full bg-zinc-900 border border-orange-900/50 text-orange-100 px-3 py-2 rounded text-sm focus:border-orange-500 focus:outline-none">
                              {cacatList.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 mb-1">TUJUAN TINDAKAN</label>
                            <select value={item.tindakan} onChange={(e) => updateBomItem(item.id, 'tindakan', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-2 rounded text-sm focus:border-orange-500 focus:outline-none">
                              <option value="Jual">Langsung Jual</option><option value="Perbaiki">Masuk Reparasi</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 items-end">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 mb-1">ALOKASI MODAL (%)</label>
                            <div className="relative">
                              <input type="number" min="0" max="100" value={item.persentase} onChange={(e) => updateBomItem(item.id, 'persentase', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-emerald-400 font-bold px-3 py-2 rounded text-sm focus:border-orange-500 focus:outline-none" />
                              <span className="absolute right-3 top-2 text-zinc-500 text-sm">%</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 mb-1">NILAI FINANSIAL (AUTO)</label>
                            <div className="bg-zinc-900/50 border border-zinc-800/50 text-zinc-400 font-mono font-medium px-3 py-2 rounded text-sm">Rp {calcModal.toLocaleString('id-ID')}</div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 mb-1">LOKASI RAK</label>
                            <input type="text" value={item.lokasi_rak} onChange={(e) => updateBomItem(item.id, 'lokasi_rak', e.target.value)} placeholder="Rak..." className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-2 rounded text-sm focus:border-orange-500 focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 mb-1">BUKTI FOTO</label>
                            <input type="file" accept="image/*" onChange={(e) => updateBomItem(item.id, 'foto', e.target.files[0])} className="w-full text-xs text-zinc-400 file:bg-zinc-800 file:hover:bg-zinc-700 file:text-zinc-300 file:border-0 file:py-1.5 file:px-3 file:rounded focus:outline-none" />
                          </div>
                        </div>
                      </div>
                      <div className="w-16 flex flex-col justify-center items-center border-l border-zinc-800/50">
                        <button onClick={() => handleRemoveBomItem(item.id)} className="p-4 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={handleAddBomItem} className="mt-5 w-full border-2 border-dashed border-zinc-700 hover:border-orange-500 hover:bg-orange-500/5 text-zinc-400 hover:text-orange-500 py-3 rounded-xl text-sm font-bold flex justify-center items-center transition-colors"><Plus className="w-5 h-5 mr-2" /> Tambah Part Pecahan</button>
            </div>

            <div className="bg-zinc-950 p-5 border-t border-zinc-800 flex justify-between items-center shrink-0">
              <span className={`text-xl font-bold font-mono ${bomItems.reduce((acc, i) => acc + i.persentase, 0) === 100 ? 'text-emerald-500' : 'text-orange-500'}`}>Total Alokasi: {bomItems.reduce((acc, i) => acc + i.persentase, 0)}%</span>
              <button onClick={handleExecuteBOM} disabled={bomItems.reduce((acc, i) => acc + i.persentase, 0) !== 100} className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded font-bold shadow-lg transition-colors">Konversi & Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GRADING */}
      {isGradeModalOpen && activeItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="bg-zinc-950 p-5 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center"><Component className="w-5 h-5 mr-2 text-orange-500" /> Form Set Grade & Evaluasi Fisik</h3>
              <button onClick={() => setIsGradeModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors"><X className="w-6 h-6"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-zinc-900/50">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 shadow-inner">
                    <div>
                      <p className="text-[10px] text-orange-500 font-bold tracking-wider mb-1">KATEGORI PRODUK</p>
                      <span className="bg-orange-950/40 text-orange-400 text-xs font-semibold px-2.5 py-1 rounded border border-orange-800/50 uppercase">{activeItem.jenis}</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold tracking-wider mb-0.5">SERI / NAMA BARANG</p>
                      <p className="text-zinc-100 font-bold text-lg">{activeItem.nama_barang}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-zinc-900 pt-3">
                      <div>
                        <p className="text-[10px] text-zinc-500 font-bold tracking-wider">BRAND</p>
                        <p className="text-zinc-300 text-sm font-medium">{activeItem.brand}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 font-bold tracking-wider">KODE MANIFES</p>
                        <p className="text-zinc-400 text-xs font-mono mt-0.5">{activeItem.no_order}</p>
                      </div>
                    </div>
                    <div className="border-t border-zinc-900 pt-3">
                      <p className="text-[10px] text-zinc-500 font-bold tracking-wider mb-0.5">MODAL ASAL (TRANSIT)</p>
                      <p className="text-lg font-mono font-bold text-emerald-400">Rp {Number(activeItem.modal_awal).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl space-y-2">
                    <label className="block text-[10px] font-bold text-zinc-400 tracking-wider uppercase">FOTO BUKTI KONDISI FISIK</label>
                    <input type="file" accept="image/*" onChange={(e) => setGradeForm({...gradeForm, foto: e.target.files[0]})} className="w-full text-xs text-zinc-400 file:bg-zinc-900 file:hover:bg-zinc-800 file:text-zinc-300 file:border file:border-zinc-700 file:py-2 file:px-3 file:rounded focus:outline-none" />
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-4 bg-zinc-950/40 border border-zinc-800 p-5 rounded-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 tracking-wider">GRADE KELAYAKAN (QC)</label>
                      <select 
                        value={gradeForm.grade} 
                        onChange={(e) => {
                          const newGrade = e.target.value;
                          const newCacatOpts = getCacatOptions(activeItem.jenis, newGrade);
                          setGradeForm({...gradeForm, grade: newGrade, jenis_cacat: newCacatOpts[0]});
                        }} 
                        className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-2.5 rounded text-sm focus:border-orange-500 focus:outline-none"
                      >
                        <option value="Grade A">Grade A</option>
                        <option value="Grade B">Grade B</option>
                        <option value="Grade C">Grade C</option>
                        <option value="Grade D">Grade D</option>
                        <option value="Bahan">Bahan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-orange-500 mb-1.5 tracking-wider">IDENTIFIKASI JENIS CACAT</label>
                      <select value={gradeForm.jenis_cacat} onChange={(e) => setGradeForm({...gradeForm, jenis_cacat: e.target.value})} className="w-full bg-zinc-950 border border-orange-700 text-orange-200 px-3 py-2.5 rounded text-sm focus:border-orange-500 focus:outline-none">
                        {getCacatOptions(activeItem.jenis, gradeForm.grade).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 tracking-wider">ALUR PROSES SELANJUTNYA</label>
                    <select value={gradeForm.tindakan} onChange={(e) => setGradeForm({...gradeForm, tindakan: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-2.5 rounded text-sm focus:border-orange-500 focus:outline-none">
                      <option value="Jual">Siap Jual (Masuk Etalase Pasar)</option>
                      <option value="Perbaiki">Butuh Perbaikan (Masuk Antrean Lab Reparasi)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 tracking-wider">PENEMPATAN LOKASI RAK BARU</label>
                    <input type="text" value={gradeForm.lokasi_rak} onChange={(e) => setGradeForm({...gradeForm, lokasi_rak: e.target.value})} placeholder="Contoh: Rak B-12Atas" className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-2.5 rounded text-sm focus:border-orange-500 focus:outline-none" />
                  </div>
                  
                  <div className="pt-4">
                    <button onClick={handleExecuteGrading} className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3.5 rounded-lg font-bold shadow-lg transition-colors flex justify-center items-center">
                      <CheckCircle2 className="w-5 h-5 mr-2" /> Sahkan Nilai & Pindahkan ke Stok Master
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}