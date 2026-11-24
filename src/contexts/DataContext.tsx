import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Product, Transaction, User, StockBatch, UserRole, Category, Supplier, Unit } from '@/data/dummyData';

// Data baru untuk transaksi. Nama barang dan pencatat diambil otomatis oleh database.
export interface NewTransaction {
  tanggal: string;
  jenis: 'Masuk' | 'Keluar';
  barangId: string;
  jumlah: number;
  keterangan: string;
  batchAllocations?: { batchId: string; jumlah: number }[];
}

// Barang baru: kategori, unit, dan supplier dipilih lewat id ('' = tanpa supplier).
export interface NewProduct {
  kode: string;
  nama: string;
  categoryId: string;
  unitId: string;
  supplierId: string;
  status: 'Aktif' | 'Tidak Aktif';
}

export interface SupplierInput {
  nama: string;
  npwp: string;
  contactPerson: string;
  telepon: string;
  email: string;
  alamat: string;
}

export interface CategoryInput {
  nama: string;
  kode: string; // '' = tanpa kode
  deskripsi: string;
}

export interface UnitInput {
  nama: string;
  singkatan: string;
  aktif?: boolean;
}

interface DataContextType {
  products: Product[];
  transactions: Transaction[];
  users: User[];
  batches: StockBatch[];
  categories: Category[];
  suppliers: Supplier[];
  units: Unit[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addProduct: (product: NewProduct) => Promise<void>;
  updateProduct: (id: string, updates: Partial<NewProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addTransaction: (transaction: NewTransaction) => Promise<void>;
  cancelTransaction: (dbId: number, alasan: string) => Promise<void>;
  updateUser: (id: string, updates: { nama?: string; role?: UserRole }) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
  addSupplier: (input: SupplierInput) => Promise<void>;
  updateSupplier: (id: string, input: SupplierInput) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addCategory: (input: CategoryInput) => Promise<void>;
  updateCategory: (id: string, input: CategoryInput) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addUnit: (input: UnitInput) => Promise<void>;
  updateUnit: (id: string, input: UnitInput) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
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

// Teks kosong disimpan sebagai NULL.
const nul = (v: string | undefined) => (v && v.trim() !== '' ? v.trim() : null);

// Menjalankan perintah tulis ke database dan menerjemahkan errornya.
// requireRow: anggap gagal kalau tidak ada baris yang terpengaruh (diblokir RLS).
const runWrite = async (
  query: PromiseLike<{ data: any; error: any }>,
  messages: { unique?: string; fk?: string } = {},
  requireRow = false
) => {
  const { data, error: err } = await query;
  if (err) {
    if (err.code === '23505' && messages.unique) throw new Error(messages.unique);
    if (err.code === '23503' && messages.fk) throw new Error(messages.fk);
    throw new Error(toMessage(err));
  }
  if (requireRow && (!data || data.length === 0)) throw new Error(NO_PERMISSION);
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const [catRes, productRows, stockRows, trxRows, batchRows, userRes, unitRes, supplierRes] = await Promise.all([
        supabase.from('categories').select('id, nama, kode, deskripsi').order('nama'),
        fetchAll((from, to) =>
          supabase
            .from('products')
            .select('id, kode, nama, aktif, category_id, unit_id, supplier_id')
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
            .select('id, tanggal, jenis, product_id, jumlah, keterangan, dibatalkan, dibatalkan_oleh, dibatalkan_pada, alasan_pembatalan, products(nama), profiles(nama)')
            .order('id', { ascending: false })
            .range(from, to)
        ),
        fetchAll((from, to) =>
          supabase
            .from('stock_batches')
            .select('id, product_id, transaction_id, tanggal, jumlah_awal, sisa')
            .order('id')
            .range(from, to)
        ),
        supabase.from('profiles').select('id, nama, email, role, aktif').order('nama'),
        supabase.from('units').select('id, nama, singkatan, aktif').order('nama'),
        supabase
          .from('suppliers')
          .select('id, nama, npwp, contact_person, telepon, email, alamat')
          .order('nama'),
      ]);

      if (catRes.error) throw catRes.error;
      if (userRes.error) throw userRes.error;
      if (unitRes.error) throw unitRes.error;
      if (supplierRes.error) throw supplierRes.error;
      if (token !== loadToken.current) return; // sudah ada pemuatan yang lebih baru / user logout

      // Nama kategori / unit / supplier berdasarkan id, untuk melengkapi data barang.
      const catName = new Map<string, string>((catRes.data ?? []).map((c: any) => [String(c.id), c.nama]));
      const unitAbbr = new Map<string, string>((unitRes.data ?? []).map((u: any) => [String(u.id), u.singkatan]));
      const supplierName = new Map<string, string>((supplierRes.data ?? []).map((x: any) => [String(x.id), x.nama]));

      const stockByProduct: Record<string, { masuk: number; keluar: number }> = {};
      stockRows.forEach((s: any) => {
        stockByProduct[s.product_id] = { masuk: s.total_masuk, keluar: s.total_keluar };
      });

      setProducts(
        productRows.map((p: any): Product => ({
          id: p.id,
          kode: p.kode,
          nama: p.nama,
          kategori: catName.get(String(p.category_id)) ?? '-',
          categoryId: String(p.category_id),
          satuan: unitAbbr.get(String(p.unit_id)) ?? '-',
          unitId: String(p.unit_id),
          supplier: p.supplier_id != null ? supplierName.get(String(p.supplier_id)) ?? '' : '',
          supplierId: p.supplier_id != null ? String(p.supplier_id) : '',
          status: p.aktif ? 'Aktif' : 'Tidak Aktif',
          stokAwal: 0,
          totalMasuk: stockByProduct[p.id]?.masuk ?? 0,
          totalKeluar: stockByProduct[p.id]?.keluar ?? 0,
        }))
      );

      const nameById: Record<string, string> = Object.fromEntries(
        (userRes.data ?? []).map((u: any) => [u.id, u.nama])
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
            dbId: t.id,
            dibatalkan: !!t.dibatalkan,
            alasanPembatalan: t.alasan_pembatalan ?? undefined,
            dibatalkanOleh: t.dibatalkan_oleh ? nameById[t.dibatalkan_oleh] ?? '-' : undefined,
            dibatalkanPada: t.dibatalkan_pada ?? undefined,
          }))
          .sort((a, b) => b.tanggal.localeCompare(a.tanggal)) // urutan id menurun tetap terjaga per tanggal
      );

