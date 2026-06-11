import os
from decimal import Decimal
import random
import qrcode
from models import Supply
from database import Database

class InventoryService:
    def __init__(self, db: Database):
        self.db = db

    def add_supply(self, supply, foto_path=""):
        query = """
            INSERT INTO supplies 
            (no_order, tgl_masuk, supplier, status_bayar, jenis, brand, sku, imei, nama_barang, modal_awal, lokasi_toko, lokasi_rak, status_proses, foto)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            supply.no_order, supply.tgl_masuk, supply.supplier, supply.status_bayar, 
            supply.jenis, supply.brand, supply.sku, supply.imei, supply.nama_barang, 
            supply.modal_awal, supply.lokasi_toko, supply.lokasi_rak, supply.status_proses, foto_path
        )
        return self.db.execute_query(query, params)

    def get_all_supplies(self):
        return self.db.fetch_all("SELECT * FROM supplies ORDER BY tgl_masuk DESC")

    def get_pending_supplies(self):
        return self.db.fetch_all("SELECT * FROM supplies WHERE status_proses = 'Pending' ORDER BY tgl_masuk ASC")

    def execute_reverse_bom(self, no_order, modal_induk, bom_components):
        modal_induk_dec = Decimal(str(modal_induk))
        for comp in bom_components:
            persentase_dec = Decimal(str(comp['persentase'])) / Decimal('100.0')
            kalkulasi_modal = persentase_dec * modal_induk_dec
            
            kode_jenis = comp['jenis'][:3].upper().replace(" ", "")
            stock_sku = f"SKU-{kode_jenis}-{random.randint(1000, 9999)}"
            
            # Generate QR Code
            qr = qrcode.make(stock_sku)
            qr_filename = f"{stock_sku}.png"
            qr.save(os.path.join('static', 'qr', qr_filename))
            qr_path = f"/static/qr/{qr_filename}"
            
            # FIX: Tambahkan 'brand' ke dalam query dan params
            query_stock = """
            INSERT INTO stocks (id_stock, no_order, nama_barang, jenis, brand, grade, jenis_cacat, modal_awal, total_modal, lokasi_rak, tindakan, qr_code, foto)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (stock_sku, no_order, comp['nama'], comp['jenis'], comp['brand'], comp['grade'], comp.get('jenis_cacat', 'Normal'), kalkulasi_modal, kalkulasi_modal, comp['lokasi_rak'], comp['tindakan'], qr_path, comp.get('foto_path', ''))
        self.db.execute_query(query_stock, params)
            
        return self.db.execute_query("UPDATE supplies SET status_proses = 'Selesai' WHERE no_order = %s", (no_order,))

    def execute_grading(self, no_order, sku, nama_barang, jenis, brand, modal_awal, grade, jenis_cacat, lokasi_rak, tindakan='Jual', foto_path=''):
        modal_dec = Decimal(str(modal_awal))
        
        qr = qrcode.make(sku)
        qr_filename = f"{sku}.png"
        qr.save(os.path.join('static', 'qr', qr_filename))
        qr_path = f"/static/qr/{qr_filename}"
        
        query_stock = """
            INSERT INTO stocks (id_stock, no_order, nama_barang, jenis, brand, grade, jenis_cacat, modal_awal, total_modal, lokasi_rak, tindakan, qr_code, foto)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (sku, no_order, nama_barang, jenis, brand, grade, jenis_cacat, modal_dec, modal_dec, lokasi_rak, tindakan, qr_path, foto_path)
        self.db.execute_query(query_stock, params)
        return self.db.execute_query("UPDATE supplies SET status_proses = 'Selesai' WHERE no_order = %s", (no_order,))

    def get_repairable_stocks(self):
        query = "SELECT * FROM stocks WHERE jenis != 'Unit' AND status_barang = 'ready' AND (grade = 'Grade B' OR grade = 'Grade C') ORDER BY id_stock ASC"
        return self.db.fetch_all(query)

    def process_repair(self, id_stock, tambahan_biaya, catatan, grade_sebelum, lokasi_rak_baru, grade_sesudah, foto_path=""):
        biaya_dec = Decimal(str(tambahan_biaya))
        query_update = "UPDATE stocks SET biaya_reparasi = biaya_reparasi + %s, total_modal = total_modal + %s, lokasi_rak = %s, grade = %s WHERE id_stock = %s"
        self.db.execute_query(query_update, (biaya_dec, biaya_dec, lokasi_rak_baru, grade_sesudah, id_stock))
            
        query_log = "INSERT INTO repairs (id_stock, biaya, catatan, grade_sebelum, grade_sesudah, foto_setelah) VALUES (%s, %s, %s, %s, %s, %s)"
        return self.db.execute_query(query_log, (id_stock, biaya_dec, catatan, grade_sebelum, grade_sesudah, foto_path))

    def get_all_stocks(self):
        query = """
            SELECT 
                s.*, 
                sup.imei as imei_asal, 
                sup.lokasi_toko, 
                sup.status_bayar,
                sup.supplier,
                sup.tgl_masuk
            FROM stocks s
            LEFT JOIN supplies sup ON s.no_order = sup.no_order
            ORDER BY s.status_barang ASC, s.total_modal DESC
        """
        return self.db.fetch_all(query)