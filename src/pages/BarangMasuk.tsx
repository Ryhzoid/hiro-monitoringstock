import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowDownToLine, Calendar, Package, Hash, FileText } from 'lucide-react';

const BarangMasuk = () => {
  const { products, addTransaction } = useData();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    barangId: '',
    jumlah: '',
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeProducts = products.filter(p => p.status === 'Aktif');

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.barangId) {
      newErrors.barangId = 'Pilih barang terlebih dahulu';
    }
    if (!formData.jumlah || parseInt(formData.jumlah) <= 0) {
      newErrors.jumlah = 'Jumlah harus lebih dari 0';
    }
    if (!formData.tanggal) {
      newErrors.tanggal = 'Pilih tanggal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const selectedProduct = products.find(p => p.id === formData.barangId);
    
    addTransaction({
      tanggal: formData.tanggal,
      jenis: 'Masuk',
      barangId: formData.barangId,
      namaBarang: selectedProduct?.nama || '',
      jumlah: parseInt(formData.jumlah),
      keterangan: formData.keterangan || 'Barang masuk',
      userInput: user?.nama || 'Admin',
    });

    toast({
      title: 'Berhasil!',
      description: `${selectedProduct?.nama} sebanyak ${formData.jumlah} unit berhasil ditambahkan ke stok.`,
    });

    setFormData({
      barangId: '',
      jumlah: '',
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: '',
    });
    setErrors({});
    setIsLoading(false);
  };

  const handleReset = () => {
    setFormData({
      barangId: '',
      jumlah: '',
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: '',
    });
    setErrors({});
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--success))]/10">
                <ArrowDownToLine className="h-6 w-6 text-[hsl(var(--success))]" />
              </div>
              <div>
                <CardTitle>Input Barang Masuk</CardTitle>
                <CardDescription>Catat barang yang masuk ke gudang</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pilih Barang */}
              <div className="space-y-2">
                <Label htmlFor="barang" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Pilih Barang <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.barangId} onValueChange={(v) => setFormData({ ...formData, barangId: v })}>
                  <SelectTrigger className={errors.barangId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Cari dan pilih barang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeProducts.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        <span className="font-medium">{product.kode}</span> - {product.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.barangId && <p className="text-sm text-destructive">{errors.barangId}</p>}
              </div>

              {/* Jumlah */}
              <div className="space-y-2">
                <Label htmlFor="jumlah" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Jumlah Barang <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="jumlah"
                  type="number"
                  min="1"
                  value={formData.jumlah}
                  onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                  placeholder="Masukkan jumlah"
                  className={errors.jumlah ? 'border-destructive' : ''}
                />
                {errors.jumlah && <p className="text-sm text-destructive">{errors.jumlah}</p>}
              </div>

              {/* Tanggal */}
              <div className="space-y-2">
                <Label htmlFor="tanggal" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tanggal Masuk <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tanggal"
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className={errors.tanggal ? 'border-destructive' : ''}
                />
                {errors.tanggal && <p className="text-sm text-destructive">{errors.tanggal}</p>}
              </div>

              {/* Keterangan */}
              <div className="space-y-2">
                <Label htmlFor="keterangan" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Keterangan
                </Label>
                <Textarea
                  id="keterangan"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Tambahkan keterangan (opsional)"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    <>
                      <ArrowDownToLine className="h-4 w-4 mr-2" />
                      Simpan Barang Masuk
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BarangMasuk;
