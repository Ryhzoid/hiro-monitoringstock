import { Fragment, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { categories, getStokAkhir, getStokStatus, sortBatchesByTanggal } from '@/data/dummyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { exportToExcel } from '@/lib/export';
import { Boxes, Search, Download, ArrowUpDown, ChevronDown, ChevronRight } from 'lucide-react';

const StokBarang = () => {
  const { products, batches } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock-asc' | 'stock-desc'>('name');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const processedProducts = products
    .map(product => ({
      ...product,
      stokAkhir: getStokAkhir(product),
      status: getStokStatus(getStokAkhir(product)),
    }))
    .filter(product => {
      const matchesSearch = product.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.kode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesKategori = filterKategori === 'all' || product.kategori === filterKategori;
      return matchesSearch && matchesKategori;
    })
    .sort((a, b) => {
      if (sortBy === 'stock-asc') return a.stokAkhir - b.stokAkhir;
      if (sortBy === 'stock-desc') return b.stokAkhir - a.stokAkhir;
      return a.nama.localeCompare(b.nama);
    });

  const handleExport = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    exportToExcel(`Stok_Barang_${todayStr}`, 'Stok Barang', processedProducts.map(p => ({
      Kode: p.kode,
      'Nama Barang': p.nama,
      Kategori: p.kategori,
      Satuan: p.satuan,
      'Stok Awal': p.stokAwal,
      Masuk: p.totalMasuk,
      Keluar: p.totalKeluar,
      'Stok Akhir': p.stokAkhir,
      Status: p.status,
    })));

    toast({
      title: 'Export Berhasil',
      description: 'Data stok barang berhasil diexport ke Excel.',
    });
  };

  const getStatusBadge = (status: 'Aman' | 'Menipis' | 'Habis', stokAkhir: number) => {
    if (status === 'Habis') {
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
          Habis (0)
        </Badge>
      );
    }
    if (status === 'Menipis') {
      return (
        <Badge className="bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20 hover:bg-[hsl(var(--warning))]/20">
          Menipis ({stokAkhir})
        </Badge>
      );
    }
    return (
      <Badge className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20 hover:bg-[hsl(var(--success))]/20">
        Aman ({stokAkhir})
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-primary" />
              Stok Barang
            </CardTitle>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau kode barang..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterKategori} onValueChange={setFilterKategori}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nama A-Z</SelectItem>
                  <SelectItem value="stock-asc">Stok Terendah</SelectItem>
                  <SelectItem value="stock-desc">Stok Tertinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20">
                <p className="text-sm text-muted-foreground">Stok Aman</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">
                  {processedProducts.filter(p => p.status === 'Aman').length}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/20">
                <p className="text-sm text-muted-foreground">Stok Menipis</p>
                <p className="text-2xl font-bold text-[hsl(var(--warning))]">
                  {processedProducts.filter(p => p.status === 'Menipis').length}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-muted-foreground">Stok Habis</p>
                <p className="text-2xl font-bold text-destructive">
                  {processedProducts.filter(p => p.status === 'Habis').length}
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead className="hidden md:table-cell">Kategori</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Stok Awal</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Total Masuk</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Total Keluar</TableHead>
                    <TableHead className="text-right">
                      <span className="flex items-center justify-end gap-1">
                        <ArrowUpDown className="h-3 w-3" />
                        Stok Akhir
                      </span>
                    </TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        Tidak ada data barang ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    processedProducts.map((product) => {
                      const isExpanded = expandedProductId === product.id;
                      const productBatches = sortBatchesByTanggal(batches.filter(b => b.productId === product.id));
                      const oldestAvailableBatchId = productBatches.find(b => b.sisa > 0)?.id;

                      return (
                        <Fragment key={product.id}>
                          <TableRow
                            className={`cursor-pointer ${
                              product.status === 'Habis'
                                ? 'bg-destructive/5'
                                : product.status === 'Menipis'
                                ? 'bg-[hsl(var(--warning))]/5'
                                : ''
                            }`}
                            onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                          >
                            <TableCell>
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{product.nama}</p>
                                <p className="text-xs text-muted-foreground">{product.kode}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{product.kategori}</TableCell>
                            <TableCell className="text-right hidden sm:table-cell">{product.stokAwal}</TableCell>
                            <TableCell className="text-right hidden lg:table-cell text-[hsl(var(--success))]">
                              +{product.totalMasuk}
                            </TableCell>
                            <TableCell className="text-right hidden lg:table-cell text-[hsl(var(--info))]">
                              -{product.totalKeluar}
                            </TableCell>
                            <TableCell className="text-right font-bold">{product.stokAkhir}</TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(product.status, product.stokAkhir)}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${product.id}-batches`}>
                              <TableCell colSpan={8} className="bg-muted/30 p-4">
                                {productBatches.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">Belum ada batch untuk barang ini.</p>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">Rincian Batch (urut dari yang tertua)</p>
                                    {productBatches.map(batch => (
                                      <div key={batch.id} className="flex items-center justify-between text-sm border-b last:border-b-0 pb-2 last:pb-0">
                                        <div className="flex items-center gap-2">
                                          <span>{batch.tanggal}</span>
                                          {batch.id === oldestAvailableBatchId && (
                                            <Badge variant="outline" className="text-xs border-[hsl(var(--success))] text-[hsl(var(--success))]">
                                              FIFO - Prioritas Keluar
                                            </Badge>
                                          )}
                                          {batch.sisa === 0 && (
                                            <Badge variant="secondary" className="text-xs">Habis</Badge>
                                          )}
                                        </div>
                                        <span className="text-muted-foreground">
                                          Sisa {batch.sisa} / {batch.jumlahAwal}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StokBarang;