      // Batch dari transaksi Masuk yang dibatalkan tidak ditampilkan lagi.
      const voidedTrxIds = new Set(trxRows.filter((t: any) => t.dibatalkan).map((t: any) => t.id));

      setBatches(
        batchRows
          .filter((b: any) => !voidedTrxIds.has(b.transaction_id))
          .map((b: any): StockBatch => ({
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

      // Jumlah barang per kategori / unit / supplier, dan jumlah transaksi per supplier.
      const countProducts = (field: string) => {
        const counts: Record<string, number> = {};
        productRows.forEach((p: any) => {
          if (p[field] != null) counts[String(p[field])] = (counts[String(p[field])] ?? 0) + 1;
        });
        return counts;
      };
      const perCategory = countProducts('category_id');
      const perUnit = countProducts('unit_id');
      const perSupplier = countProducts('supplier_id');

      const supplierOfProduct: Record<string, string> = {};
      productRows.forEach((p: any) => {
        if (p.supplier_id != null) supplierOfProduct[p.id] = String(p.supplier_id);
      });
      const trxPerSupplier: Record<string, number> = {};
      trxRows.forEach((t: any) => {
        const sid = supplierOfProduct[t.product_id];
        if (sid && !t.dibatalkan) trxPerSupplier[sid] = (trxPerSupplier[sid] ?? 0) + 1;
      });

      setCategories(
        (catRes.data ?? []).map((c: any): Category => ({
          id: String(c.id),
          nama: c.nama,
          kode: c.kode ?? '',
          deskripsi: c.deskripsi ?? '',
          jumlahProduk: perCategory[String(c.id)] ?? 0,
        }))
      );

      setUnits(
        (unitRes.data ?? []).map((u: any): Unit => ({
          id: String(u.id),
          nama: u.nama,
          singkatan: u.singkatan,
          aktif: !!u.aktif,
          jumlahProduk: perUnit[String(u.id)] ?? 0,
        }))
      );

      setSuppliers(
        (supplierRes.data ?? []).map((x: any): Supplier => ({
          id: String(x.id),
          nama: x.nama,
          npwp: x.npwp ?? '',
          contactPerson: x.contact_person ?? '',
          telepon: x.telepon ?? '',
          email: x.email ?? '',
          alamat: x.alamat ?? '',
          jumlahProduk: perSupplier[String(x.id)] ?? 0,
          jumlahTransaksi: trxPerSupplier[String(x.id)] ?? 0,
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
      setCategories([]);
      setSuppliers([]);
      setUnits([]);
      setError(null);
      setLoadedFor(null);
    }
  }, [userId, loadAll]);

  const refresh = async () => {
    await loadAll();
  };

  // ---------- Barang ----------

  const addProduct = async (product: NewProduct) => {
    await runWrite(
      supabase.from('products').insert({
        kode: product.kode,
        nama: product.nama,
        category_id: Number(product.categoryId),
        unit_id: Number(product.unitId),
        supplier_id: product.supplierId ? Number(product.supplierId) : null,
        aktif: product.status === 'Aktif',
      }),
      { unique: 'Kode barang sudah digunakan barang lain.' }
    );
    await loadAll();
  };

  const updateProduct = async (id: string, updates: Partial<NewProduct>) => {
    const payload: Record<string, any> = {};
    if (updates.kode !== undefined) payload.kode = updates.kode;
    if (updates.nama !== undefined) payload.nama = updates.nama;
    if (updates.categoryId !== undefined) payload.category_id = Number(updates.categoryId);
    if (updates.unitId !== undefined) payload.unit_id = Number(updates.unitId);
    if (updates.supplierId !== undefined) {
      payload.supplier_id = updates.supplierId ? Number(updates.supplierId) : null;
    }
    if (updates.status !== undefined) payload.aktif = updates.status === 'Aktif';

    await runWrite(
      supabase.from('products').update(payload).eq('id', id).select('id'),
      { unique: 'Kode barang sudah digunakan barang lain.' },
      true
    );
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

  // ---------- Supplier ----------

  const supplierPayload = (x: SupplierInput) => ({
    nama: x.nama.trim(),
    npwp: nul(x.npwp),
    contact_person: nul(x.contactPerson),
    telepon: nul(x.telepon),
    email: nul(x.email),
    alamat: nul(x.alamat),
  });

  const addSupplier = async (input: SupplierInput) => {
    await runWrite(supabase.from('suppliers').insert(supplierPayload(input)), {
      unique: 'Nama supplier sudah terdaftar.',
    });
    await loadAll();
  };

  const updateSupplier = async (id: string, input: SupplierInput) => {
    await runWrite(
      supabase.from('suppliers').update(supplierPayload(input)).eq('id', Number(id)).select('id'),
      { unique: 'Nama supplier sudah terdaftar.' },
      true
    );
    await loadAll();
  };

  const deleteSupplier = async (id: string) => {
    await runWrite(
      supabase.from('suppliers').delete().eq('id', Number(id)).select('id'),
      { fk: 'Supplier masih dipakai oleh barang. Ganti supplier barang tersebut dulu.' },
      true
    );
    await loadAll();
  };

  // ---------- Kategori ----------

  const categoryPayload = (x: CategoryInput) => ({
    nama: x.nama.trim(),
    kode: x.kode.trim() ? x.kode.trim().toUpperCase() : null,
    deskripsi: nul(x.deskripsi),
  });

  const addCategory = async (input: CategoryInput) => {
    await runWrite(supabase.from('categories').insert(categoryPayload(input)), {
      unique: 'Nama atau kode kategori sudah dipakai.',
    });
    await loadAll();
  };

  const updateCategory = async (id: string, input: CategoryInput) => {
    await runWrite(
      supabase.from('categories').update(categoryPayload(input)).eq('id', Number(id)).select('id'),
      { unique: 'Nama atau kode kategori sudah dipakai.' },
      true
    );
    await loadAll();
  };

  const deleteCategory = async (id: string) => {
    await runWrite(
      supabase.from('categories').delete().eq('id', Number(id)).select('id'),
      { fk: 'Kategori masih dipakai oleh barang. Pindahkan barang tersebut ke kategori lain dulu.' },
      true
    );
    await loadAll();
  };

  // ---------- Unit satuan ----------

  const unitPayload = (x: UnitInput) => {
    const payload: Record<string, any> = { nama: x.nama.trim(), singkatan: x.singkatan.trim() };
    if (x.aktif !== undefined) payload.aktif = x.aktif;
    return payload;
  };

  const addUnit = async (input: UnitInput) => {
    await runWrite(supabase.from('units').insert(unitPayload(input)), {
      unique: 'Nama atau singkatan unit sudah dipakai.',
    });
    await loadAll();
  };

  const updateUnit = async (id: string, input: UnitInput) => {
    await runWrite(
      supabase.from('units').update(unitPayload(input)).eq('id', Number(id)).select('id'),
      { unique: 'Nama atau singkatan unit sudah dipakai.' },
      true
    );
    await loadAll();
  };

  const deleteUnit = async (id: string) => {
    await runWrite(
      supabase.from('units').delete().eq('id', Number(id)).select('id'),
      { fk: 'Unit masih dipakai oleh barang. Ganti unit barang tersebut dulu.' },
      true
    );
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

  // Pembatalan (koreksi) transaksi: hanya manajer (dicek di database).
  // Transaksi tidak dihapus, hanya ditandai dibatalkan beserta alasannya.
  const cancelTransaction = async (dbId: number, alasan: string) => {
    const { error: err } = await supabase.rpc('batalkan_transaksi', {
      p_transaksi_id: dbId,
      p_alasan: alasan,
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
        categories,
        suppliers,
        units,
        isLoading,
        error,
        refresh,
        addProduct,
        updateProduct,
        deleteProduct,
        addTransaction,
        cancelTransaction,
        updateUser,
        toggleUserStatus,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addCategory,
        updateCategory,
        deleteCategory,
        addUnit,
        updateUnit,
        deleteUnit,
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