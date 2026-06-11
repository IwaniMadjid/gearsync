import os
import mysql.connector
from mysql.connector import Error
from mysql.connector import pooling
from dotenv import load_dotenv
import datetime
from decimal import Decimal

# Load variabel dari file .env
load_dotenv()

class Database:
    def __init__(self):
        dbconfig = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASS', ''),
            'database': os.getenv('DB_NAME', 'gearsync_db')
        }
        
        # Membuat Connection Pool untuk menangani request serentak
        try:
            self.pool = mysql.connector.pooling.MySQLConnectionPool(
                pool_name="gearsync_pool",
                pool_size=10,  # Menyediakan 10 jalur koneksi standby
                pool_reset_session=True,
                **dbconfig
            )
        except Error as e:
            print(f"[POOL ERROR] Gagal membuat kolam koneksi: {e}")

    def get_connection(self):
        try:
            # Mengambil 1 koneksi yang menganggur dari dalam Pool
            return self.pool.get_connection()
        except Error as e:
            print(f"[DB ERROR] Koneksi sibuk / gagal mengambil dari pool: {e}")
            return None

    def execute_query(self, query, params=None):
        conn = self.get_connection()
        if not conn:
            return False

        cursor = None
        try:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            return True
        except Error as e:
            print(f"[QUERY ERROR] {e}")
            conn.rollback()
            return False
        finally:
            if cursor:
                cursor.close()
            if conn and conn.is_connected():
                conn.close() # Dalam sistem Pool, close() berarti mengembalikan koneksi ke kolam, BUKAN memutusnya dari MySQL.

    def fetch_all(self, query, params=None):
        conn = self.get_connection()
        if not conn:
            return []

        cursor = None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            # Konversi tipe data khusus (Decimal & Date) agar kompatibel dengan JSON (React)
            for row in rows:
                for key, value in row.items():
                    if isinstance(value, Decimal):
                        row[key] = float(value)
                    elif isinstance(value, (datetime.date, datetime.datetime)):
                        row[key] = value.isoformat()
            
            return rows
        except Error as e:
            print(f"[QUERY ERROR] {e}")
            return []
        finally:
            if cursor:
                cursor.close()
            if conn and conn.is_connected():
                conn.close() # Mengembalikan koneksi ke kolam