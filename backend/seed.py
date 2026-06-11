import os
import random
import qrcode
import json
from datetime import date, timedelta
from database import Database

def generate_seeder():
    db = Database()
    
    if not os.path.exists(os.path.join('static', 'qr')):
        os.makedirs(os.path.join('static', 'qr'))
    if not os.path.exists(os.path.join('static', 'uploads')):
        os.makedirs(os.path.join('static', 'uploads'))

    print("♻️  Membersihkan data lama agar struktur sinkron...")
    db.execute_query("SET FOREIGN_KEY_CHECKS = 0;")
    
    # AUTO-FIX STRUKTUR TABEL (Abaikan jika muncul warning duplicate di terminal)
    alter_queries = [
        "ALTER TABLE master_spareparts MODIFY COLUMN grade VARCHAR(20);",
        "ALTER TABLE stocks MODIFY COLUMN grade VARCHAR(20);",
        "ALTER TABLE stocks MODIFY COLUMN status_barang VARCHAR(50) DEFAULT 'Tersedia';",
        "ALTER TABLE purchases ADD COLUMN bukti_bayar VARCHAR(255) NULL;",
        "ALTER TABLE purchases ADD COLUMN items TEXT NULL;",
        "ALTER TABLE purchases ADD COLUMN status_kedatangan VARCHAR(50) DEFAULT 'Pending';",
        "ALTER TABLE sales ADD COLUMN tgl_transaksi DATE NULL AFTER no_invoice;"
    ]
    for query in alter_queries:
        try: db.execute_query(query)
        except Exception: pass

    # MENGHAPUS DATA LAMA
    db.execute_query("DELETE FROM sales_items;")
    db.execute_query("DELETE FROM sales;")
    db.execute_query("DELETE FROM repairs;")
    db.execute_query("DELETE FROM stocks;")
    db.execute_query("DELETE FROM supplies;")
    db.execute_query("DELETE FROM purchases;")
    db.execute_query("DELETE FROM master_spareparts;")
    db.execute_query("DELETE FROM master_shops;")
    db.execute_query("DELETE FROM master_series;")
    db.execute_query("SET FOREIGN_KEY_CHECKS = 1;")

    # 1. MASTER TOKO
    suppliers = ['Batam Sparing', 'Roxy Grosir', 'Maju Jaya Parts', 'iBox Copotan', 'Toko Rongsok JKT']
    for shop in suppliers:
        db.execute_query("INSERT INTO master_shops (nama_toko) VALUES (%s)", (shop,))

    # 2. MASTER CACAT & SPAREPART
    master_defects = {
        'Grade A': ['Normal', 'NEW'],
        'Grade B': ['SHEDOW', 'JARONG', 'SKRIT'],
        'Grade C': ['GARISLINE', 'TOMPEL+GARIS', 'SENTUH SERET'],
        'Grade D': ['PECAH TOMPEL', 'GARIS BANYAK']
    }
    komponen_list = ['LCD', 'Baterai', 'Frame LCD', 'Cover Backdoor']
    
    print("🚀 Menyuntikkan Data Master...")
    for part in komponen_list:
        for grade, defects in master_defects.items():
            for defect in defects:
                db.execute_query("INSERT INTO master_spareparts (part, grade, jenis_cacat) VALUES (%s, %s, %s)", (part, grade, defect))

    # 3. MASTER HP
    samsung_models = ['S26 Ultra', 'Z Fold6', 'A55 5G', 'M54 5G', 'S24']
    hp_data = [('Samsung', model) for model in samsung_models]
    for brand, seri in hp_data:
        db.execute_query("INSERT INTO master_series (jenis_produk, brand, seri, harga_grade_a, harga_grade_d) VALUES (%s, %s, %s, %s, %s)", ('Unit', brand, seri, 2500000, 500000))

    print("🚀 Menyuntikkan 5 Skenario Data Presisi untuk Pengujian UI...")
    
    part_map = {'Unit': 'UNI', 'LCD': 'LCD', 'Baterai': 'BAT', 'Frame LCD': 'FRM', 'Cover Backdoor': 'BCK'}
    pembeli_list = ['Budi Servis', 'Andi Cell', 'Cika Repair', 'Dodi Sparepart', 'Eka Gadget']

    for i in range(1, 6):
        base_date = date(2026, 5, 1) + timedelta(days=i*2)
        supplier_terpilih = suppliers[i-1]
        hp_terpilih = hp_data[i-1]
        brand, seri = hp_terpilih[0], hp_terpilih[1]

        singkatan_seri = seri.upper().replace("5G", "").replace(" ", "").replace("ULTRA", "U").replace("FOLD", "FD")
        suffix = 'G' if '5G' in seri else 'N'

        # --- A. BUAT 1 FAKTUR PURCHASING ---
        no_faktur = f"INV-SUP-100{i}"
        
        skenario_items = [
            {'jenis': 'Unit', 'tujuan': 'BOM', 'harga': 1500000},
            {'jenis': 'LCD', 'tujuan': 'Grading', 'harga': 800000},
            {'jenis': 'Baterai', 'tujuan': 'Repair', 'harga': 150000},
            {'jenis': 'Frame LCD', 'tujuan': 'StokJual', 'harga': 200000},
            {'jenis': 'Cover Backdoor', 'tujuan': 'Sales', 'harga': 100000}
        ]

        invoice_items_json = []
        total_nominal = 0

        for j, sk in enumerate(skenario_items):
            nama_barang = seri if sk['jenis'] == 'Unit' else f"{sk['jenis']} {seri}"
            invoice_items_json.append({
                "id_temp": f"{i}-{j}", "jenis": sk['jenis'], "brand": brand, 
                "seri": seri, "nama_barang": nama_barang, "harga_beli": sk['harga']
            })
            total_nominal += sk['harga']

        db.execute_query(
            """INSERT INTO purchases (no_faktur, tgl_pembelian, supplier, total_nominal, status_bayar, bukti_bayar, items, status_kedatangan) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, 'Barang Tiba')""",
            (no_faktur, base_date, supplier_terpilih, total_nominal, 'Lunas', '', json.dumps(invoice_items_json))
        )

        # --- B. BUAT KEDATANGAN BARANG ---
        tgl_masuk = base_date + timedelta(days=1)
        
        for idx, sk in enumerate(skenario_items):
            no_order = f"ARR-{no_faktur}-{idx+1}"
            sku = f"{part_map[sk['jenis']]}-{singkatan_seri}{suffix}-{random.randint(1000,9999)}-{i}"
            nama_barang = seri if sk['jenis'] == 'Unit' else f"{sk['jenis']} {seri}"
            
            status_proses = 'Pending' if sk['tujuan'] in ['BOM', 'Grading'] else 'Selesai'

            db.execute_query(
                """INSERT INTO supplies 
                   (no_order, tgl_masuk, supplier, status_bayar, jenis, brand, sku, imei, nama_barang, modal_awal, lokasi_toko, lokasi_rak, status_proses, foto) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (no_order, tgl_masuk, supplier_terpilih, 'Lunas', sk['jenis'], brand, sku, 
                 f"35{random.randint(1000000000000, 9999999999999)}" if sk['jenis'] == 'Unit' else "", 
                 nama_barang, sk['harga'], "Gudang Pusat", f"Rak {sk['tujuan']}", status_proses, "")
            )

            # --- C. MASUKKAN KE STOK JIKA SUDAH SELESAI ---
            if status_proses == 'Selesai':
                id_stock = f"STK-{sku}"
                qr = qrcode.make(id_stock)
                qr_filename = f"{id_stock}.png"
                qr.save(os.path.join('static', 'qr', qr_filename))
                
                tindakan = 'Perbaiki' if sk['tujuan'] == 'Repair' else 'Jual'
                status_barang = 'Terjual' if sk['tujuan'] == 'Sales' else 'Tersedia'
                grade = 'Grade C' if sk['tujuan'] == 'Repair' else 'Grade A'
                
                db.execute_query(
                    """INSERT INTO stocks 
                       (id_stock, no_order, nama_barang, jenis, brand, grade, jenis_cacat, modal_awal, total_modal, lokasi_rak, tindakan, qr_code, foto, status_barang) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (id_stock, no_order, nama_barang, sk['jenis'], brand, grade, 'Normal', sk['harga'], sk['harga'], f"Rak-{i}", tindakan, f"/static/qr/{qr_filename}", "", status_barang)
                )

                # --- D. BUAT DATA PENJUALAN ---
                if sk['tujuan'] == 'Sales':
                    tgl_jual = tgl_masuk + timedelta(days=2)
                    no_invoice_jual = f"INV-OUT-500{i}"
                    harga_jual = sk['harga'] + 50000 
                    
                    db.execute_query(
                        """INSERT INTO sales (no_invoice, tgl_transaksi, nama_pembeli, no_order_marketplace, sumber_penjualan, total_item, total_bayar, metode_pembayaran)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                        (no_invoice_jual, tgl_jual, pembeli_list[i-1], '', 'Toko Offline', 1, harga_jual, 'Tunai')
                    )
                    
                    # SOLUSI ERROR: Menggunakan fetch_all karena fetch_one tidak tersedia
                    cek_id = db.fetch_all(f"SELECT id_sales FROM sales WHERE no_invoice = '{no_invoice_jual}'")
                    id_sales = cek_id[0]['id_sales']
                    
                    db.execute_query(
                        "INSERT INTO sales_items (id_sales, id_stock, harga_jual_aktual) VALUES (%s, %s, %s)",
                        (id_sales, id_stock, harga_jual)
                    )

    print("\n✅ SEEDING SELESAI!")

if __name__ == "__main__":
    generate_seeder()