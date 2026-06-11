import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from flask import request, jsonify
from datetime import datetime

from database import Database
from models import Supply
from services import InventoryService

app = Flask(__name__, static_folder='static')
CORS(app)

db = Database()
inventory_service = InventoryService(db)

# Pastikan folder uploads ada
if not os.path.exists(os.path.join('static', 'uploads')):
    os.makedirs(os.path.join('static', 'uploads'))

# --- PINTU GET: Untuk Mengambil Data Kedatangan Barang ---
@app.route('/api/supplies', methods=['GET'])
def get_supplies():
    try:
        supplies = inventory_service.get_all_supplies()
        return jsonify({"status": "success", "data": supplies}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# --- PINTU POST: Untuk Menyimpan Barang Baru (beserta Foto) ---
@app.route('/api/supplies', methods=['POST'])
def add_supply():
    try:
        req = request.form
        foto_path = ''
        
        # Simpan file gambar jika diunggah
        if 'foto' in request.files:
            file = request.files['foto']
            if file.filename != '':
                filename = secure_filename(file.filename)
                filepath = os.path.join('static', 'uploads', filename)
                file.save(filepath)
                foto_path = f'/static/uploads/{filename}'
        
        # Buat objek supply
        new_supply = Supply(
            no_order=req.get('no_order'),
            tgl_masuk=req.get('tgl_masuk'),
            supplier=req.get('supplier'),
            status_bayar=req.get('status_bayar'),
            jenis=req.get('jenis'),
            brand=req.get('brand'),
            sku=req.get('sku'),
            imei=req.get('imei'),
            nama_barang=req.get('nama_barang'),
            modal_awal=req.get('modal_awal'),
            lokasi_toko=req.get('lokasi_toko'),
            lokasi_rak=req.get('lokasi_rak'),
            status_proses=req.get('status_proses', 'Pending')
        )
        
        if inventory_service.add_supply(new_supply, foto_path):
            return jsonify({"status": "success"}), 201
        return jsonify({"status": "error", "message": "Gagal menyimpan data."}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/supplies/pending', methods=['GET'])
def get_pending():
    return jsonify({"status": "success", "data": inventory_service.get_pending_supplies()})

# --- REVERSE BOM DENGAN DUKUNGAN FOTO (FORM DATA) ---
@app.route('/api/bom/execute', methods=['POST'])
def execute_bom():
    try:
        no_order = request.form.get('no_order')
        modal_induk = request.form.get('modal_induk')
        komponen_str = request.form.get('komponen')
        komponen = json.loads(komponen_str)

        # Proses file foto jika ada
        for i, comp in enumerate(komponen):
            file_key = f'foto_{i}'
            if file_key in request.files:
                file = request.files[file_key]
                if file.filename != '':
                    filename = secure_filename(file.filename)
                    filepath = os.path.join('static', 'uploads', filename)
                    file.save(filepath)
                    comp['foto_path'] = f'/static/uploads/{filename}'
            else:
                comp['foto_path'] = ''

        if inventory_service.execute_reverse_bom(no_order, modal_induk, komponen):
            return jsonify({"status": "success"}), 200
        return jsonify({"status": "error", "message": "Gagal menyimpan BOM."}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# --- GRADING DENGAN DUKUNGAN FOTO (FORM DATA) ---
@app.route('/api/grading/execute', methods=['POST'])
def execute_grading():
    try:
        req = request.form
        foto_path = ''
        
        if 'foto' in request.files:
            file = request.files['foto']
            if file.filename != '':
                filename = secure_filename(file.filename)
                filepath = os.path.join('static', 'uploads', filename)
                file.save(filepath)
                foto_path = f'/static/uploads/{filename}'

        if inventory_service.execute_grading(
            req.get('no_order'), req.get('sku'), req.get('nama_barang'), 
            req.get('jenis'), req.get('brand'), req.get('modal_awal'), 
            req.get('grade'), req.get('jenis_cacat'), req.get('lokasi_rak'), req.get('tindakan'), foto_path
        ):
            return jsonify({"status": "success"}), 200
        return jsonify({"status": "error", "message": "Gagal Grading."}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/repairs/pending', methods=['GET'])
def get_repairs():
    return jsonify({"status": "success", "data": inventory_service.get_repairable_stocks()})

# --- REPARASI DENGAN DUKUNGAN FOTO (FORM DATA) ---
@app.route('/api/repairs/execute', methods=['POST'])
def execute_repair():
    try:
        req = request.form
        foto_path = ''
        
        if 'foto' in request.files:
            file = request.files['foto']
            if file.filename != '':
                filename = secure_filename(file.filename)
                filepath = os.path.join('static', 'uploads', filename)
                file.save(filepath)
                foto_path = f'/static/uploads/{filename}'

        if inventory_service.process_repair(
            req.get('id_stock'), req.get('tambahan_biaya'), req.get('catatan', ''), 
            req.get('grade_sebelum'), req.get('lokasi_rak_baru'), req.get('grade_sesudah'), foto_path
        ):
            return jsonify({"status": "success"}), 200
        return jsonify({"status": "error", "message": "Gagal Reparasi."}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================
# ENDPOINTS MASTER DATA (CRUD)
# ==========================================
MASTER_TABLES = {
    'hp': 'master_series',
    'sparepart': 'master_spareparts',
    'toko': 'master_shops',
    'gudang': 'master_warehouses',
    'harga': 'master_prices'
}

# --- PINTU GET: Mengambil Daftar Master Data ---
@app.route('/api/master/<kategori>', methods=['GET'])
def get_master_data(kategori):
    tabel = MASTER_TABLES.get(kategori)
    if not tabel:
        return jsonify({"error": "Kategori tidak valid"}), 400
    
    db = Database()
    data = db.fetch_all(f"SELECT * FROM {tabel}")
    return jsonify({"data": data}), 200

# --- PINTU POST: Menyimpan Master Data Baru (Termasuk Pemecahan Unit) ---
@app.route('/api/master/<kategori>', methods=['POST'])
def add_master_data(kategori):
    tabel = MASTER_TABLES.get(kategori)
    if not tabel:
        return jsonify({"error": "Kategori tidak valid"}), 400
    
    data = request.json
    db = Database()
    
    if kategori == 'hp':
        jenis_produk = data.get('jenis_produk', '')
        brand = data.get('brand')
        seri = data.get('seri')

        # Logika jika input "Unit" (Membaca harga per komponen)
        if jenis_produk.lower() == 'unit':
            harga_parts = data.get('harga_parts', {})
            komponen_list = ['LCD', 'Baterai', 'Frame LCD', 'List LCD', 'Cover Backdoor', 'Lem Advise']
            
            for komp in komponen_list:
                # Ambil harga per komponen dari dictionary, default 0 jika kosong
                harga_a = harga_parts.get(komp, {}).get('a', 0)
                harga_d = harga_parts.get(komp, {}).get('d', 0)
                
                db.execute_query(
                    "INSERT INTO master_series (jenis_produk, brand, seri, harga_grade_a, harga_grade_d) VALUES (%s, %s, %s, %s, %s)",
                    (komp, brand, seri, harga_a, harga_d)
                )
        else:
            # Jika bukan unit, simpan 1 harga saja seperti biasa
            harga_a = data.get('harga_grade_a', 0)
            harga_d = data.get('harga_grade_d', 0)
            db.execute_query(
                "INSERT INTO master_series (jenis_produk, brand, seri, harga_grade_a, harga_grade_d) VALUES (%s, %s, %s, %s, %s)",
                (jenis_produk, brand, seri, harga_a, harga_d)
            )

    elif kategori == 'sparepart':
        db.execute_query(
            "INSERT INTO master_spareparts (part, grade, jenis_cacat) VALUES (%s, %s, %s)",
            (data.get('part'), data.get('grade'), data.get('jenis_cacat'))
        )
    elif kategori == 'toko':
        db.execute_query("INSERT INTO master_shops (nama_toko) VALUES (%s)", (data.get('nama_toko'),))
    elif kategori == 'gudang':
        db.execute_query("INSERT INTO master_warehouses (nama_gudang) VALUES (%s)", (data.get('nama_gudang'),))
    elif kategori == 'harga':
        db.execute_query("INSERT INTO master_prices (grade, harga) VALUES (%s, %s)", (data.get('grade'), data.get('harga')))
        
    return jsonify({"status": "success"}), 201

# --- PINTU DELETE: Menghapus Master Data ---
@app.route('/api/master/<kategori>/<int:id>', methods=['DELETE'])
def delete_master_data(kategori, id):
    tabel = MASTER_TABLES.get(kategori)
    if not tabel:
        return jsonify({"error": "Kategori tidak valid"}), 400
        
    db = Database()
    db.execute_query(f"DELETE FROM {tabel} WHERE id = %s", (id,))
    return jsonify({"status": "success"}), 200

@app.route('/api/stocks', methods=['GET'])
def get_all_stocks():
    db = Database()
    
    # Taruh Kodenya di Sini
    query = """
        SELECT 
            st.*, 
            sp.foto AS foto_datang, 
            sp.tgl_masuk,
            sp.lokasi_toko,            -- INI TAMBAHANNYA
            sp.status_bayar,           -- INI TAMBAHANNYA
            sp.imei AS imei_asal,      -- INI TAMBAHANNYA
            DATEDIFF(CURRENT_DATE, sp.tgl_masuk) AS umur_stok,
            (SELECT rp.foto_setelah FROM repairs rp 
             WHERE rp.id_stock = st.id_stock 
             LIMIT 1) AS foto_reparasi
        FROM stocks st
        JOIN supplies sp ON st.no_order = sp.no_order
    """
    
    try:
        # Jalankan query menggunakan method select/fetch yang ada di database.py Anda
        stocks_data = db.fetch_all(query) # atau db.execute_query(query) tergantung class Anda
        return jsonify({"status": "success", "data": stocks_data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/api/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    db = Database()
    
    # 1. Query untuk angka total card atas
    query_cards = """
        SELECT 
            COUNT(*) as total_stok,
            IFNULL(SUM(total_modal), 0) as total_modal
        FROM stocks;
    """
    
    # 2. Query untuk list 4 produk stok tertua (Sesuai Request)
    query_oldest = """
        SELECT 
            st.id_stock,
            st.nama_barang,
            st.grade,
            st.lokasi_rak,
            DATEDIFF(CURRENT_DATE, sp.tgl_masuk) AS umur_stok
        FROM stocks st
        JOIN supplies sp ON st.no_order = sp.no_order
        ORDER BY umur_stok DESC
        LIMIT 4;
    """
    
    try:
        cards_data = db.fetch_one(query_cards)
        oldest_data = db.fetch_all(query_oldest)
        
        return jsonify({
            "status": "success",
            "data": {
                "total_stok": cards_data['total_stok'],
                "total_modal": cards_data['total_modal'],
                "stok_tertua": oldest_data # Berisi array 4 data produk terlama
            }
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    

@app.route('/api/sales', methods=['POST'])
def create_sale():
    db = Database()
    data = request.json
    
    # 1. Ambil data header nota
    no_invoice = data.get('no_invoice') # Generate dari frontend atau backend (contoh: INV-2606-001)
    nama_pembeli = data.get('nama_pembeli', '')
    no_order_marketplace = data.get('no_order_marketplace', '')
    sumber_penjualan = data.get('sumber_penjualan') # 'Offline', 'Shopee', dll
    metode_pembayaran = data.get('metode_pembayaran')
    items = data.get('items', []) # List of object: [{id_stock: 'STK-LCD...', harga_jual_aktual: 500000}]
    
    if not items:
        return jsonify({"status": "error", "message": "Keranjang belanja kosong!"}), 400

    total_item = len(items)
    total_bayar = sum(float(item['harga_jual_aktual']) for item in items)
    
    try:
        # Matikan auto-commit sementara jika class DB Anda mendukung transaction (opsional, tapi bagus untuk keamanan)
        db.execute_query("SET autocommit = 0;")
        db.execute_query("START TRANSACTION;")
        
        # 2. Simpan Header Penjualan
        query_sales = """
            INSERT INTO sales (no_invoice, nama_pembeli, no_order_marketplace, sumber_penjualan, total_item, total_bayar, metode_pembayaran)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        db.execute_query(query_sales, (no_invoice, nama_pembeli, no_order_marketplace, sumber_penjualan, total_item, total_bayar, metode_pembayaran))
        
        # Ambil ID sales yang baru saja dibuat
        last_insert = db.fetch_one("SELECT LAST_INSERT_ID() as id")
        id_sales = last_insert['id']
        
        # 3. Looping simpan detail barang & potong stok
        for item in items:
            id_stock = item['id_stock']
            harga_jual = item['harga_jual_aktual']
            
            # Insert ke sales_items
            db.execute_query(
                "INSERT INTO sales_items (id_sales, id_stock, harga_jual_aktual) VALUES (%s, %s, %s)",
                (id_sales, id_stock, harga_jual)
            )
            
            # UPDATE status di tabel stocks (SANGAT PENTING!)
            db.execute_query(
                "UPDATE stocks SET status_barang = 'Terjual' WHERE id_stock = %s",
                (id_stock,)
            )
            
        db.execute_query("COMMIT;")
        db.execute_query("SET autocommit = 1;")
        
        return jsonify({"status": "success", "message": "Transaksi penjualan berhasil disimpan!"}), 201

    except Exception as e:
        db.execute_query("ROLLBACK;")
        db.execute_query("SET autocommit = 1;")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/inventory/available', methods=['GET'])
def get_available_stocks():
    db = Database()
    query = """
        SELECT id_stock, nama_barang, grade, jenis_cacat, total_modal, lokasi_rak 
        FROM stocks 
        WHERE status_barang = 'Tersedia'
    """
    try:
        available_stocks = db.fetch_all(query)
        return jsonify({"status": "success", "data": available_stocks}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/api/purchases', methods=['POST'])
def create_purchase():
    db = Database()
    data = request.json
    
    no_faktur = data.get('no_faktur')
    tgl_pembelian = data.get('tgl_pembelian')
    supplier = data.get('supplier')
    total_nominal = data.get('total_nominal')
    status_bayar = data.get('status_bayar', 'Tempo')
    metode_bayar = data.get('metode_bayar')
    
    # Detail barang yang di-order (masuk ke manifes supplies)
    items = data.get('items', []) 
    
    try:
        db.execute_query("START TRANSACTION;")
        
        # 1. Simpan Header Pembelian
        query_purchase = """
            INSERT INTO purchases (no_faktur, tgl_pembelian, supplier, total_nominal, status_bayar, metode_bayar)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        db.execute_query(query_purchase, (no_faktur, tgl_pembelian, supplier, total_nominal, status_bayar, metode_bayar))
        
        last_insert = db.fetch_one("SELECT LAST_INSERT_ID() as id")
        id_purchase = last_insert['id']
        
        # 2. Simpan komponen masuk ke tabel supplies
        for item in items:
            # Generate no_order unik untuk tiap baris supply atau samakan dengan no_faktur (tergantung rule bisnis Anda)
            no_order_manifes = f"ORD-{no_faktur}-{random.randint(100,999)}" 
            
            db.execute_query("""
                INSERT INTO supplies 
                (no_order, id_purchase, tgl_masuk, supplier, status_bayar, jenis, brand, sku, nama_barang, modal_awal, lokasi_toko, lokasi_rak, status_proses) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                no_order_manifes, id_purchase, tgl_pembelian, supplier, status_bayar, 
                item['jenis'], item['brand'], item['sku'], item['nama_barang'], 
                item['modal_awal'], "Gudang Pusat", "Rak Transit", "Pending"
            ))
            
        db.execute_query("COMMIT;")
        return jsonify({"status": "success", "message": "Data pembelian manifes berhasil disimpan!"}), 201

    except Exception as e:
        db.execute_query("ROLLBACK;")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)