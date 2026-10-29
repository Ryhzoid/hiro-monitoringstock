import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { User, UserRole } from '@/data/dummyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Users, Plus, Edit, UserCheck, UserX, Mail, Lock, User as UserIcon } from 'lucide-react';

const KelolaPengguna = () => {
  const { users, addUser, updateUser, toggleUserStatus } = useData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as UserRole | '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({ nama: '', email: '', password: '', confirmPassword: '', role: '' });
    setErrors({});
  };

  const validateAdd = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nama) newErrors.nama = 'Nama wajib diisi';
    if (!formData.email) newErrors.email = 'Email wajib diisi';
    if (!formData.email.includes('@')) newErrors.email = 'Format email tidak valid';
    if (!formData.password) newErrors.password = 'Password wajib diisi';
    if (formData.password.length < 6) newErrors.password = 'Password minimal 6 karakter';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Password tidak cocok';
    if (!formData.role) newErrors.role = 'Pilih role';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEdit = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nama) newErrors.nama = 'Nama wajib diisi';
    if (!formData.email) newErrors.email = 'Email wajib diisi';
    if (!formData.role) newErrors.role = 'Pilih role';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    if (!validateAdd()) return;
    addUser({
      nama: formData.nama,
      email: formData.email,
      password: formData.password,
      role: formData.role as UserRole,
      status: 'Aktif',
    });
    toast({ title: 'Berhasil', description: 'Pengguna berhasil ditambahkan.' });
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = () => {
    if (!validateEdit() || !editingUser) return;
    updateUser(editingUser.id, {
      nama: formData.nama,
      email: formData.email,
      role: formData.role as UserRole,
    });
    toast({ title: 'Berhasil', description: 'Data pengguna berhasil diperbarui.' });
    resetForm();
    setIsEditDialogOpen(false);
    setEditingUser(null);
  };

  const handleToggleStatus = (user: User) => {
    toggleUserStatus(user.id);
    toast({ 
      title: 'Status Diperbarui', 
      description: `${user.nama} sekarang ${user.status === 'Aktif' ? 'Nonaktif' : 'Aktif'}.` 
    });
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      nama: user.nama,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const UserForm = ({ onSubmit, submitLabel, isEdit = false }: { onSubmit: () => void; submitLabel: string; isEdit?: boolean }) => (
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

      {/* Email */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email
        </Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@hirotakashimura.com"
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      {/* Password - Only for Add */}
      {!isEdit && (
        <>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Password
            </Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimal 6 karakter"
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Konfirmasi Password
            </Label>
            <Input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Ulangi password"
              className={errors.confirmPassword ? 'border-destructive' : ''}
            />
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
          </div>
        </>
      )}

      {/* Role */}
      <div className="space-y-2">
        <Label>Role</Label>
        <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}>
          <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
            <SelectValue placeholder="Pilih role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin Gudang</SelectItem>
            <SelectItem value="manajer">Manajer Gudang</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
      </div>

      <DialogFooter className="pt-4">
        <Button variant="outline" onClick={() => { resetForm(); setIsAddDialogOpen(false); setIsEditDialogOpen(false); }}>
          Batal
        </Button>
        <Button onClick={onSubmit}>{submitLabel}</Button>
      </DialogFooter>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Kelola Akun Pengguna
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Pengguna
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                  <DialogDescription>Buat akun pengguna baru untuk mengakses sistem.</DialogDescription>
                </DialogHeader>
                <UserForm onSubmit={handleAdd} submitLabel="Tambah" />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
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
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nama}</TableCell>
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
                  ))}
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
              <DialogDescription>Perbarui informasi pengguna.</DialogDescription>
            </DialogHeader>
            <UserForm onSubmit={handleEdit} submitLabel="Simpan" isEdit />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default KelolaPengguna;
