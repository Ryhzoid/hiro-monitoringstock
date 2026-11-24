import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PaginationBar } from '@/components/PaginationBar';
import { useData } from '@/contexts/DataContext';
import { Unit } from '@/data/dummyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Ruler, Package, CheckCircle2, Plus, Search, Edit, Trash2 } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

interface UnitFormData {
  nama: string;
  singkatan: string;
  aktif: boolean;
}

const emptyForm = (): UnitFormData => ({ nama: '', singkatan: '', aktif: true });

interface UnitFormProps {
  formData: UnitFormData;
  setFormData: (data: UnitFormData) => void;
  errors: Record<string, string>;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  isSaving: boolean;
  showActive: boolean;
}

// Didefinisikan di luar halaman supaya input tidak kehilangan fokus saat mengetik.
const UnitForm = ({ formData, setFormData, errors, onSubmit, onCancel, submitLabel, isSaving, showActive }: UnitFormProps) => (
  <div className="space-y-6">
    <div className="space-y-4">
      <h3 className="text-sm font-semibold border-b pb-2">Informasi Unit</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            Nama Unit <span className="text-destructive">*</span>
          </Label>
          <Input
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            placeholder="Contoh: Pieces, Box, Meter"
            className={errors.nama ? 'border-destructive' : ''}
          />
          {errors.nama && <p className="text-sm text-destructive">{errors.nama}</p>}
        </div>
        <div className="space-y-2">
          <Label>
            Singkatan <span className="text-destructive">*</span>
          </Label>
          <Input
            value={formData.singkatan}
            onChange={(e) => setFormData({ ...formData, singkatan: e.target.value })}
            placeholder="pcs, box"
            className={errors.singkatan ? 'border-destructive' : ''}
          />
          {errors.singkatan && <p className="text-sm text-destructive">{errors.singkatan}</p>}
        </div>
      </div>

      {showActive && (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Unit aktif</p>
            <p className="text-xs text-muted-foreground">
              Unit nonaktif tidak muncul di pilihan satuan saat menambah barang baru.
            </p>
          </div>
          <Switch
            checked={formData.aktif}
            onCheckedChange={(checked) => setFormData({ ...formData, aktif: checked })}
          />
        </div>
      )}
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

const UnitSatuanPage = () => {
  const { units, products, addUnit, updateUnit, deleteUnit } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [toDelete, setToDelete] = useState<Unit | null>(null);
  const [formData, setFormData] = useState<UnitFormData>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const unitAktif = units.filter(u => u.aktif).length;

  const q = searchTerm.trim().toLowerCase();
  const filtered = units.filter(u =>
    !q || u.nama.toLowerCase().includes(q) || u.singkatan.toLowerCase().includes(q)
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

  const openEdit = (unit: Unit) => {
    setEditing(unit);
    setFormData({ nama: unit.nama, singkatan: unit.singkatan, aktif: unit.aktif });
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
    const singkatan = formData.singkatan.trim();
    const newErrors: Record<string, string> = {};

    if (!nama) {
      newErrors.nama = 'Nama unit wajib diisi';
    } else if (units.some(u => u.nama.toLowerCase() === nama.toLowerCase() && u.id !== editing?.id)) {
      newErrors.nama = 'Nama unit sudah ada';
    }

    if (!singkatan) {
      newErrors.singkatan = 'Singkatan wajib diisi';
    } else if (units.some(u => u.singkatan.toLowerCase() === singkatan.toLowerCase() && u.id !== editing?.id)) {
      newErrors.singkatan = 'Singkatan sudah dipakai unit lain';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSaving(true);
    try {
      if (editing) {
        await updateUnit(editing.id, { nama, singkatan, aktif: formData.aktif });
        toast({ title: 'Berhasil', description: 'Unit berhasil diperbarui.' });
      } else {
        await addUnit({ nama, singkatan });
        toast({ title: 'Berhasil', description: 'Unit berhasil ditambahkan.' });
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
      await deleteUnit(target.id);
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
    { label: 'Total Unit', value: units.length, icon: Ruler, color: 'text-[hsl(var(--success))] bg-[hsl(var(--success))]/10' },
    { label: 'Total Produk', value: products.length, icon: Package, color: 'text-[hsl(var(--info))] bg-[hsl(var(--info))]/10' },
    { label: 'Unit Aktif', value: unitAktif, icon: CheckCircle2, color: 'text-primary bg-primary/10' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Unit Satuan</h1>
            <p className="text-muted-foreground">Kelola unit satuan produk</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Unit
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
                placeholder="Cari unit..."
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
                    <TableHead>Singkatan</TableHead>
                    <TableHead className="text-center">Jumlah Produk</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                        {units.length === 0
                          ? 'Belum ada unit. Klik "Tambah Unit" untuk memulai.'
                          : 'Tidak ada unit ditemukan'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[hsl(var(--success))]/10">
                              <Ruler className="h-4 w-4 text-[hsl(var(--success))]" />
                            </div>
                            <span className="font-medium">{unit.nama}</span>
                            {!unit.aktif && <Badge variant="secondary">Nonaktif</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">{unit.singkatan}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{unit.jumlahProduk} produk</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(unit)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setToDelete(unit)}>
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
              <DialogTitle>{editing ? 'Edit Unit' : 'Tambah Unit Baru'}</DialogTitle>
              <DialogDescription>
                {editing ? 'Perbarui data unit satuan.' : 'Masukkan informasi unit satuan baru'}
              </DialogDescription>
            </DialogHeader>
            <UnitForm
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              onSubmit={handleSubmit}
              onCancel={closeDialog}
              submitLabel={editing ? 'Simpan' : 'Tambah'}
              isSaving={isSaving}
              showActive={!!editing}
            />
          </DialogContent>
        </Dialog>

        {/* Konfirmasi hapus */}
        <AlertDialog open={!!toDelete} onOpenChange={(open) => { if (!open) setToDelete(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {toDelete && toDelete.jumlahProduk > 0 ? 'Unit tidak bisa dihapus' : 'Hapus unit ini?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {toDelete && toDelete.jumlahProduk > 0
                  ? `${toDelete.nama} masih dipakai oleh ${toDelete.jumlahProduk} barang. Ganti unit barang-barang tersebut di Kelola Data Barang terlebih dahulu, atau nonaktifkan unit ini lewat tombol edit.`
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

export default UnitSatuanPage;