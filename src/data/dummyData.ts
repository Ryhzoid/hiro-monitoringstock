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

export interface Category {
  id: string;
  nama: string;
  kode: string;         // kode SKU kategori ('' jika tidak diisi)
  deskripsi: string;
  jumlahProduk: number; // dihitung dari daftar barang
}

export interface Supplier {
  id: string;
  nama: string;
  npwp: string;
  contactPerson: string;
  telepon: string;
  email: string;
  alamat: string;
  jumlahProduk: number;     // barang yang memakai supplier ini
  jumlahTransaksi: number;  // transaksi (yang tidak dibatalkan) atas barang supplier ini
}

export interface Unit {
  id: string;
  nama: string;       // contoh: Pieces
  singkatan: string;  // contoh: Pcs
  aktif: boolean;
  jumlahProduk: number;
}

export interface Product {
  id: string;
  kode: string;
  nama: string;
  kategori: string;     // nama kategori
  categoryId: string;
  satuan: string;       // singkatan unit, contoh: Pcs
  unitId: string;
  supplier: string;     // nama supplier/merk ('' jika tanpa supplier)
  supplierId: string;   // '' jika tanpa supplier
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
  // Pembatalan (koreksi): transaksi tidak dihapus, hanya ditandai dibatalkan.
  dbId?: number; // id numerik di database, dipakai untuk membatalkan
  dibatalkan?: boolean;
  alasanPembatalan?: string;
  dibatalkanOleh?: string;
  dibatalkanPada?: string;
}

export interface StockBatch {
  id: string;
  productId: string;
  tanggal: string;
  jumlahAwal: number;
  sisa: number;
}

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
