import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { categories, Product } from '@/data/dummyData';
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

interface ProductFormData {
  kode: string;
  nama: string;
  kategori: string;
  satuan: 'PCS' | 'BOX' | 'UNIT' | '';
  status: 'Aktif' | 'Tidak Aktif' | '';
}

interface ProductFormProps {
  formData: ProductFormData;
  setFormData: (data: ProductFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  isSaving: boolean;
}

const ProductForm = ({ formData, setFormData, onSubmit, onCancel, submitLabel, isSaving }: ProductFormProps) => (
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
      <Select value={formData.kategori} onValueChange={(v) => setFormData({ ...formData, kategori: v })}>
        <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
        <SelectContent>
          {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Satuan</Label>
        <Select value={formData.satuan} onValueChange={(v) => setFormData({ ...formData, satuan: v as ProductFormData['satuan'] })}>
          <SelectTrigger><SelectValue placeholder="Pilih satuan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="PCS">PCS</SelectItem>
            <SelectItem value="BOX">BOX</SelectItem>
            <SelectItem value="UNIT">UNIT</SelectItem>
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
  const { products, transactions, addProduct, updateProduct, deleteProduct } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    kategori: '',
    satuan: '' as 'PCS' | 'BOX' | 'UNIT' | '',
    status: '' as 'Aktif' | 'Tidak Aktif' | '',
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.kode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKategori = filterKategori === 'all' || product.kategori === filterKategori;
    return matchesSearch && matchesKategori;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  const resetForm = () => {
    setFormData({ kode: '', nama: '', kategori: '', satuan: '', status: '' });
  };

  const handleAdd = async () => {
    if (!formData.kode.trim() || !formData.nama.trim() || !formData.kategori || !formData.satuan || !formData.status) {
      toast({ title: 'Error', description: 'Mohon lengkapi semua field.', variant: 'destructive' });
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
        kategori: formData.kategori,
        satuan: formData.satuan as 'PCS' | 'BOX' | 'UNIT',
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
    if (!formData.kode.trim() || !formData.nama.trim() || !formData.kategori || !formData.satuan || !formData.status) {
      toast({ title: 'Error', description: 'Mohon lengkapi semua field.', variant: 'destructive' });
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
        kategori: formData.kategori,
        satuan: formData.satuan as 'PCS' | 'BOX' | 'UNIT',
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
      kategori: product.kategori,
      satuan: product.satuan,
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
                  placeholder="Cari nama atau kode barang..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                />
              </div>
              <Select value={filterKategori} onValueChange={(v) => { setFilterKategori(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
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
                    <TableHead className="hidden sm:table-cell">Satuan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} dari {filteredProducts.length} data
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
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