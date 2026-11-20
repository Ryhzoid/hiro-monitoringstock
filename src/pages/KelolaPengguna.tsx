import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '@/data/dummyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Users, Edit, Mail, User as UserIcon, Info } from 'lucide-react';

interface UserFormData {
  nama: string;
  email: string;
  role: UserRole | '';
}

interface UserFormProps {
  formData: UserFormData;
  setFormData: (data: UserFormData) => void;
  errors: Record<string, string>;
  onSubmit: () => void;
  onCancel: () => void;
  isSaving: boolean;
  disableRole: boolean;
}

// Didefinisikan DI LUAR KelolaPengguna supaya tidak dibuat ulang setiap render.
// Kalau didefinisikan di dalam, input kehilangan fokus setiap kali mengetik satu huruf.
const UserForm = ({ formData, setFormData, errors, onSubmit, onCancel, isSaving, disableRole }: UserFormProps) => (
  <div className="space-y-4">
    {/* Nama */}
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <UserIcon className="h-4 w-4" />
        Nama Lengkap
      </Label>
      <Input
        value={formData.nama}
        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
        placeholder="Masukkan nama lengkap"
        className={errors.nama ? 'border-destructive' : ''}
      />
      {errors.nama && <p className="text-sm text-destructive">{errors.nama}</p>}
    </div>

    {/* Email (hanya-baca: email diubah lewat dashboard Supabase) */}
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Mail className="h-4 w-4" />
        Email
      </Label>
      <Input value={formData.email} disabled />
      <p className="text-xs text-muted-foreground">
        Email dan password diubah lewat dashboard Supabase (Authentication &gt; Users).
      </p>
    </div>

    {/* Role */}
    <div className="space-y-2">
      <Label>Role</Label>
      <Select
        value={formData.role}
        onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}
        disabled={disableRole}
      >
        <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
          <SelectValue placeholder="Pilih role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin Gudang</SelectItem>
          <SelectItem value="manajer">Manajer Gudang</SelectItem>
        </SelectContent>
      </Select>
      {disableRole && (
        <p className="text-xs text-muted-foreground">Role akun Anda sendiri tidak bisa diubah dari sini.</p>
      )}
      {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
    </div>

    <DialogFooter className="pt-4">
      <Button variant="outline" onClick={onCancel} disabled={isSaving}>
        Batal
      </Button>
      <Button onClick={onSubmit} disabled={isSaving}>
        {isSaving ? 'Menyimpan...' : 'Simpan'}
      </Button>
    </DialogFooter>
  </div>
);

const KelolaPengguna = () => {
  const { users, updateUser, toggleUserStatus } = useData();
  const { user: currentUser } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    nama: '',
    email: '',
    role: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({ nama: '', email: '', role: '' });
    setErrors({});
  };

  const validateEdit = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!formData.role) newErrors.role = 'Pilih role';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = async () => {
    if (!validateEdit() || !editingUser) return;

    setIsSaving(true);
    try {
      await updateUser(editingUser.id, {
        nama: formData.nama.trim(),
        role: formData.role as UserRole,
      });
      toast({ title: 'Berhasil', description: 'Data pengguna berhasil diperbarui.' });
      resetForm();
      setIsEditDialogOpen(false);
      setEditingUser(null);
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

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleUserStatus(user.id);
      toast({
        title: 'Status Diperbarui',
        description: `${user.nama} sekarang ${user.status === 'Aktif' ? 'Nonaktif' : 'Aktif'}.`,
      });
    } catch (err: any) {
      toast({
        title: 'Gagal Mengubah Status',
        description: err?.message || 'Terjadi kesalahan. Coba lagi.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      nama: user.nama,
      email: user.email,
      role: user.role,
    });
    setErrors({});
    setIsEditDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Kelola Akun Pengguna
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Info cara tambah pengguna */}
            <div className="flex gap-3 rounded-lg border bg-muted/40 p-3 mb-6 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                Akun baru, perubahan email, dan reset password dilakukan lewat dashboard Supabase
                (Authentication &gt; Users). Di halaman ini Anda dapat mengubah nama, role, dan status aktif pengguna.
              </p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Pengguna</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <div className="p-4 rounded-lg bg-[hsl(var(--success))]/10">
                <p className="text-sm text-muted-foreground">Aktif</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">
                  {users.filter(u => u.status === 'Aktif').length}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Nonaktif</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {users.filter(u => u.status === 'Nonaktif').length}
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const isSelf = user.id === currentUser?.id;
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.nama}
                          {isSelf && <span className="ml-2 text-xs text-muted-foreground">(Anda)</span>}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {user.role === 'admin' ? 'Admin Gudang' : 'Manajer Gudang'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={user.status === 'Aktif'}
                              onCheckedChange={() => handleToggleStatus(user)}
                              disabled={isSelf}
                            />
                            <span className={`text-xs ${user.status === 'Aktif' ? 'text-[hsl(var(--success))]' : 'text-muted-foreground'}`}>
                              {user.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Pengguna</DialogTitle>
              <DialogDescription>Perbarui nama dan role pengguna.</DialogDescription>
            </DialogHeader>
            <UserForm
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              onSubmit={handleEdit}
              onCancel={() => { resetForm(); setIsEditDialogOpen(false); setEditingUser(null); }}
              isSaving={isSaving}
              disableRole={editingUser?.id === currentUser?.id}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default KelolaPengguna;