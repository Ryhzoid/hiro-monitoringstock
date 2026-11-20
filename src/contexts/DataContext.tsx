import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Product, Transaction, User, StockBatch, UserRole } from '@/data/dummyData';

// Data baru untuk transaksi. Nama barang dan pencatat diambil otomatis oleh database.
export interface NewTransaction {
  tanggal: string;
  jenis: 'Masuk' | 'Keluar';
  barangId: string;
  jumlah: number;
  keterangan: string;
  batchAllocations?: { batchId: string; jumlah: number }[];
}

type NewProduct = Omit<Product, 'id' | 'stokAwal' | 'totalMasuk' | 'totalKeluar'>;

interface DataContextType {
  products: Product[];
  transactions: Transaction[];
  users: User[];
  batches: StockBatch[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addProduct: (product: NewProduct) => Promise<void>;
  updateProduct: (id: string, updates: Partial<NewProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addTransaction: (transaction: NewTransaction) => Promise<void>;
  updateUser: (id: string, updates: { nama?: string; role?: UserRole }) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const PAGE_SIZE = 1000;
const NO_PERMISSION = 'Perubahan tidak tersimpan. Anda mungkin tidak memiliki izin untuk tindakan ini.';

// Supabase membatasi jumlah baris per permintaan, jadi data diambil per halaman
// sampai habis supaya tidak terpotong tanpa pemberitahuan.
async function fetchAll(
  build: (from: number, to: number) => PromiseLike<{ data: any[] | null; error: any }>
): Promise<any[]> {
  const rows: any[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await build(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

const one = (value: any) => (Array.isArray(value) ? value[0] : value);

// Mengubah error database menjadi pesan yang bisa dibaca pengguna.
const toMessage = (error: any, fallback = 'Terjadi kesalahan. Coba lagi.'): string => {
  if (!error) return fallback;
  if (error.code === 'P0001') return error.message; // pesan dari fungsi / trigger database
  if (error.code === '42501') return 'Anda tidak memiliki izin untuk tindakan ini.';
  if (error.code === '23505') return 'Data dengan nilai yang sama sudah ada.';
  if (error.code === '23503') return 'Data ini masih dipakai oleh data lain.';
  return error.message || fallback;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categoryIds = useRef<Record<string, number>>({});
  const loadToken = useRef(0);
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = userId;

  // true selama data pertama setelah login belum selesai dimuat.
  const isLoading = !!userId && loadedFor !== userId;

  const loadAll = useCallback(async () => {
    const forUser = userIdRef.current;
    const token = ++loadToken.current;
    setError(null);

    try {
      const [catRes, productRows, stockRows, trxRows, batchRows, userRes] = await Promise.all([
        supabase.from('categories').select('id, nama'),
        fetchAll((from, to) =>
          supabase
            .from('products')
            .select('id, kode, nama, satuan, aktif, categories(nama)')
            .order('nama')
            .range(from, to)
        ),
        fetchAll((from, to) =>
          supabase
            .from('product_stock')
            .select('product_id, total_masuk, total_keluar')
            .range(from, to)
        ),
        fetchAll((from, to) =>
          supabase
            .from('transactions')
            .select('id, tanggal, jenis, product_id, jumlah, keterangan, products(nama), profiles(nama)')
            .order('id', { ascending: false })
            .range(from, to)
        ),
        fetchAll((from, to) =>
          supabase
            .from('stock_batches')
            .select('id, product_id, tanggal, jumlah_awal, sisa')
            .order('id')
            .range(from, to)
        ),
        supabase.from('profiles').select('id, nama, email, role, aktif').order('nama'),
      ]);

      if (catRes.error) throw catRes.error;
      if (userRes.error) throw userRes.error;
      if (token !== loadToken.current) return; // sudah ada pemuatan yang lebih baru / user logout

      categoryIds.current = Object.fromEntries((catRes.data ?? []).map((c: any) => [c.nama, c.id]));

      const stockByProduct: Record<string, { masuk: number; keluar: number }> = {};
      stockRows.forEach((s: any) => {
        stockByProduct[s.product_id] = { masuk: s.total_masuk, keluar: s.total_keluar };
      });

      setProducts(
        productRows.map((p: any): Product => ({
          id: p.id,
          kode: p.kode,
          nama: p.nama,
          kategori: one(p.categories)?.nama ?? '-',
          satuan: p.satuan,
          status: p.aktif ? 'Aktif' : 'Tidak Aktif',
          stokAwal: 0,
          totalMasuk: stockByProduct[p.id]?.masuk ?? 0,
          totalKeluar: stockByProduct[p.id]?.keluar ?? 0,
        }))
      );

      setTransactions(
        trxRows
          .map((t: any): Transaction => ({
            id: `TRX-${String(t.id).padStart(4, '0')}`,
            tanggal: t.tanggal,
            jenis: t.jenis,
            barangId: t.product_id,
            namaBarang: one(t.products)?.nama ?? '(barang dihapus)',
            jumlah: t.jumlah,
            keterangan: t.keterangan ?? '',
            userInput: one(t.profiles)?.nama ?? '-',
          }))
          .sort((a, b) => b.tanggal.localeCompare(a.tanggal)) // urutan id menurun tetap terjaga per tanggal
      );

      setBatches(
        batchRows.map((b: any): StockBatch => ({
          id: String(b.id),
          productId: b.product_id,
          tanggal: b.tanggal,
          jumlahAwal: b.jumlah_awal,
          sisa: b.sisa,
        }))
      );

      setUsers(
        (userRes.data ?? []).map((u: any): User => ({
          id: u.id,
          nama: u.nama,
          email: u.email,
          role: u.role,
          status: u.aktif ? 'Aktif' : 'Nonaktif',
        }))
      );
    } catch (err) {
      console.error('Gagal memuat data:', err);
      if (token === loadToken.current) {
        setError(toMessage(err, 'Gagal memuat data dari server.'));
      }
    } finally {
      if (token === loadToken.current) setLoadedFor(forUser);
    }
  }, []);

  // Muat data saat login, kosongkan saat logout.
  useEffect(() => {
    if (userId) {
      loadAll();
    } else {
      loadToken.current++;
      setProducts([]);
      setTransactions([]);
      setUsers([]);
      setBatches([]);
      setError(null);
      setLoadedFor(null);
    }
  }, [userId, loadAll]);

  const refresh = async () => {
    await loadAll();
  };

  // ---------- Barang ----------

  const addProduct = async (product: NewProduct) => {
    const categoryId = categoryIds.current[product.kategori];
    if (!categoryId) throw new Error('Kategori tidak ditemukan di database.');

    const { error: err } = await supabase.from('products').insert({
      kode: product.kode,
      nama: product.nama,
      category_id: categoryId,
      satuan: product.satuan,
      aktif: product.status === 'Aktif',
    });
    if (err) {
      throw new Error(err.code === '23505' ? 'Kode barang sudah digunakan barang lain.' : toMessage(err));
    }
    await loadAll();
  };

  const updateProduct = async (id: string, updates: Partial<NewProduct>) => {
    const payload: Record<string, any> = {};
    if (updates.kode !== undefined) payload.kode = updates.kode;
    if (updates.nama !== undefined) payload.nama = updates.nama;
    if (updates.satuan !== undefined) payload.satuan = updates.satuan;
    if (updates.status !== undefined) payload.aktif = updates.status === 'Aktif';
    if (updates.kategori !== undefined) {
      const categoryId = categoryIds.current[updates.kategori];
      if (!categoryId) throw new Error('Kategori tidak ditemukan di database.');
      payload.category_id = categoryId;
    }

    const { data, error: err } = await supabase.from('products').update(payload).eq('id', id).select('id');
    if (err) {
      throw new Error(err.code === '23505' ? 'Kode barang sudah digunakan barang lain.' : toMessage(err));
    }
    if (!data || data.length === 0) throw new Error(NO_PERMISSION);
    await loadAll();
  };

  const deleteProduct = async (id: string) => {
    const { data, error: err } = await supabase.from('products').delete().eq('id', id).select('id');
    if (err) {
      throw new Error(
        err.code === '23503'
          ? 'Barang sudah punya riwayat transaksi sehingga tidak bisa dihapus. Nonaktifkan saja.'
          : toMessage(err)
      );
    }
    if (!data || data.length === 0) throw new Error(NO_PERMISSION);
    await loadAll();
  };

  // ---------- Transaksi ----------
  // Satu-satunya cara mengubah stok: fungsi catat_transaksi di database
  // (atomik, membuat batch untuk Masuk, mengurangi batch untuk Keluar).

  const addTransaction = async (transaction: NewTransaction) => {
    const alokasi =
      transaction.jenis === 'Keluar' && transaction.batchAllocations?.length
        ? transaction.batchAllocations.map((a) => ({ batch_id: Number(a.batchId), jumlah: a.jumlah }))
        : null;

    const { error: err } = await supabase.rpc('catat_transaksi', {
      p_jenis: transaction.jenis,
      p_product_id: transaction.barangId,
      p_jumlah: transaction.jumlah,
      p_keterangan: transaction.keterangan || null,
      p_tanggal: transaction.tanggal,
      p_alokasi: alokasi,
    });
    if (err) throw new Error(toMessage(err));
    await loadAll();
  };

  // ---------- Pengguna ----------
  // Akun baru dibuat manual lewat dashboard Supabase; di sini hanya mengubah
  // nama, role, dan status aktif.

  const updateUser = async (id: string, updates: { nama?: string; role?: UserRole }) => {
    const payload: Record<string, any> = {};
    if (updates.nama !== undefined) payload.nama = updates.nama;
    if (updates.role !== undefined) payload.role = updates.role;

    const { data, error: err } = await supabase.from('profiles').update(payload).eq('id', id).select('id');
    if (err) throw new Error(toMessage(err));
    if (!data || data.length === 0) throw new Error(NO_PERMISSION);
    await loadAll();
  };

  const toggleUserStatus = async (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) throw new Error('Pengguna tidak ditemukan.');

    const { data, error: err } = await supabase
      .from('profiles')
      .update({ aktif: target.status !== 'Aktif' })
      .eq('id', id)
      .select('id');
    if (err) throw new Error(toMessage(err));
    if (!data || data.length === 0) throw new Error(NO_PERMISSION);
    await loadAll();
  };

  return (
    <DataContext.Provider
      value={{
        products,
        transactions,
        users,
        batches,
        isLoading,
        error,
        refresh,
        addProduct,
        updateProduct,
        deleteProduct,
        addTransaction,
        updateUser,
        toggleUserStatus,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
