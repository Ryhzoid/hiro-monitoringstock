import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PaginationBar } from '@/components/PaginationBar';
import { useData } from '@/contexts/DataContext';
import { Product, Category, Supplier, Unit } from '@/data/dummyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';

const ITEMS_PER_PAGE = 10;
const NO_SUPPLIER = 'none'; // nilai Select untuk "tanpa supplier" (Select tidak boleh bernilai kosong)

interface ProductFormData {
  kode: string;
  nama: string;
  categoryId: string;
  unitId: string;
  supplierId: string; // '' = tanpa supplier
  status: 'Aktif' | 'Tidak Aktif' | '';
}

const emptyForm = (): ProductFormData => ({
  kode: '',
  nama: '',
  categoryId: '',
  unitId: '',
  supplierId: '',
  status: '',
});

interface ProductFormProps {
  formData: ProductFormData;
  setFormData: (data: ProductFormData) => void;
  categories: Category[];
  units: Unit[];
  suppliers: Supplier[];
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  isSaving: boolean;
}

// Didefinisikan di luar halaman supaya input tidak kehilangan fokus saat mengetik.
const ProductForm = ({
  formData, setFormData, categories, units, suppliers, onSubmit, onCancel, submitLabel, isSaving,
}: ProductFormProps) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Kode Barang</Label>
        <Input
          value={formData.kode}
          onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
          placeholder="LED-XXX-001"
        />
      </div>
      <div className="space-y-2">
        <Label>Nama Barang</Label>
        <Input
          value={formData.nama}
          onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
          placeholder="LED Panel 60x60"
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label>Kategori</Label>
      <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
        <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
        <SelectContent>
          {categories.length === 0 ? (
            <div className="px-2 py-3 text-sm text-muted-foreground">
              Belum ada kategori. Tambahkan dulu di menu Kategori.
            </div>
          ) : (
            categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.nama}</SelectItem>)
          )}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label>Supplier/Merk</Label>
      <Select
        value={formData.supplierId || NO_SUPPLIER}
        onValueChange={(v) => setFormData({ ...formData, supplierId: v === NO_SUPPLIER ? '' : v })}
      >
        <SelectTrigger><SelectValue placeholder="Pilih supplier/merk" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_SUPPLIER}>Tanpa supplier</SelectItem>
          {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>)}
        </SelectContent>
      </Select>
      {suppliers.length === 0 && (
        <p className="text-xs text-muted-foreground">Belum ada supplier. Tambahkan di menu Supplier.</p>
      )}
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Satuan</Label>
        <Select value={formData.unitId} onValueChange={(v) => setFormData({ ...formData, unitId: v })}>
          <SelectTrigger><SelectValue placeholder="Pilih satuan" /></SelectTrigger>
          <SelectContent>
            {units.length === 0 ? (
              <div className="px-2 py-3 text-sm text-muted-foreground">
                Belum ada unit aktif. Tambahkan di menu Unit Satuan.
              </div>
            ) : (
              units.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nama} ({u.singkatan})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as ProductFormData['status'] })}>
          <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Aktif">Aktif</SelectItem>
            <SelectItem value="Tidak Aktif">Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={onCancel} disabled={isSaving}>
        Batal
      </Button>
      <Button onClick={onSubmit} disabled={isSaving}>
        {isSaving ? 'Menyimpan...' : submitLabel}
      </Button>
    </DialogFooter>
  </div>
);

