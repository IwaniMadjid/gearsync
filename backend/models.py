from decimal import Decimal

class Supply:
    def __init__(self, no_order, tgl_masuk, supplier, status_bayar, jenis, brand, sku, imei, nama_barang, modal_awal, lokasi_toko, lokasi_rak, status_proses='Pending'):
        self.no_order = no_order
        self.tgl_masuk = tgl_masuk
        self.supplier = supplier
        self.status_bayar = status_bayar
        self.jenis = jenis
        self.brand = brand
        self.sku = sku
        self.imei = imei
        self.nama_barang = nama_barang
        self.modal_awal = Decimal(str(modal_awal))
        self.lokasi_toko = lokasi_toko
        self.lokasi_rak = lokasi_rak
        self.status_proses = status_proses