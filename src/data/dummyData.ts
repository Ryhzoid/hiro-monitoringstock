// Dummy data for the warehouse stock monitoring system

export type UserRole = 'admin' | 'manajer';

export interface User {
  id: string;
  nama: string;
  email: string;
  password: string;
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

export const categories = ['Indoor Lighting', 'Outdoor Lighting', 'Industrial Lighting'];

export const initialUsers: User[] = [
  { id: '1', nama: 'Budi Santoso', email: 'budi@hirotakashimura.com', password: 'budi123', role: 'admin', status: 'Aktif' },
  { id: '2', nama: 'Dewi Rahayu', email: 'dewi@hirotakashimura.com', password: 'dewi123', role: 'admin', status: 'Aktif' },
  { id: '3', nama: 'Ahmad Fauzi', email: 'ahmad@hirotakashimura.com', password: 'ahmad123', role: 'manajer', status: 'Aktif' },
  { id: '4', nama: 'Siti Nurhaliza', email: 'siti@hirotakashimura.com', password: 'siti123', role: 'manajer', status: 'Nonaktif' },
  { id: '5', nama: 'Rudi Hermawan', email: 'rudi@hirotakashimura.com', password: 'rudi123', role: 'admin', status: 'Aktif' },
  { id: '6', nama: 'Admin Gudang', email: 'admin@hirotakashimura.com', password: 'admin123', role: 'admin', status: 'Aktif' },
  { id: '7', nama: 'Manajer Gudang', email: 'manajer@hirotakashimura.com', password: 'manajer123', role: 'manajer', status: 'Aktif' },
];

export const initialProducts: Product[] = [
  { id: '1', kode: 'LED-PNL-001', nama: 'LED Panel 60x60 40W', kategori: 'Indoor Lighting', satuan: 'PCS', status: 'Aktif', stokAwal: 100, totalMasuk: 150, totalKeluar: 180 },
  { id: '2', kode: 'LED-PNL-002', nama: 'LED Panel 30x120 36W', kategori: 'Indoor Lighting', satuan: 'PCS', status: 'Aktif', stokAwal: 80, totalMasuk: 100, totalKeluar: 95 },
  { id: '3', kode: 'DWN-001', nama: 'Downlight LED 12W', kategori: 'Indoor Lighting', satuan: 'PCS', status: 'Aktif', stokAwal: 200, totalMasuk: 300, totalKeluar: 480 },
  { id: '4', kode: 'DWN-002', nama: 'Downlight LED 18W', kategori: 'Indoor Lighting', satuan: 'PCS', status: 'Aktif', stokAwal: 150, totalMasuk: 200, totalKeluar: 345 },
  { id: '5', kode: 'STR-001', nama: 'Street Light 50W', kategori: 'Outdoor Lighting', satuan: 'UNIT', status: 'Aktif', stokAwal: 50, totalMasuk: 80, totalKeluar: 122 },
  { id: '6', kode: 'STR-002', nama: 'Street Light 100W', kategori: 'Outdoor Lighting', satuan: 'UNIT', status: 'Aktif', stokAwal: 30, totalMasuk: 50, totalKeluar: 75 },
  { id: '7', kode: 'FLD-001', nama: 'Flood Light 150W', kategori: 'Outdoor Lighting', satuan: 'UNIT', status: 'Aktif', stokAwal: 40, totalMasuk: 60, totalKeluar: 85 },
  { id: '8', kode: 'FLD-002', nama: 'Flood Light 200W', kategori: 'Outdoor Lighting', satuan: 'UNIT', status: 'Aktif', stokAwal: 25, totalMasuk: 40, totalKeluar: 60 },
  { id: '9', kode: 'HBY-001', nama: 'High Bay LED 100W', kategori: 'Industrial Lighting', satuan: 'UNIT', status: 'Aktif', stokAwal: 60, totalMasuk: 90, totalKeluar: 140 },
  { id: '10', kode: 'HBY-002', nama: 'High Bay LED 150W', kategori: 'Industrial Lighting', satuan: 'UNIT', status: 'Aktif', stokAwal: 45, totalMasuk: 70, totalKeluar: 107 },
  { id: '11', kode: 'HBY-003', nama: 'High Bay LED 200W', kategori: 'Industrial Lighting', satuan: 'UNIT', status: 'Aktif', stokAwal: 30, totalMasuk: 50, totalKeluar: 72 },
  { id: '12', kode: 'TUB-001', nama: 'LED Tube T8 18W', kategori: 'Indoor Lighting', satuan: 'BOX', status: 'Aktif', stokAwal: 300, totalMasuk: 500, totalKeluar: 790 },
  { id: '13', kode: 'TUB-002', nama: 'LED Tube T5 14W', kategori: 'Indoor Lighting', satuan: 'BOX', status: 'Aktif', stokAwal: 250, totalMasuk: 400, totalKeluar: 645 },
  { id: '14', kode: 'BLB-001', nama: 'LED Bulb 9W', kategori: 'Indoor Lighting', satuan: 'BOX', status: 'Aktif', stokAwal: 500, totalMasuk: 800, totalKeluar: 1295 },
  { id: '15', kode: 'BLB-002', nama: 'LED Bulb 12W', kategori: 'Indoor Lighting', satuan: 'BOX', status: 'Aktif', stokAwal: 400, totalMasuk: 600, totalKeluar: 991 },
  { id: '16', kode: 'GDN-001', nama: 'Garden Light LED', kategori: 'Outdoor Lighting', satuan: 'PCS', status: 'Aktif', stokAwal: 100, totalMasuk: 150, totalKeluar: 245 },
  { id: '17', kode: 'WLL-001', nama: 'Wall Light LED 12W', kategori: 'Indoor Lighting', satuan: 'PCS', status: 'Tidak Aktif', stokAwal: 80, totalMasuk: 50, totalKeluar: 130 },
  { id: '18', kode: 'EXP-001', nama: 'Explosion Proof Light', kategori: 'Industrial Lighting', satuan: 'UNIT', status: 'Aktif', stokAwal: 20, totalMasuk: 30, totalKeluar: 42 },
];

const generateTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const users = ['Budi Santoso', 'Dewi Rahayu', 'Rudi Hermawan'];
  const today = new Date();
  
