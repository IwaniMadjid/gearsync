import os
import json
import time
import random
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
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

# ==========================================
# ENDPOINT PENGADAAN (PURCHASING)
# ==========================================

@app.route('/api/purchases', methods=['GET'])
def get_purchases():
    db = Database()
    try:
        # Ambil semua data faktur (Terbaru di atas)
        query = "SELECT * FROM purchases ORDER BY tgl_pembelian DESC"
        data = db.fetch_all(query)
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/purchases', methods=['POST'])
def create_purchase():
    db = Database()
    req = request.form
    
    no_faktur = req.get('no_faktur')
    tgl_pembelian = req.get('tgl_pembelian')
    supplier = req.get('supplier')
    total_nominal = req.get('total_nominal')
    status_bayar = req.get('status_bayar', 'Tempo')
    items_str = req.get('items', '[]')
    
    # Simpan file bukti bayar jika ada
    bukti_bayar_path = ''
    if 'bukti_bayar' in request.files:
        file = request.files['bukti_bayar']
        if file.filename != '':
            filename = secure_filename(f"bukti_{int(time.time())}_{file.filename}")
            filepath = os.path.join('static', 'uploads', filename)
            file.save(filepath)
            bukti_bayar_path = f'/static/uploads/{filename}'
    
    try:
        query = """
            INSERT INTO purchases 
            (no_faktur, tgl_pembelian, supplier, total_nominal, status_bayar, bukti_bayar, items, status_kedatangan)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'Pending')
        """
        db.execute_query(query, (no_faktur, tgl_pembelian, supplier, total_nominal, status_bayar, bukti_bayar_path, items_str))
        
        return jsonify({"status": "success", "message": "Faktur berhasil dicatat!"}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ==========================================
# ENDPOINT KEDATANGAN BARANG (SUPPLIES)
# ==========================================

# 1. Route GET: Untuk menampilkan daftar riwayat barang yang sudah tiba di halaman depan
@app.route('/api/supplies', methods=['GET'])
def get_all_supplies():
    db = Database()
    try:
        query = "SELECT * FROM supplies ORDER BY tgl_masuk DESC"
        data = db.fetch_all(query)
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# 2. Route POST: Untuk mengeksekusi/menyimpan barang fisik yang baru dibongkar dari kardus
@app.route('/api/supplies/execute', methods=['POST'])
def execute_supplies_arrival():
    db = Database()
    req = request.form
    
    no_faktur = req.get('no_faktur')
    tgl_masuk = req.get('tgl_masuk')
    komponen_str = req.get('komponen', '[]')
    komponen = json.loads(komponen_str)

    try:
        db.execute_query("START TRANSACTION;")
        
        # Update status faktur menjadi 'Barang Tiba'
        db.execute_query("UPDATE purchases SET status_kedatangan = 'Barang Tiba' WHERE no_faktur = %s", (no_faktur,))
        
        # Ambil data supplier dari faktur untuk diteruskan ke manifes
        purchases_data = db.fetch_all(f"SELECT supplier, status_bayar FROM purchases WHERE no_faktur = '{no_faktur}'")
        purchase = purchases_data[0] if purchases_data else None
        
        supplier = purchase['supplier'] if purchase else '-'
        status_bayar = purchase['status_bayar'] if purchase else 'Tempo'

        # Masukkan barang fisik ke antrean Task Board (tabel supplies)
        for i, comp in enumerate(komponen):
            foto_path = ''
            file_key = f'foto_item_{i}'
            if file_key in request.files:
                file = request.files[file_key]
                if file.filename != '':
                    filename = secure_filename(f"arr_{int(time.time())}_{file.filename}")
                    filepath = os.path.join('static', 'uploads', filename)
                    file.save(filepath)
                    foto_path = f'/static/uploads/{filename}'
            
            no_order_unik = f"ARR-{int(time.time())}-{i+1}"
            
            modal = comp.get('harga_beli')
            if modal is None or modal == '':
                modal = comp.get('modal_awal', 0)
                
            sku_val = comp.get('sku', 'GENERIC')
            
            query_supply = """
                INSERT INTO supplies 
                (no_order, tgl_masuk, supplier, status_bayar, jenis, brand, sku, imei, nama_barang, modal_awal, lokasi_toko, lokasi_rak, foto, status_proses)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Pending')
            """
            db.execute_query(query_supply, (
                no_order_unik, tgl_masuk, supplier, status_bayar,
                comp.get('jenis'), comp.get('brand'), sku_val, comp.get('imei'),
                comp.get('nama_barang'), modal, 'Gudang Pusat', comp.get('lokasi_rak'), foto_path
            ))

        db.execute_query("COMMIT;")
        return jsonify({"status": "success", "message": "Barang tiba disahkan."}), 200
    except Exception as e:
        db.execute_query("ROLLBACK;")
        print(f"\n❌ [ERROR GUDANG KEDATANGAN]: {str(e)}\n") 
        return jsonify({"status": "error", "message": str(e)}), 500

# 3. Route GET Pending: Untuk dipakai oleh halaman BOM & QC Task Board
@app.route('/api/supplies/pending', methods=['GET'])
def get_pending():
    db = Database()
    try:
        # Menarik data supplies yang belum diproses menjadi stok
        query = "SELECT * FROM supplies WHERE status_proses = 'Pending' ORDER BY tgl_masuk ASC"
        data = db.fetch_all(query)
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ==========================================
# ENDPOINT LAB REPARASI (REPAIRS) - DIPERBAIKI!
# ==========================================

@app.route('/api/repairs/pending', methods=['GET'])
def get_repairs():
    db = Database()
    try:
        # Murni SQL: Menarik data STOK yang butuh REPARASI (Bukan pakai inventory_service lagi)
        query = """
            SELECT st.*, sp.foto AS foto_datang, sp.tgl_masuk
            FROM stocks st
            JOIN supplies sp ON st.no_order = sp.no_order
            WHERE st.tindakan = 'Perbaiki'
            ORDER BY sp.tgl_masuk ASC
        """
        data = db.fetch_all(query)
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        print(f"❌ [ERROR REPAIR LIST]: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/repairs/execute', methods=['POST'])
def execute_repair():
    db = Database()
    req = request.form
    
    id_stock = req.get('id_stock')
    tambahan_biaya = float(req.get('tambahan_biaya', 0))
    catatan = req.get('catatan', '')
    grade_sebelum = req.get('grade_sebelum')
    grade_sesudah = req.get('grade_sesudah')
    lokasi_rak_baru = req.get('lokasi_rak_baru')
    
    # 1. Amankan File Foto Hasil Reparasi
    foto_path = ''
    if 'foto' in request.files:
        file = request.files['foto']
        if file.filename != '':
            filename = secure_filename(f"rep_{int(time.time())}_{file.filename}")
            filepath = os.path.join('static', 'uploads', filename)
            file.save(filepath)
            foto_path = f'/static/uploads/{filename}'

    try:
        db.execute_query("START TRANSACTION;")
        
        # 2. Catat riwayat di tabel repairs
        query_repair = """
            INSERT INTO repairs 
            (id_stock, tgl_reparasi, tambahan_biaya, catatan, grade_sebelum, grade_sesudah, foto_setelah, status_reparasi)
            VALUES (%s, NOW(), %s, %s, %s, %s, %s, 'Selesai')
        """
        db.execute_query(query_repair, (id_stock, tambahan_biaya, catatan, grade_sebelum, grade_sesudah, foto_path))
        
        # 3. UPDATE Master Stok (Naik Grade, Pindah Rak, Tambah Modal, & Ubah Tindakan jadi 'Jual')
        query_update_stock = """
            UPDATE stocks 
            SET grade = %s, 
                lokasi_rak = %s, 
                tindakan = 'Jual', 
                total_modal = total_modal + %s
            WHERE id_stock = %s
        """
        db.execute_query(query_update_stock, (grade_sesudah, lokasi_rak_baru, tambahan_biaya, id_stock))
        
        db.execute_query("COMMIT;")
        return jsonify({"status": "success", "message": "Reparasi berhasil diselesaikan dan stok diperbarui."}), 200
        
    except Exception as e:
        db.execute_query("ROLLBACK;")
        print(f"❌ [ERROR REPAIR EXECUTE]: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ==========================================
# ENDPOINT LAINNYA (BOM, GRADING, STOCKS, SALES)
# ==========================================

@app.route('/api/bom/execute', methods=['POST'])
def execute_bom():
    try:
        no_order = request.form.get('no_order')
        modal_induk = request.form.get('modal_induk')
        komponen_str = request.form.get('komponen')
        komponen = json.loads(komponen_str)

        for i, comp in enumerate(komponen):
            file_key = f'foto_{i}'
            if file_key in request.files:
                file = request.files[file_key]
                if file.filename != '':
                    filename = secure_filename(f"bom_{int(time.time())}_{file.filename}")
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


@app.route('/api/grading/execute', methods=['POST'])
def execute_grading():
    try:
        req = request.form
        foto_path = ''
        
        if 'foto' in request.files:
            file = request.files['foto']
            if file.filename != '':
                filename = secure_filename(f"grd_{int(time.time())}_{file.filename}")
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

@app.route('/api/master/<kategori>', methods=['GET'])
def get_master_data(kategori):
    tabel = MASTER_TABLES.get(kategori)
    if not tabel:
        return jsonify({"error": "Kategori tidak valid"}), 400
    
    db = Database()
    data = db.fetch_all(f"SELECT * FROM {tabel}")
    return jsonify({"data": data}), 200

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

        if jenis_produk.lower() == 'unit':
            harga_parts = data.get('harga_parts', {})
            komponen_list = ['LCD', 'Baterai', 'Frame LCD', 'List LCD', 'Cover Backdoor', 'Lem Advise']
            
            for komp in komponen_list:
                harga_a = harga_parts.get(komp, {}).get('a', 0)
                harga_d = harga_parts.get(komp, {}).get('d', 0)
                db.execute_query(
                    "INSERT INTO master_series (jenis_produk, brand, seri, harga_grade_a, harga_grade_d) VALUES (%s, %s, %s, %s, %s)",
                    (komp, brand, seri, harga_a, harga_d)
                )
        else:
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
    query = """
        SELECT 
            st.*, 
            sp.foto AS foto_datang, 
            sp.tgl_masuk,
            sp.lokasi_toko,
            sp.status_bayar,
            sp.imei AS imei_asal,
            DATEDIFF(CURRENT_DATE, sp.tgl_masuk) AS umur_stok,
            (SELECT rp.foto_setelah FROM repairs rp 
             WHERE rp.id_stock = st.id_stock 
             LIMIT 1) AS foto_reparasi
        FROM stocks st
        JOIN supplies sp ON st.no_order = sp.no_order
    """
    try:
        stocks_data = db.fetch_all(query)
        return jsonify({"status": "success", "data": stocks_data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    

@app.route('/api/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    db = Database()
    query_cards = """
        SELECT 
            COUNT(*) as total_stok,
            IFNULL(SUM(total_modal), 0) as total_modal
        FROM stocks;
    """
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
                "stok_tertua": oldest_data
            }
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/sales', methods=['POST'])
def create_sale():
    db = Database()
    data = request.json
    
    no_invoice = data.get('no_invoice')
    nama_pembeli = data.get('nama_pembeli', '')
    no_order_marketplace = data.get('no_order_marketplace', '')
    sumber_penjualan = data.get('sumber_penjualan')
    metode_pembayaran = data.get('metode_pembayaran')
    items = data.get('items', [])
    
    if not items:
        return jsonify({"status": "error", "message": "Keranjang belanja kosong!"}), 400

    total_item = len(items)
    total_bayar = sum(float(item['harga_jual_aktual']) for item in items)
    
    try:
        db.execute_query("SET autocommit = 0;")
        db.execute_query("START TRANSACTION;")
        
        query_sales = """
            INSERT INTO sales (no_invoice, nama_pembeli, no_order_marketplace, sumber_penjualan, total_item, total_bayar, metode_pembayaran)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        db.execute_query(query_sales, (no_invoice, nama_pembeli, no_order_marketplace, sumber_penjualan, total_item, total_bayar, metode_pembayaran))
        
        last_insert = db.fetch_one("SELECT LAST_INSERT_ID() as id")
        id_sales = last_insert['id']
        
        for item in items:
            id_stock = item['id_stock']
            harga_jual = item['harga_jual_aktual']
            
            db.execute_query(
                "INSERT INTO sales_items (id_sales, id_stock, harga_jual_aktual) VALUES (%s, %s, %s)",
                (id_sales, id_stock, harga_jual)
            )
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
        WHERE status_barang = 'Tersedia' AND tindakan != 'Perbaiki'
    """
    try:
        available_stocks = db.fetch_all(query)
        return jsonify({"status": "success", "data": available_stocks}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)