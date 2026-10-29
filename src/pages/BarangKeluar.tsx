import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { getStokAkhir, sortBatchesByTanggal } from '@/data/dummyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowUpFromLine, Calendar, Package, Hash, FileText, AlertTriangle, Layers } from 'lucide-react';

const BarangKeluar = () => {
  const { products, batches, addTransaction } = useData();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    barangId: '',
    jumlah: '',
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const [batchAllocations, setBatchAllocations] = useState<Record<string, number>>({});

  const activeProducts = products.filter(p => p.status === 'Aktif');

  const selectedProduct = products.find(p => p.id === formData.barangId);
  const currentStock = selectedProduct ? getStokAkhir(selectedProduct) : 0;

  const availableBatches = sortBatchesByTanggal(
    batches.filter(b => b.productId === formData.barangId && b.sisa > 0)
  );
  const totalAllocated = Object.values(batchAllocations).reduce((sum, v) => sum + (v || 0), 0);

  const handleBatchAllocationChange = (batchId: string, value: string, maxSisa: number) => {
    const qty = value === '' ? 0 : Math.max(0, Math.min(parseInt(value) || 0, maxSisa));
    setBatchAllocations({ ...batchAllocations, [batchId]: qty });
  };

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

    // Check stock availability
    if (formData.barangId && formData.jumlah) {
      const requestedQty = parseInt(formData.jumlah);
      if (requestedQty > currentStock) {
        setStockWarning(`Stok tidak mencukupi! Stok tersedia: ${currentStock}`);
      } else if (currentStock - requestedQty < 10) {
        setStockWarning(`Perhatian: Setelah transaksi, stok akan tersisa ${currentStock - requestedQty} (menipis)`);
      } else {
        setStockWarning(null);
      }
    }

    // Check batch allocation matches requested quantity
    if (formData.barangId && formData.jumlah && parseInt(formData.jumlah) > 0) {
      const requestedQty = parseInt(formData.jumlah);
      if (totalAllocated !== requestedQty) {
        newErrors.batchAllocations = `Total alokasi batch (${totalAllocated}) harus sama dengan jumlah barang keluar (${requestedQty})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const requestedQty = parseInt(formData.jumlah);
    if (requestedQty > currentStock) {
      toast({
        title: 'Stok Tidak Mencukupi',
        description: `Stok ${selectedProduct?.nama} hanya tersisa ${currentStock} unit.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const batchAllocationsPayload = Object.entries(batchAllocations)
      .filter(([, jumlah]) => jumlah > 0)
      .map(([batchId, jumlah]) => ({ batchId, jumlah }));

    addTransaction({
      tanggal: formData.tanggal,
      jenis: 'Keluar',
      barangId: formData.barangId,
      namaBarang: selectedProduct?.nama || '',
      jumlah: requestedQty,
      keterangan: formData.keterangan || 'Barang keluar',
      userInput: user?.nama || 'Admin',
      batchAllocations: batchAllocationsPayload,
    });

    toast({
      title: 'Berhasil!',
      description: `${selectedProduct?.nama} sebanyak ${formData.jumlah} unit berhasil dikeluarkan dari stok.`,
    });

    setFormData({
      barangId: '',
      jumlah: '',
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: '',
    });
    setErrors({});
    setStockWarning(null);
    setBatchAllocations({});
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
    setStockWarning(null);
    setBatchAllocations({});
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--info))]/10">
                <ArrowUpFromLine className="h-6 w-6 text-[hsl(var(--info))]" />
              </div>
              <div>
                <CardTitle>Input Barang Keluar</CardTitle>
                <CardDescription>Catat barang yang keluar dari gudang</CardDescription>
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
                <Select value={formData.barangId} onValueChange={(v) => {
                  setFormData({ ...formData, barangId: v });
                  setStockWarning(null);
                  setBatchAllocations({});
                }}>
                  <SelectTrigger className={errors.barangId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Cari dan pilih barang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeProducts.map(product => {
                      const stock = getStokAkhir(product);
                      return (
                        <SelectItem key={product.id} value={product.id}>
                          <span className="font-medium">{product.kode}</span> - {product.nama}
                          <span className={`ml-2 text-xs ${stock < 10 ? 'text-[hsl(var(--warning))]' : 'text-muted-foreground'}`}>
                            (Stok: {stock})
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {errors.barangId && <p className="text-sm text-destructive">{errors.barangId}</p>}
                {selectedProduct && (
                  <p className="text-sm text-muted-foreground">
                    Stok tersedia: <span className="font-semibold">{currentStock}</span> {selectedProduct.satuan}
                  </p>
                )}
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
                  max={currentStock}
                  value={formData.jumlah}
                  onChange={(e) => {
                    setFormData({ ...formData, jumlah: e.target.value });
                    if (selectedProduct && e.target.value) {
                      const qty = parseInt(e.target.value);
                      if (qty > currentStock) {
                        setStockWarning(`Stok tidak mencukupi! Stok tersedia: ${currentStock}`);
                      } else if (currentStock - qty < 10) {
                        setStockWarning(`Perhatian: Setelah transaksi, stok akan tersisa ${currentStock - qty} (menipis)`);
                      } else {
                        setStockWarning(null);
                      }
                    }
                  }}
                  placeholder="Masukkan jumlah"
                  className={errors.jumlah ? 'border-destructive' : ''}
                />
                {errors.jumlah && <p className="text-sm text-destructive">{errors.jumlah}</p>}
              </div>

              {/* Ambil dari Batch (FIFO) */}
              {selectedProduct && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Ambil dari Batch (FIFO) <span className="text-destructive">*</span>
                  </Label>
                  {availableBatches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tidak ada batch tersedia untuk barang ini.</p>
                  ) : (
                    <div className="space-y-2 rounded-lg border p-3">
                      {availableBatches.map((batch, index) => (
                        <div key={batch.id} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{batch.tanggal}</span>
                              {index === 0 && (
                                <Badge variant="outline" className="text-xs border-[hsl(var(--success))] text-[hsl(var(--success))]">
                                  Ambil duluan (FIFO)
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">Sisa: {batch.sisa}</p>
                          </div>
                          <Input
                            type="number"
                            min="0"
                            max={batch.sisa}
                            value={batchAllocations[batch.id] || ''}
                            onChange={(e) => handleBatchAllocationChange(batch.id, e.target.value, batch.sisa)}
                            placeholder="0"
                            className="w-24"
                          />
                        </div>
                      ))}
                      <p className="text-sm text-muted-foreground pt-1 border-t">
                        Dialokasikan: <span className="font-semibold">{totalAllocated}</span> / {formData.jumlah || 0}
                      </p>
                    </div>
                  )}
                  {errors.batchAllocations && <p className="text-sm text-destructive">{errors.batchAllocations}</p>}
                </div>
              )}

              {/* Stock Warning */}
              {stockWarning && (
                <Alert variant={stockWarning.includes('tidak mencukupi') ? 'destructive' : 'default'} className="border-[hsl(var(--warning))]">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Peringatan Stok</AlertTitle>
                  <AlertDescription>{stockWarning}</AlertDescription>
                </Alert>
              )}

              {/* Tanggal */}
              <div className="space-y-2">
                <Label htmlFor="tanggal" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tanggal Keluar <span className="text-destructive">*</span>
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
                      <ArrowUpFromLine className="h-4 w-4 mr-2" />
                      Simpan Barang Keluar
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

export default BarangKeluar;