  for (let i = 0; i < 35; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    const product = initialProducts[Math.floor(Math.random() * initialProducts.length)];
    const jenis = Math.random() > 0.4 ? 'Masuk' : 'Keluar';
    
    transactions.push({
      id: `TRX-${String(i + 1).padStart(4, '0')}`,
      tanggal: date.toISOString().split('T')[0],
      jenis,
      barangId: product.id,
      namaBarang: product.nama,
      jumlah: Math.floor(Math.random() * 50) + 5,
      keterangan: jenis === 'Masuk' 
        ? ['Pembelian supplier', 'Return dari customer', 'Restok bulanan'][Math.floor(Math.random() * 3)]
        : ['Penjualan', 'Pengiriman proyek', 'Sample produk'][Math.floor(Math.random() * 3)],
      userInput: users[Math.floor(Math.random() * users.length)],
    });
  }
  
  return transactions.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
};

export const initialTransactions = generateTransactions();

export const getStokAkhir = (product: Product) => {
  return product.stokAwal + product.totalMasuk - product.totalKeluar;
};

export const getStokStatus = (stokAkhir: number): 'Aman' | 'Menipis' | 'Habis' => {
  if (stokAkhir === 0) return 'Habis';
  if (stokAkhir < 10) return 'Menipis';
  return 'Aman';
};

const generateInitialBatches = (): StockBatch[] => {
  const legacyDate = new Date();
  legacyDate.setDate(legacyDate.getDate() - 60);
  const tanggalLegacy = legacyDate.toISOString().split('T')[0];

  return initialProducts.map((product, index) => ({
    id: `BATCH-${String(index + 1).padStart(4, '0')}`,
    productId: product.id,
    tanggal: tanggalLegacy,
    jumlahAwal: product.stokAwal + product.totalMasuk,
    sisa: getStokAkhir(product),
  }));
};

export const initialBatches: StockBatch[] = generateInitialBatches();

export const sortBatchesByTanggal = (batches: StockBatch[]) =>
  [...batches].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
