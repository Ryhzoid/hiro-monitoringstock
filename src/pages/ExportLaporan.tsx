import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { getStokAkhir, getStokStatus } from '@/data/dummyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { exportToExcel, exportToPdf } from '@/lib/export';
import { FileText, FileSpreadsheet, FileDown, Eye, Calendar } from 'lucide-react';

type ReportType = 'stok' | 'transaksi';
type Period = 'harian' | 'mingguan' | 'bulanan';

const ExportLaporan = () => {
  const { products, transactions } = useData();
  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [period, setPeriod] = useState<Period | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = () => {
    if (!reportType || !period || !dateFrom || !dateTo) {
      toast({
        title: 'Error',
        description: 'Lengkapi semua pilihan untuk melihat preview.',
        variant: 'destructive',
      });
      return;
    }
    setShowPreview(true);
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const title = `Laporan ${reportType === 'stok' ? 'Stok Barang' : 'Transaksi'} (${period}) - ${dateFrom} s/d ${dateTo}`;

    if (reportType === 'stok') {
      const filename = `Laporan_Stok_${todayStr}`;
      if (format === 'excel') {
        exportToExcel(filename, 'Stok Barang', stockData.map(p => ({
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
      } else {
        exportToPdf(
          filename,
          title,
          ['Kode', 'Nama Barang', 'Kategori', 'Satuan', 'Stok Awal', 'Masuk', 'Keluar', 'Stok Akhir', 'Status'],
          stockData.map(p => [p.kode, p.nama, p.kategori, p.satuan, p.stokAwal, p.totalMasuk, p.totalKeluar, p.stokAkhir, p.status])
        );
      }
    } else {
      const filename = `Laporan_Transaksi_${todayStr}`;
      if (format === 'excel') {
        exportToExcel(filename, 'Transaksi', filteredTransactions.map(t => ({
          Tanggal: t.tanggal,
          Jenis: t.jenis,
          'Nama Barang': t.namaBarang,
          Jumlah: t.jumlah,
          Keterangan: t.keterangan,
          'User Input': t.userInput,
        })));
      } else {
        exportToPdf(
          filename,
          title,
          ['Tanggal', 'Jenis', 'Nama Barang', 'Jumlah', 'Keterangan', 'User Input'],
          filteredTransactions.map(t => [t.tanggal, t.jenis, t.namaBarang, t.jumlah, t.keterangan, t.userInput])
        );
      }
    }

    toast({
      title: 'Export Berhasil',
      description: `Laporan ${reportType === 'stok' ? 'Stok' : 'Transaksi'} berhasil diexport ke ${format.toUpperCase()}.`,
    });
  };

  const filteredTransactions = transactions.filter(t => {
    if (!dateFrom || !dateTo) return true;
    return t.tanggal >= dateFrom && t.tanggal <= dateTo;
  });

  const stockData = products.map(product => ({
    ...product,
    stokAkhir: getStokAkhir(product),
    status: getStokStatus(getStokAkhir(product)),
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Export Laporan</CardTitle>
                <CardDescription>Generate dan export laporan dalam format Excel atau PDF</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Report Type */}
              <div className="space-y-2">
                <Label>Jenis Laporan</Label>
                <Select value={reportType} onValueChange={(v) => { setReportType(v as ReportType); setShowPreview(false); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis laporan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stok">Laporan Stok Barang</SelectItem>
                    <SelectItem value="transaksi">Laporan Transaksi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Period */}
              <div className="space-y-2">
                <Label>Periode Laporan</Label>
                <Select value={period} onValueChange={(v) => { setPeriod(v as Period); setShowPreview(false); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih periode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="harian">Harian</SelectItem>
                    <SelectItem value="mingguan">Mingguan</SelectItem>
                    <SelectItem value="bulanan">Bulanan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tanggal Mulai
                </Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setShowPreview(false); }}
                />
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tanggal Akhir
                </Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setShowPreview(false); }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t">
              <Button onClick={handlePreview} variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Lihat Preview
              </Button>
              <Button onClick={() => handleExport('excel')} disabled={!showPreview} variant="success">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={() => handleExport('pdf')} disabled={!showPreview} variant="info">
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Preview Laporan {reportType === 'stok' ? 'Stok Barang' : 'Transaksi'}
              </CardTitle>
              <CardDescription>
                Periode: {dateFrom} sampai {dateTo} ({period})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                {reportType === 'stok' ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama Barang</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Stok Awal</TableHead>
                        <TableHead className="text-right">Masuk</TableHead>
                        <TableHead className="text-right">Keluar</TableHead>
                        <TableHead className="text-right">Stok Akhir</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockData.slice(0, 10).map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.kode}</TableCell>
                          <TableCell>{product.nama}</TableCell>
                          <TableCell>{product.kategori}</TableCell>
                          <TableCell className="text-right">{product.stokAwal}</TableCell>
                          <TableCell className="text-right text-[hsl(var(--success))]">+{product.totalMasuk}</TableCell>
                          <TableCell className="text-right text-[hsl(var(--info))]">-{product.totalKeluar}</TableCell>
                          <TableCell className="text-right font-bold">{product.stokAkhir}</TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                product.status === 'Habis' 
                                  ? 'bg-destructive/10 text-destructive' 
                                  : product.status === 'Menipis'
                                  ? 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]'
                                  : 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]'
                              }
                            >
                              {product.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Nama Barang</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead>User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.slice(0, 10).map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.tanggal}</TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                transaction.jenis === 'Masuk'
                                  ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]'
                                  : 'bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]'
                              }
                            >
                              {transaction.jenis}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.namaBarang}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {transaction.jenis === 'Masuk' ? '+' : '-'}{transaction.jumlah}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{transaction.keterangan}</TableCell>
                          <TableCell>{transaction.userInput}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Menampilkan 10 data pertama. Export untuk melihat semua data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ExportLaporan;
