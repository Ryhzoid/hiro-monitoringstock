import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PaginationBar } from '@/components/PaginationBar';
import { useData } from '@/contexts/DataContext';
import { Supplier } from '@/data/dummyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Truck, Package, ArrowLeftRight, Plus, Search, Edit, Trash2 } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

interface SupplierFormData {
  nama: string;
  npwp: string;
  contactPerson: string;
  telepon: string;
  email: string;
  alamat: string;
}

const emptyForm = (): SupplierFormData => ({
  nama: '',
  npwp: '',
  contactPerson: '',
  telepon: '',
  email: '',
  alamat: '',
});

interface SupplierFormProps {
  formData: SupplierFormData;
  setFormData: (data: SupplierFormData) => void;
  errors: Record<string, string>;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  isSaving: boolean;
}

// Didefinisikan di luar halaman supaya input tidak kehilangan fokus saat mengetik.
const SupplierForm = ({ formData, setFormData, errors, onSubmit, onCancel, submitLabel, isSaving }: SupplierFormProps) => (
  <div className="space-y-6">
    <div className="space-y-4">
      <h3 className="text-sm font-semibold border-b pb-2">Identitas Supplier</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            Nama Supplier/Merk <span className="text-destructive">*</span>
          </Label>
          <Input
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            placeholder="Contoh: PT. Mora Lighting"
            className={errors.nama ? 'border-destructive' : ''}
          />
          {errors.nama && <p className="text-sm text-destructive">{errors.nama}</p>}
        </div>
        <div className="space-y-2">
          <Label>NPWP</Label>
          <Input
            value={formData.npwp}
            onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
            placeholder="00.000.000.0-000.000"
          />
        </div>
      </div>
    </div>

    <div className="space-y-4">
      <h3 className="text-sm font-semibold border-b pb-2">Kontak &amp; Alamat</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Contact Person</Label>
          <Input
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            placeholder="Nama PIC"
          />
        </div>
        <div className="space-y-2">
          <Label>Telepon</Label>
          <Input
            value={formData.telepon}
            onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
            placeholder="021-xxxxxxx"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@perusahaan.com"
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>
      <div className="space-y-2">
        <Label>Alamat Lengkap</Label>
        <Textarea
          value={formData.alamat}
          onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
          placeholder="Jl. Lengkap No. 123"
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

const SupplierPage = () => {
  const { suppliers, products, addSupplier, updateSupplier, deleteSupplier } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [toDelete, setToDelete] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const totalProdukBersupplier = products.filter(p => p.supplierId).length;
  const totalTransaksi = suppliers.reduce((sum, s) => sum + s.jumlahTransaksi, 0);

  const q = searchTerm.trim().toLowerCase();
  const filtered = suppliers.filter(s =>
    !q || [s.nama, s.contactPerson, s.telepon, s.email, s.alamat].some(v => v.toLowerCase().includes(q))
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

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setFormData({
      nama: supplier.nama,
      npwp: supplier.npwp,
      contactPerson: supplier.contactPerson,
      telepon: supplier.telepon,
      email: supplier.email,
      alamat: supplier.alamat,
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditing(null);
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const nama = formData.nama.trim();

    if (!nama) {
      newErrors.nama = 'Nama supplier wajib diisi';
    } else if (suppliers.some(s => s.nama.toLowerCase() === nama.toLowerCase() && s.id !== editing?.id)) {
      newErrors.nama = 'Nama supplier sudah terdaftar';
    }
    if (formData.email.trim() && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      newErrors.email = 'Format email tidak valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      if (editing) {
        await updateSupplier(editing.id, formData);
        toast({ title: 'Berhasil', description: 'Data supplier berhasil diperbarui.' });
      } else {
        await addSupplier(formData);
        toast({ title: 'Berhasil', description: 'Supplier berhasil ditambahkan.' });
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
      await deleteSupplier(target.id);
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
    { label: 'Total Supplier', value: suppliers.length, icon: Truck, color: 'text-primary bg-primary/10' },
    { label: 'Total Produk', value: totalProdukBersupplier, icon: Package, color: 'text-[hsl(var(--success))] bg-[hsl(var(--success))]/10' },
    { label: 'Total Transaksi', value: totalTransaksi, icon: ArrowLeftRight, color: 'text-[hsl(var(--info))] bg-[hsl(var(--info))]/10' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Supplier</h1>
            <p className="text-muted-foreground">Kelola data supplier</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Supplier
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
                placeholder="Cari supplier..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nama Supplier/Merk</TableHead>
                    <TableHead className="hidden md:table-cell">Kontak</TableHead>
                    <TableHead className="text-center">Produk</TableHead>
                    <TableHead className="text-center">Transaksi</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        {suppliers.length === 0
                          ? 'Belum ada supplier. Klik "Tambah Supplier" untuk memulai.'
                          : 'Tidak ada supplier ditemukan'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <p className="font-medium">{supplier.nama}</p>
                          {supplier.alamat && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">{supplier.alamat}</p>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {supplier.contactPerson && <p className="text-sm">{supplier.contactPerson}</p>}
                          {supplier.telepon && <p className="text-xs text-muted-foreground">{supplier.telepon}</p>}
                        </TableCell>
                        <TableCell className="text-center">{supplier.jumlahProduk}</TableCell>
                        <TableCell className="text-center">{supplier.jumlahTransaksi}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(supplier)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setToDelete(supplier)}>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Supplier' : 'Tambah Supplier'}</DialogTitle>
              <DialogDescription>
                {editing ? 'Perbarui data supplier.' : 'Isi form untuk menambahkan supplier baru'}
              </DialogDescription>
            </DialogHeader>
            <SupplierForm
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              onSubmit={handleSubmit}
              onCancel={closeDialog}
              submitLabel={editing ? 'Simpan' : 'Tambah Supplier'}
              isSaving={isSaving}
            />
          </DialogContent>
        </Dialog>

        {/* Konfirmasi hapus */}
        <AlertDialog open={!!toDelete} onOpenChange={(open) => { if (!open) setToDelete(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {toDelete && toDelete.jumlahProduk > 0 ? 'Supplier tidak bisa dihapus' : 'Hapus supplier ini?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {toDelete && toDelete.jumlahProduk > 0
                  ? `${toDelete.nama} masih dipakai oleh ${toDelete.jumlahProduk} barang. Ganti supplier barang-barang tersebut di Kelola Data Barang terlebih dahulu.`
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

export default SupplierPage;