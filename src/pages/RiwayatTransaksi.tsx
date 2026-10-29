import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { exportToExcel } from '@/lib/export';
import { History, Search, Download, Calendar, Filter } from 'lucide-react';

const RiwayatTransaksi = () => {
  const { transactions, products } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState<'all' | 'Masuk' | 'Keluar'>('all');
  const [filterBarang, setFilterBarang] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.keterangan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJenis = filterJenis === 'all' || transaction.jenis === filterJenis;
    const matchesBarang = filterBarang === 'all' || transaction.barangId === filterBarang;
    
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && transaction.tanggal >= dateFrom;
    }
    if (dateTo) {
      matchesDate = matchesDate && transaction.tanggal <= dateTo;
    }
    
    return matchesSearch && matchesJenis && matchesBarang && matchesDate;
  });

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
    })));

    toast({
      title: 'Export Berhasil',
      description: 'Riwayat transaksi berhasil diexport ke Excel.',
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterJenis('all');
    setFilterBarang('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterJenis} onValueChange={(v) => setFilterJenis(v as typeof filterJenis)}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    <SelectItem value="Masuk">Masuk</SelectItem>
                    <SelectItem value="Keluar">Keluar</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterBarang} onValueChange={setFilterBarang}>
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
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1"
                    placeholder="Dari tanggal"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
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

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Transaksi</p>
                <p className="text-2xl font-bold">{filteredTransactions.length}</p>
              </div>
              <div className="p-4 rounded-lg bg-[hsl(var(--success))]/10">
                <p className="text-sm text-muted-foreground">Barang Masuk</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">
                  {filteredTransactions.filter(t => t.jenis === 'Masuk').length}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[hsl(var(--info))]/10">
                <p className="text-sm text-muted-foreground">Barang Keluar</p>
                <p className="text-2xl font-bold text-[hsl(var(--info))]">
                  {filteredTransactions.filter(t => t.jenis === 'Keluar').length}
                </p>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        Tidak ada transaksi ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.tanggal}</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              transaction.jenis === 'Masuk'
                                ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20'
                                : 'bg-[hsl(var(--info))]/10 text-[hsl(var(--info))] border-[hsl(var(--info))]/20'
                            }
                          >
                            {transaction.jenis}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.namaBarang}</TableCell>
                        <TableCell className="text-right font-semibold">
                          <span className={transaction.jenis === 'Masuk' ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--info))]'}>
                            {transaction.jenis === 'Masuk' ? '+' : '-'}{transaction.jumlah}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {transaction.keterangan}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{transaction.userInput}</TableCell>
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
      </div>
    </DashboardLayout>
  );
};

export default RiwayatTransaksi;
