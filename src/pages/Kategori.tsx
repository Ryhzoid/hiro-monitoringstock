import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PaginationBar } from '@/components/PaginationBar';
import { useData } from '@/contexts/DataContext';
import { Category } from '@/data/dummyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { toast } from '@/hooks/use-toast';
import { Tag, Package, PackageX, Plus, Search, Edit, Trash2 } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

interface CategoryFormData {
  nama: string;
  kode: string;
  deskripsi: string;
}

const emptyForm = (): CategoryFormData => ({ nama: '', kode: '', deskripsi: '' });

// Kode otomatis dari nama: tiap kata diambil maksimal 4 huruf/angka, digabung dengan "-".
// Contoh: "Downlight Spot" -> "DOWN-SPOT".
const buatKode = (nama: string) =>
  nama
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Z0-9]/g, '').slice(0, 4))
    .filter(Boolean)
    .join('-');

interface CategoryFormProps {
  formData: CategoryFormData;
  setFormData: (data: CategoryFormData) => void;
  errors: Record<string, string>;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  isSaving: boolean;
}

// Didefinisikan di luar halaman supaya input tidak kehilangan fokus saat mengetik.
const CategoryForm = ({ formData, setFormData, errors, onSubmit, onCancel, submitLabel, isSaving }: CategoryFormProps) => (
  <div className="space-y-6">
    <div className="space-y-4">
      <h3 className="text-sm font-semibold border-b pb-2">Informasi Kategori</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            Nama Kategori <span className="text-destructive">*</span>
          </Label>
          <Input
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            placeholder="Contoh: Downlight, Panel Light, Strip LED"
            className={errors.nama ? 'border-destructive' : ''}
          />
          {errors.nama && <p className="text-sm text-destructive">{errors.nama}</p>}
        </div>
        <div className="space-y-2">
          <Label>Kode SKU</Label>
          <Input
            value={formData.kode}
            onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
            placeholder="Kosongkan untuk otomatis"
            className={errors.kode ? 'border-destructive' : ''}
          />
          {errors.kode ? (
            <p className="text-sm text-destructive">{errors.kode}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Opsional. Kosongkan agar diturunkan otomatis dari nama kategori, mis. &quot;Downlight Spot&quot; → DOWN-SPOT
            </p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Deskripsi</Label>
        <Textarea
          value={formData.deskripsi}
          onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
          placeholder="Deskripsi kategori (opsional)"
          rows={3}
        />
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

const KategoriPage = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const tanpaProduk = categories.filter(c => c.jumlahProduk === 0).length;

  const q = searchTerm.trim().toLowerCase();
  const filtered = categories.filter(c =>
    !q || [c.nama, c.kode, c.deskripsi].some(v => v.toLowerCase().includes(q))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openAdd = () => {
    setEditing(null);
    setFormData(emptyForm());
    setErrors({});
    setIsDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setFormData({ nama: category.nama, kode: category.kode, deskripsi: category.deskripsi });
    setErrors({});
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditing(null);
    setErrors({});
  };

  const handleSubmit = async () => {
    const nama = formData.nama.trim();
    const newErrors: Record<string, string> = {};

    if (!nama) {
      newErrors.nama = 'Nama kategori wajib diisi';
    } else if (categories.some(c => c.nama.toLowerCase() === nama.toLowerCase() && c.id !== editing?.id)) {
      newErrors.nama = 'Nama kategori sudah ada';
    }

    const kodeManual = formData.kode.trim().toUpperCase();
    const kode = kodeManual || buatKode(nama);
    if (kode && categories.some(c => c.kode.toUpperCase() === kode && c.id !== editing?.id)) {
      newErrors.kode = kodeManual
        ? 'Kode sudah dipakai kategori lain'
        : `Kode otomatis "${kode}" sudah dipakai kategori lain. Isi kode secara manual.`;
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSaving(true);
    try {
      const payload = { nama, kode, deskripsi: formData.deskripsi };
      if (editing) {
        await updateCategory(editing.id, payload);
        toast({ title: 'Berhasil', description: 'Kategori berhasil diperbarui.' });
      } else {
        await addCategory(payload);
        toast({ title: 'Berhasil', description: 'Kategori berhasil ditambahkan.' });
      }
      closeDialog();
    } catch (err: any) {
      toast({
        title: 'Gagal Menyimpan',
        description: err?.message || 'Terjadi kesalahan. Coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    const target = toDelete;
    try {
      await deleteCategory(target.id);
      toast({ title: 'Berhasil', description: `${target.nama} berhasil dihapus.` });
    } catch (err: any) {
      toast({
        title: 'Gagal Menghapus',
        description: err?.message || 'Terjadi kesalahan. Coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setToDelete(null);
    }
  };

  const stats = [
    { label: 'Total Kategori', value: categories.length, icon: Tag, color: 'text-[hsl(var(--success))] bg-[hsl(var(--success))]/10' },
    { label: 'Total Produk', value: products.length, icon: Package, color: 'text-[hsl(var(--info))] bg-[hsl(var(--info))]/10' },
    { label: 'Tanpa Produk', value: tanpaProduk, icon: PackageX, color: 'text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kategori</h1>
            <p className="text-muted-foreground">Kelola kategori produk</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kategori
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`p-3 rounded-lg ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabel */}
        <Card>
          <CardContent className="p-6">
            <div className="relative max-w-md mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kategori..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nama</TableHead>
                    <TableHead className="hidden sm:table-cell">Kode</TableHead>
                    <TableHead className="hidden md:table-cell">Deskripsi</TableHead>
                    <TableHead className="text-center">Jumlah Produk</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        {categories.length === 0
                          ? 'Belum ada kategori. Klik "Tambah Kategori" untuk memulai.'
                          : 'Tidak ada kategori ditemukan'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[hsl(var(--success))]/10">
                              <Tag className="h-4 w-4 text-[hsl(var(--success))]" />
                            </div>
                            <span className="font-medium">{category.nama}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {category.kode || '-'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs truncate">
                          {category.deskripsi || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{category.jumlahProduk} produk</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setToDelete(category)}>
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
              total={filtered.length}
              perPage={ITEMS_PER_PAGE}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>

        {/* Dialog tambah / edit */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
              <DialogDescription>
                {editing ? 'Perbarui data kategori.' : 'Isi form berikut untuk menambah kategori baru'}
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              onSubmit={handleSubmit}
              onCancel={closeDialog}
              submitLabel={editing ? 'Simpan' : 'Tambah Kategori'}
              isSaving={isSaving}
            />
          </DialogContent>
        </Dialog>

        {/* Konfirmasi hapus */}
        <AlertDialog open={!!toDelete} onOpenChange={(open) => { if (!open) setToDelete(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {toDelete && toDelete.jumlahProduk > 0 ? 'Kategori tidak bisa dihapus' : 'Hapus kategori ini?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {toDelete && toDelete.jumlahProduk > 0
                  ? `${toDelete.nama} masih dipakai oleh ${toDelete.jumlahProduk} barang. Pindahkan barang-barang tersebut ke kategori lain di Kelola Data Barang terlebih dahulu.`
                  : `Anda yakin ingin menghapus ${toDelete?.nama}? Tindakan ini tidak bisa dibatalkan.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{toDelete && toDelete.jumlahProduk > 0 ? 'Tutup' : 'Batal'}</AlertDialogCancel>
              {toDelete && toDelete.jumlahProduk === 0 && (
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

export default KategoriPage;