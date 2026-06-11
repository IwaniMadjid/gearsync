import os
import random
import qrcode
from datetime import date, timedelta
from database import Database

def generate_seeder():
    db = Database()
    
    if not os.path.exists(os.path.join('static', 'qr')):
        os.makedirs(os.path.join('static', 'qr'))

    print("♻️  Membersihkan data lama agar struktur sinkron...")
    db.execute_query("SET FOREIGN_KEY_CHECKS = 0;")
    
    # =========================================================
    # PERBAIKAN: Paksa MySQL memperlebar kolom grade agar menerima 'Bahan'
    # =========================================================
    print("🛠️  Memperbarui struktur tabel database (Upgrade kolom grade)...")
    try:
        # Mengubah ENUM/VARCHAR ketat menjadi VARCHAR longgar (20 karakter)
        db.execute_query("ALTER TABLE master_spareparts MODIFY COLUMN grade VARCHAR(20);")
        db.execute_query("ALTER TABLE stocks MODIFY COLUMN grade VARCHAR(20);")
    except Exception as e:
        print(f"Note struktur: {e}")

    db.execute_query("DELETE FROM repairs;")
    db.execute_query("DELETE FROM stocks;")
    db.execute_query("DELETE FROM supplies;")
    db.execute_query("DELETE FROM master_spareparts;")
    db.execute_query("DELETE FROM master_shops;")
    db.execute_query("DELETE FROM master_series;")
    db.execute_query("SET FOREIGN_KEY_CHECKS = 1;")

    # 1. Suntik Data Master Toko / Supplier
    suppliers = ['Batam Sparing', 'Roxy Grosir', 'Maju Jaya Parts', 'iBox Copotan', 'Toko Rongsok JKT']
    for shop in suppliers:
        db.execute_query("INSERT INTO master_shops (nama_toko) VALUES (%s)", (shop,))

    # 2. KAMUS CACAT MASTER (MURNI 100% BERDASARKAN FOTO ANDA)
    master_defects = {
        'Grade A': ['Normal', 'NEW'],
        'Grade B': ['KERUT', 'SHEDOW', 'JARONG', 'RETAK', 'TOMPEL', 'RETAK + GREEN', 'RETAK JARONG', 'RETAK TOMPEL', 'RETAK SHADOW', 'SHADOW TOMPEL', 'SKRIT', 'Tompel Kerut', 'GARIS KASAT MATA'],
        'Grade C': ['GARISLINE', 'GARIS LEBIH DARI 2', 'TOMPEL+GARIS', 'RETAK TOMPEL FLIKER', 'SENTUH SERET', 'RETAK GARIS', 'SHADOW GARIS', 'GARIS SENTUH', 'RETAK SENTUH SERET', 'RETAK SENTUH SHADOW', 'RETAK GARIS SHADOW', 'RETAK GARIS TOMPEL SENTUH', 'RETAK TOMPEL SENTUH', 'RETAK SENTUH', 'SHADOW SENTUH', 'GARIS SHADOW TOMPEL', 'TOMPEL SENTUH', 'GARIS JARONG', 'GARIS TOMPEL FX', 'RETAK GARIS TOMPEL', 'GARIS TOMPEL SENTUH', 'GARIS SHADOW SENTUH', 'Garis GreenScreen', 'Garis AOD', 'Tompel Garis Greenscreen', 'TOMPEL GARIS JARONG', 'TOMPEL LEBIH DARI 2', 'GARIS 2', 'GARIS + SENTUH SERET', 'TOMPEL KECIL + SHADOW'],
        'Bahan': ['BAHAN FLEXI', 'BAHAN JEMPER', 'BAHAN SOKET', 'BAHAN BONDING'],
        'Grade D': ['PECAH TOMPEL', 'PECAH GARIS', 'GARIS BANYAK', 'GARIS TOMPEL', 'GARIS BANYAK + RETAK', 'GARIS RETAK JARONG']
    }

    komponen_list = ['LCD', 'Baterai', 'Frame LCD', 'List LCD', 'Cover Backdoor', 'Lem Advise']

    print("🚀 Menyuntikkan Kamus Cacat Universal Sesuai Foto...")
    for part in komponen_list:
        for grade, defects in master_defects.items():
            for defect in defects:
                db.execute_query("INSERT INTO master_spareparts (part, grade, jenis_cacat) VALUES (%s, %s, %s)", (part, grade, defect))

    # 3. KATALOG MURNI SAMSUNG
    samsung_models = [
        'S26', 'S26+', 'S26 Ultra', 'S25', 'S25+', 'S25 Ultra', 'S24', 'S24+', 'S24 Ultra', 'S24 FE',
        'S23', 'S23+', 'S23 Ultra', 'S23 FE', 'S22', 'S22+', 'S22 Ultra', 'S21', 'S21+', 'S21 Ultra', 'S21 FE',
        'Z Fold7', 'Z Flip7', 'Z Fold6', 'Z Flip6', 'Z Fold5', 'Z Flip5', 'Z Fold4', 'Z Flip4', 'Z Fold3', 'Z Flip3',
        'A57 5G', 'A37 5G', 'A26 5G', 'A17 5G', 'A56 5G', 'A36 5G', 'A16 5G/LTE', 'A06', 'A55 5G', 'A35 5G',
        'A25 5G', 'A15 5G/LTE', 'A05', 'A05s', 'A54 5G', 'A34 5G', 'A24', 'A14 5G/LTE', 'A04', 'A04s', 'A04e',
        'A73 5G', 'A53 5G', 'A33 5G', 'A23 5G/LTE', 'A13', 'A03', 'A03s', 'A03 Core', 'A72', 'A52', 'A52 5G',
        'A52s 5G', 'A32', 'A32 5G', 'A22', 'A22 5G', 'A12', 'A02', 'A02s',
        'M55', 'M35', 'M15', 'M05', 'M54 5G', 'M34 5G', 'M14 5G', 'M53 5G', 'M33 5G', 'M23 5G', 'M13',
        'M52 5G', 'M32', 'M22', 'M12', 'M62', 'M51', 'M21'
    ]

    hp_data = [('Samsung', model) for model in samsung_models]

    for brand, seri in hp_data:
        db.execute_query("INSERT INTO master_series (jenis_produk, brand, seri, harga_grade_a, harga_grade_d) VALUES (%s, %s, %s, %s, %s)", ('Unit', brand, seri, random.randint(15, 50)*100000, random.randint(1, 5)*100000))
        for komp in komponen_list:
            db.execute_query("INSERT INTO master_series (jenis_produk, brand, seri, harga_grade_a, harga_grade_d) VALUES (%s, %s, %s, %s, %s)", (komp, brand, seri, random.randint(5, 15)*100000, random.randint(1, 3)*50000))

    # 4. Suntik 100 Transaksi Simulasi Alur Kerja ERP
    print("🚀 Menyuntikkan 100 data transaksi simulasi baru...")
    jenis_pilihan_realistis = ['Unit', 'LCD', 'Baterai', 'Frame LCD', 'List LCD', 'Cover Backdoor', 'Lem Advise']
    status_bayar_list = ['ready', 'lunas', 'belumlunas', 'tempo']
    
    part_map = {
        'Unit': 'UNI', 'LCD': 'LCD', 'Baterai': 'BAT',
        'Frame LCD': 'FRM', 'List LCD': 'LST', 'Cover Backdoor': 'BCK', 'Lem Advise': 'LEM'
    }
    
    for i in range(1, 101):
        tgl_masuk = date(2026, 1, 1) + timedelta(days=random.randint(0, 149)) 
        supplier = random.choice(suppliers)
        status_bayar = random.choice(status_bayar_list)
        
        selected_hp = random.choice(hp_data)
        brand, seri = selected_hp[0], selected_hp[1]
        jenis = random.choice(jenis_pilihan_realistis)
        
        kode_part = part_map.get(jenis, 'GEN')
        
        seri_upper = seri.upper().replace(" ", "")
        jaringan_suffix = 'N'
        if '5G' in seri_upper:
            jaringan_suffix = 'G'
        elif 'LTE' in seri_upper:
            jaringan_suffix = 'L'
            
        singkatan_seri = seri_upper.replace("5G", "").replace("LTE", "").replace("/", "")
        singkatan_seri = singkatan_seri.replace("ULTRA", "U").replace("+", "P").replace("FOLD", "FD").replace("FLIP", "FP")
        
        sku = f"{kode_part}-{singkatan_seri}{jaringan_suffix}-{random.randint(1000, 9999)}-{i}"
        imei = f"35{random.randint(1000000000000, 9999999999999)}" if jenis == 'Unit' else ""
        nama_barang = seri if jenis == 'Unit' else f"{jenis} {seri}"
        modal_awal = random.randint(5, 45) * 100000
        no_order = f"ORD-2026-{i:03d}"
        
        is_processed = random.random() < 0.75
        status_proses = 'Selesai' if is_processed else 'Pending'

        db.execute_query(
            "INSERT INTO supplies (no_order, tgl_masuk, supplier, status_bayar, jenis, brand, sku, imei, nama_barang, modal_awal, lokasi_toko, lokasi_rak, status_proses, foto) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (no_order, tgl_masuk, supplier, status_bayar, jenis, brand, sku, imei, nama_barang, modal_awal, "Gudang Pusat", "Rak Transit", status_proses, "")
        )

        if is_processed:
            jenis_stok = jenis
            nama_stok = nama_barang
            
            if jenis_stok == 'Unit':
                jenis_stok = 'LCD'
                nama_stok = f"LCD {seri}"
            
            grade_pilihan = random.choice(['Grade A', 'Grade B', 'Grade C', 'Grade D', 'Bahan'])
            cacat_terpilih = random.choice(master_defects[grade_pilihan])
            
            id_stock = f"STK-{sku}"
            lokasi_rak = f"Rak {random.choice(['A', 'B', 'C'])}-{random.randint(1, 10)}"
            tindakan = random.choice(['Jual', 'Perbaiki'])
            
            qr = qrcode.make(id_stock)
            qr_filename = f"{id_stock}.png"
            qr.save(os.path.join('static', 'qr', qr_filename))
            qr_path_db = f"/static/qr/{qr_filename}"
            
            db.execute_query(
                "INSERT INTO stocks (id_stock, no_order, nama_barang, jenis, brand, grade, jenis_cacat, modal_awal, total_modal, lokasi_rak, tindakan, qr_code, foto) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (id_stock, no_order, nama_stok, jenis_stok, brand, grade_pilihan, cacat_terpilih, modal_awal, modal_awal, lokasi_rak, tindakan, qr_path_db, "")
            )

    print("\n✅ SEEDING BERHASIL! Struktur tabel otomatis disesuaikan dan data tersimpan tanpa error!")

if __name__ == "__main__":
    generate_seeder()