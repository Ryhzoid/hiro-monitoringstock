// Tipe data dan fungsi bantu untuk sistem monitoring stok gudang.
// Data sungguhan sekarang berasal dari database (lihat src/contexts/DataContext.tsx);
// file ini tidak lagi berisi data contoh. Nama file dipertahankan supaya impor di
// halaman lain tidak perlu diubah.

export type UserRole = 'admin' | 'manajer';

export interface User {
  id: string;
  nama: string;
  email: string;
  role: UserRole;
  status: 'Aktif' | 'Nonaktif';
}

export interface Product {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  satuan: 'PCS' | 'BOX' | 'UNIT';
  status: 'Aktif' | 'Tidak Aktif';
  // stokAwal selalu 0 (stok dicatat lewat transaksi Barang Masuk);
  // dipertahankan agar getStokAkhir dan halaman lama tetap berfungsi.
  stokAwal: number;
  totalMasuk: number;
  totalKeluar: number;
}

export interface Transaction {
  id: string;
  tanggal: string;
  jenis: 'Masuk' | 'Keluar';
  barangId: string;
  namaBarang: string;
  jumlah: number;
  keterangan: string;
  userInput: string;
  batchAllocations?: { batchId: string; jumlah: number }[];
}

export interface StockBatch {
  id: string;
  productId: string;
  tanggal: string;
  jumlahAwal: number;
  sisa: number;
}

// Harus sama dengan isi tabel categories di database.
export const categories = ['Indoor Lighting', 'Outdoor Lighting', 'Industrial Lighting'];

export const getStokAkhir = (product: Product) => {
  return product.stokAwal + product.totalMasuk - product.totalKeluar;
};

export const getStokStatus = (stokAkhir: number): 'Aman' | 'Menipis' | 'Habis' => {
  if (stokAkhir === 0) return 'Habis';
  if (stokAkhir < 10) return 'Menipis';
  return 'Aman';
};

export const sortBatchesByTanggal = (batches: StockBatch[]) =>
  [...batches].sort((a, b) => a.tanggal.localeCompare(b.tanggal));