const KelolaBarang = () => {
  const {
    products, transactions, categories, units, suppliers,
    addProduct, updateProduct, deleteProduct,
  } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('all'); // id kategori
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm());

  const q = searchTerm.trim().toLowerCase();
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      !q ||
      product.nama.toLowerCase().includes(q) ||
      product.kode.toLowerCase().includes(q) ||
      product.supplier.toLowerCase().includes(q);
    const matchesKategori = filterKategori === 'all' || product.categoryId === filterKategori;
    return matchesSearch && matchesKategori;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Pilihan unit: yang aktif, ditambah unit milik barang yang sedang diedit (walau sudah nonaktif).
  const unitOptions = units.filter(u => u.aktif || u.id === formData.unitId);

  // Barang yang sudah punya riwayat transaksi tidak boleh dihapus (riwayat harus tetap utuh).
  const deleteHasTransactions = productToDelete
    ? transactions.some(t => t.barangId === productToDelete.id)
    : false;

  const isKodeTaken = (kode: string, excludeId?: string) =>
    products.some(p => p.kode.trim().toLowerCase() === kode.trim().toLowerCase() && p.id !== excludeId);

  const showError = (err: any, title = 'Gagal Menyimpan') => {
    toast({
      title,
      description: err?.message || 'Terjadi kesalahan. Coba lagi.',
      variant: 'destructive',
    });
  };

  const resetForm = () => setFormData(emptyForm());

  const isFormComplete = () =>
    formData.kode.trim() && formData.nama.trim() && formData.categoryId && formData.unitId && formData.status;

  const handleAdd = async () => {
    if (!isFormComplete()) {
      toast({
        title: 'Error',
        description: 'Mohon lengkapi kode, nama, kategori, satuan, dan status.',
        variant: 'destructive',
      });
      return;
    }
    if (isKodeTaken(formData.kode)) {
      toast({ title: 'Kode Sudah Dipakai', description: `Kode ${formData.kode.trim()} sudah digunakan barang lain.`, variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      await addProduct({
        kode: formData.kode.trim(),
        nama: formData.nama.trim(),
        categoryId: formData.categoryId,
        unitId: formData.unitId,
        supplierId: formData.supplierId,
        status: formData.status as 'Aktif' | 'Tidak Aktif',
      });
      toast({ title: 'Berhasil', description: 'Barang berhasil ditambahkan.' });
      resetForm();
      setIsAddDialogOpen(false);
    } catch (err) {
      showError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editingProduct) return;
    if (!isFormComplete()) {
      toast({
        title: 'Error',
        description: 'Mohon lengkapi kode, nama, kategori, satuan, dan status.',
        variant: 'destructive',
      });
      return;
    }
    if (isKodeTaken(formData.kode, editingProduct.id)) {
      toast({ title: 'Kode Sudah Dipakai', description: `Kode ${formData.kode.trim()} sudah digunakan barang lain.`, variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      await updateProduct(editingProduct.id, {
        kode: formData.kode.trim(),
        nama: formData.nama.trim(),
        categoryId: formData.categoryId,
        unitId: formData.unitId,
        supplierId: formData.supplierId,
        status: formData.status as 'Aktif' | 'Tidak Aktif',
      });
      toast({ title: 'Berhasil', description: 'Barang berhasil diperbarui.' });
      resetForm();
      setIsEditDialogOpen(false);
      setEditingProduct(null);
    } catch (err) {
      showError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    const target = productToDelete;
    try {
      await deleteProduct(target.id);
      toast({ title: 'Berhasil', description: `${target.nama} berhasil dihapus.` });
    } catch (err) {
      showError(err, 'Gagal Menghapus');
    } finally {
      setProductToDelete(null);
    }
  };

  const handleDeactivate = async () => {
    if (!productToDelete) return;
    const target = productToDelete;
    try {
      await updateProduct(target.id, { status: 'Tidak Aktif' });
      toast({ title: 'Berhasil', description: `${target.nama} dinonaktifkan.` });
    } catch (err) {
      showError(err, 'Gagal Menonaktifkan');
    } finally {
      setProductToDelete(null);
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      kode: product.kode,
      nama: product.nama,
      categoryId: product.categoryId,
      unitId: product.unitId,
      supplierId: product.supplierId,
      status: product.status,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Data Barang
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Barang
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Barang Baru</DialogTitle>
                  <DialogDescription>Masukkan data barang baru ke dalam sistem.</DialogDescription>
                </DialogHeader>
                <ProductForm
                  formData={formData}
                  setFormData={setFormData}
                  categories={categories}
                  units={unitOptions}
                  suppliers={suppliers}
                  onSubmit={handleAdd}
                  onCancel={() => { resetForm(); setIsAddDialogOpen(false); }}
                  submitLabel="Tambah"
                  isSaving={isSaving}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, kode, atau supplier..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
              <Select value={filterKategori} onValueChange={(v) => { setFilterKategori(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Filter kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.nama}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Kode Barang</TableHead>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead className="hidden md:table-cell">Kategori</TableHead>
                    <TableHead className="hidden lg:table-cell">Supplier/Merk</TableHead>
                    <TableHead className="hidden sm:table-cell">Satuan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        {products.length === 0
                          ? 'Belum ada barang. Klik "Tambah Barang" untuk memulai.'
                          : 'Tidak ada data barang ditemukan'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.kode}</TableCell>
                        <TableCell>{product.nama}</TableCell>
                        <TableCell className="hidden md:table-cell">{product.kategori}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {product.supplier || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{product.satuan}</TableCell>
                        <TableCell>
                          <Badge variant={product.status === 'Aktif' ? 'default' : 'secondary'}>
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setProductToDelete(product)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <PaginationBar
              page={currentPage}
              totalPages={totalPages}
              total={filteredProducts.length}
              perPage={ITEMS_PER_PAGE}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Barang</DialogTitle>
              <DialogDescription>Perbarui informasi barang.</DialogDescription>
            </DialogHeader>
            <ProductForm
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              units={unitOptions}
              suppliers={suppliers}
              onSubmit={handleEdit}
              onCancel={() => { resetForm(); setIsEditDialogOpen(false); setEditingProduct(null); }}
              submitLabel="Simpan"
              isSaving={isSaving}
            />
          </DialogContent>
        </Dialog>

        {/* Konfirmasi Hapus */}
        <AlertDialog
          open={!!productToDelete}
          onOpenChange={(open) => { if (!open) setProductToDelete(null); }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteHasTransactions ? 'Barang tidak bisa dihapus' : 'Hapus barang ini?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteHasTransactions
                  ? `${productToDelete?.nama} sudah memiliki riwayat transaksi, jadi tidak bisa dihapus agar riwayatnya tetap utuh. Anda bisa menonaktifkannya supaya tidak muncul lagi di form transaksi.`
                  : `Anda yakin ingin menghapus ${productToDelete?.nama}? Tindakan ini tidak bisa dibatalkan.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              {deleteHasTransactions ? (
                productToDelete?.status === 'Aktif' && (
                  <AlertDialogAction onClick={handleDeactivate}>Nonaktifkan</AlertDialogAction>
                )
              ) : (
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Hapus
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default KelolaBarang;