import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { getStokAkhir, getStokStatus } from '@/data/dummyData';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, AlertTriangle, ArrowDownToLine, FileText, Clock } from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  variant = 'default' 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  description: string;
  variant?: 'default' | 'warning' | 'success';
}) => (
  <Card className={`transition-all duration-200 hover:shadow-md ${
    variant === 'warning' ? 'border-[hsl(var(--warning))]/50 bg-[hsl(var(--warning))]/5' : ''
  }`}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-2 rounded-lg ${
        variant === 'warning' 
          ? 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]' 
          : 'bg-primary/10 text-primary'
      }`}>
        <Icon className="h-4 w-4" />
      </div>
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${
        variant === 'warning' ? 'text-[hsl(var(--warning))]' : 'text-foreground'
      }`}>
        {value}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { products, transactions } = useData();
  
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const todayTransactions = transactions.filter(t => t.tanggal === today);
  const monthTransactions = transactions.filter(t => t.tanggal.startsWith(currentMonth));
  const todayMasuk = todayTransactions.filter(t => t.jenis === 'Masuk');
  
  const lowStockProducts = products.filter(p => {
    const stokAkhir = getStokAkhir(p);
    return getStokStatus(stokAkhir) === 'Menipis' || getStokStatus(stokAkhir) === 'Habis';
  });

  const isAdmin = user?.role === 'admin';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Selamat Datang, {user?.nama}!
          </h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Kelola stok gudang dan transaksi barang dengan mudah.'
              : 'Pantau stok gudang dan laporan transaksi dengan mudah.'
            }
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Barang"
            value={products.length}
            icon={Package}
            description="Jenis produk terdaftar"
          />
          
          {isAdmin ? (
            <>
              <StatCard 
                title="Transaksi Hari Ini"
                value={todayTransactions.length}
                icon={ShoppingCart}
                description={`${today}`}
              />
              <StatCard 
                title="Stok Menipis"
                value={lowStockProducts.length}
                icon={AlertTriangle}
                description="Perlu restok segera"
                variant={lowStockProducts.length > 0 ? 'warning' : 'default'}
              />
              <StatCard 
                title="Barang Masuk Hari Ini"
                value={todayMasuk.length}
                icon={ArrowDownToLine}
                description="Transaksi masuk"
              />
            </>
          ) : (
            <>
              <StatCard 
                title="Transaksi Bulan Ini"
                value={monthTransactions.length}
                icon={ShoppingCart}
                description={`Periode ${currentMonth}`}
              />
              <StatCard 
                title="Stok Menipis"
                value={lowStockProducts.length}
                icon={AlertTriangle}
                description="Perlu restok segera"
                variant={lowStockProducts.length > 0 ? 'warning' : 'default'}
              />
              <StatCard 
                title="Laporan Pending"
                value={3}
                icon={FileText}
                description="Menunggu review"
              />
            </>
          )}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-[hsl(var(--warning))]" />
                Peringatan Stok Menipis
              </CardTitle>
              <CardDescription>Produk yang perlu segera direstok</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Semua stok dalam kondisi aman
                </p>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.slice(0, 5).map((product) => {
                    const stokAkhir = getStokAkhir(product);
                    const status = getStokStatus(stokAkhir);
                    return (
                      <div 
                        key={product.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium text-sm">{product.nama}</p>
                          <p className="text-xs text-muted-foreground">{product.kode}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          status === 'Habis' 
                            ? 'bg-destructive/10 text-destructive' 
                            : 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]'
                        }`}>
                          Stok: {stokAkhir}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Transaksi Terbaru
              </CardTitle>
              <CardDescription>5 transaksi terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        transaction.jenis === 'Masuk'
                          ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]'
                          : 'bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]'
                      }`}>
                        {transaction.jenis}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{transaction.namaBarang}</p>
                        <p className="text-xs text-muted-foreground">{transaction.tanggal}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-sm">
                      {transaction.jenis === 'Masuk' ? '+' : '-'}{transaction.jumlah}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
