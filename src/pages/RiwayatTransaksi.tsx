import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { Transaction } from '@/data/dummyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { exportToExcel } from '@/lib/export';
import { History, Search, Download, Calendar, Filter, Ban } from 'lucide-react';

const formatTanggalWaktu = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const RiwayatTransaksi = () => {
  const { transactions, products, cancelTransaction } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState<'all' | 'Masuk' | 'Keluar'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'aktif' | 'dibatalkan'>('all');
  const [filterBarang, setFilterBarang] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [cancelTarget, setCancelTarget] = useState<Transaction | null>(null);
  const [alasan, setAlasan] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.keterangan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJenis = filterJenis === 'all' || transaction.jenis === filterJenis;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'aktif' && !transaction.dibatalkan) ||
      (filterStatus === 'dibatalkan' && transaction.dibatalkan);
    const matchesBarang = filterBarang === 'all' || transaction.barangId === filterBarang;

    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && transaction.tanggal >= dateFrom;
    }
    if (dateTo) {
      matchesDate = matchesDate && transaction.tanggal <= dateTo;
    }

    return matchesSearch && matchesJenis && matchesStatus && matchesBarang && matchesDate;
  });

  // Ringkasan hanya menghitung transaksi yang berlaku.
  const aktifTransactions = filteredTransactions.filter(t => !t.dibatalkan);
  const jumlahDibatalkan = filteredTransactions.length - aktifTransactions.length;

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    exportToExcel(`Riwayat_Transaksi_${todayStr}`, 'Transaksi', filteredTransactions.map(t => ({
      Tanggal: t.tanggal,
      Jenis: t.jenis,
      'Nama Barang': t.namaBarang,
      Jumlah: t.jumlah,
      Keterangan: t.keterangan,
      'User Input': t.userInput,
      Status: t.dibatalkan ? 'Dibatalkan' : 'Berlaku',
      'Alasan Pembatalan': t.alasanPembatalan ?? '',
      'Dibatalkan Oleh': t.dibatalkanOleh ?? '',
    })));

    toast({
      title: 'Export Berhasil',
      description: 'Riwayat transaksi berhasil diexport ke Excel.',
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterJenis('all');
    setFilterStatus('all');
    setFilterBarang('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const openCancelDialog = (transaction: Transaction) => {
    setCancelTarget(transaction);
    setAlasan('');
  };

  const closeCancelDialog = () => {
    setCancelTarget(null);
    setAlasan('');
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    if (alasan.trim().length < 3) {
      toast({
        title: 'Alasan Wajib Diisi',
        description: 'Tulis alasan pembatalan (minimal 3 karakter).',
        variant: 'destructive',
      });
      return;
    }

    setIsCancelling(true);
    try {
      await cancelTransaction(cancelTarget.dbId, alasan.trim());
      toast({
        title: 'Transaksi Dibatalkan',
        description: `${cancelTarget.id} (${cancelTarget.jenis} ${cancelTarget.jumlah} ${cancelTarget.namaBarang}) berhasil dibatalkan.`,
      });
      closeCancelDialog();
    } catch (err: any) {
      toast({
        title: 'Gagal Membatalkan',
        description: err?.message || 'Transaksi tidak dapat dibatalkan. Coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Riwayat Transaksi
            </CardTitle>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="space-y-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama barang atau keterangan..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="pl-10"
                  />
                </div>
                <Select value={filterJenis} onValueChange={(v) => { setFilterJenis(v as typeof filterJenis); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    <SelectItem value="Masuk">Masuk</SelectItem>
                    <SelectItem value="Keluar">Keluar</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v as typeof filterStatus); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full lg:w-44">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="aktif">Berlaku</SelectItem>
                    <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterBarang} onValueChange={(v) => { setFilterBarang(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full lg:w-56">
                    <SelectValue placeholder="Filter Barang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Barang</SelectItem>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>{product.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex gap-2 items-center flex-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                    className="flex-1"
                    placeholder="Dari tanggal"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                    className="flex-1"
                    placeholder="Sampai tanggal"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Reset Filter
                </Button>
              </div>
            </div>

            {/* Summary (hanya transaksi yang berlaku) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Transaksi</p>
                <p className="text-2xl font-bold">{aktifTransactions.length}</p>
              </div>
              <div className="p-4 rounded-lg bg-[hsl(var(--success))]/10">
                <p className="text-sm text-muted-foreground">Barang Masuk</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">
                  {aktifTransactions.filter(t => t.jenis === 'Masuk').length}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[hsl(var(--info))]/10">
                <p className="text-sm text-muted-foreground">Barang Keluar</p>
                <p className="text-2xl font-bold text-[hsl(var(--info))]">
                  {aktifTransactions.filter(t => t.jenis === 'Keluar').length}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Dibatalkan</p>
                <p className="text-2xl font-bold text-muted-foreground">{jumlahDibatalkan}</p>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="hidden md:table-cell">Keterangan</TableHead>
                    <TableHead className="hidden lg:table-cell">User Input</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        {transactions.length === 0 ? 'Belum ada transaksi' : 'Tidak ada transaksi ditemukan'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTransactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className={transaction.dibatalkan ? 'bg-muted/30 text-muted-foreground' : ''}
                      >
                        <TableCell className="font-medium">{transaction.tanggal}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1">
                            <Badge
                              className={
                                transaction.jenis === 'Masuk'
                                  ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20'
                                  : 'bg-[hsl(var(--info))]/10 text-[hsl(var(--info))] border-[hsl(var(--info))]/20'
                              }
                            >
                              {transaction.jenis}
                            </Badge>
                            {transaction.dibatalkan && (
                              <Badge
                                variant="outline"
                                className="border-destructive/40 text-destructive"
                                title={transaction.alasanPembatalan ? `Alasan: ${transaction.alasanPembatalan}` : undefined}
                              >
                                Dibatalkan
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{transaction.namaBarang}</TableCell>
                        <TableCell className="text-right font-semibold">
                          <span
                            className={
                              transaction.dibatalkan
                                ? 'line-through'
                                : transaction.jenis === 'Masuk'
                                ? 'text-[hsl(var(--success))]'
                                : 'text-[hsl(var(--info))]'
                            }
                          >
                            {transaction.jenis === 'Masuk' ? '+' : '-'}{transaction.jumlah}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          <div>{transaction.keterangan}</div>
                          {transaction.dibatalkan && (
                            <div className="mt-1 text-xs text-destructive">
                              Dibatalkan oleh {transaction.dibatalkanOleh ?? '-'}
                              {transaction.dibatalkanPada ? ` pada ${formatTanggalWaktu(transaction.dibatalkanPada)}` : ''}
                              {transaction.alasanPembatalan ? `: ${transaction.alasanPembatalan}` : ''}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{transaction.userInput}</TableCell>
                        <TableCell className="text-right">
                          {!transaction.dibatalkan && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openCancelDialog(transaction)}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Batalkan
                            </Button>
                          )}
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
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} dari {filteredTransactions.length} data
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
                  <span className="flex items-center px-3 text-sm">
                    {currentPage} / {totalPages}
                  </span>
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

        {/* Dialog pembatalan */}
        <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open && !isCancelling) closeCancelDialog(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Batalkan transaksi ini?</DialogTitle>
              <DialogDescription>
                {cancelTarget && (
                  <>
                    {cancelTarget.id} · {cancelTarget.jenis} {cancelTarget.jumlah} {cancelTarget.namaBarang} ({cancelTarget.tanggal})
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                {cancelTarget?.jenis === 'Masuk' ? (
                  <p>
                    Stok akan <span className="font-medium text-foreground">berkurang {cancelTarget.jumlah}</span>.
                    Hanya bisa dibatalkan jika belum ada barang dari batch ini yang keluar; kalau sudah,
                    batalkan dulu transaksi keluar yang terkait.
                  </p>
                ) : (
                  <p>
                    Stok akan <span className="font-medium text-foreground">kembali bertambah {cancelTarget?.jumlah}</span>,
                    dikembalikan ke batch asalnya sehingga urutan FIFO tetap benar.
                  </p>
                )}
                <p className="mt-2">
                  Transaksi tidak dihapus: tetap tercatat di riwayat dengan status dibatalkan, alasan, dan nama Anda.
                  Untuk mengoreksi, batalkan lalu input ulang transaksi yang benar.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alasan">
                  Alasan pembatalan <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="alasan"
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  placeholder="Contoh: salah input jumlah, seharusnya 20"
                  rows={3}
                  disabled={isCancelling}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeCancelDialog} disabled={isCancelling}>
                Kembali
              </Button>
              <Button variant="destructive" onClick={handleCancel} disabled={isCancelling}>
                {isCancelling ? 'Memproses...' : 'Batalkan Transaksi'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default RiwayatTransaksi;