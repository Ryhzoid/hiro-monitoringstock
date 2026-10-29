import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, Boxes, FileText, History, Users, LogOut, Menu, X } from 'lucide-react';
import logoIcon from '@/assets/logo-hiro-icon.png';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  roles: ('admin' | 'manajer')[];
}

const menuItems: MenuItem[] = [{
  icon: LayoutDashboard,
  label: 'Dashboard',
  path: '/dashboard',
  roles: ['admin', 'manajer']
}, {
  icon: Package,
  label: 'Kelola Data Barang',
  path: '/kelola-barang',
  roles: ['admin']
}, {
  icon: ArrowDownToLine,
  label: 'Input Barang Masuk',
  path: '/barang-masuk',
  roles: ['admin']
}, {
  icon: ArrowUpFromLine,
  label: 'Input Barang Keluar',
  path: '/barang-keluar',
  roles: ['admin']
}, {
  icon: Boxes,
  label: 'Lihat Stok Barang',
  path: '/stok-barang',
  roles: ['admin', 'manajer']
}, {
  icon: History,
  label: 'Riwayat Transaksi',
  path: '/riwayat-transaksi',
  roles: ['manajer']
}, {
  icon: FileText,
  label: 'Export Laporan',
  path: '/export-laporan',
  roles: ['admin', 'manajer']
}, {
  icon: Users,
  label: 'Kelola Akun Pengguna',
  path: '/kelola-pengguna',
  roles: ['manajer']
}];

export const DashboardLayout = ({
  children
}: {
  children: ReactNode;
}) => {
  const {
    user,
    logout
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const filteredMenuItems = menuItems.filter(item => user?.role && item.roles.includes(user.role));
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 text-gray-100 flex flex-col transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <img src={logoIcon} alt="Hiro Takashimura" className="h-10 w-auto" />
            <div>
              <h1 className="font-bold text-sm text-white">HIRO Takashi Mura</h1>
              <p className="text-xs text-lime-500">Warehouse System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return <button 
              key={item.path} 
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }} 
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-lime-500 text-white shadow-md" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )}>
                <Icon className="h-5 w-5" />
                {item.label}
              </button>;
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10 bg-lime-500">
              <AvatarFallback className="bg-lime-500 text-white">
                {user?.nama?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">{user?.nama}</p>
              <p className="text-xs truncate text-gray-400">{user?.email}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full border-red-600 text-red-500 hover:bg-red-600 hover:text-white hover:border-red-600" 
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
          <button className="lg:hidden p-2 hover:bg-muted rounded-lg" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <div className="flex-1 lg:flex-none">
            <h2 className="text-lg font-semibold text-foreground hidden lg:block">
              {filteredMenuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.role === 'admin' ? 'Admin Gudang' : 'Manajer Gudang'}
            </span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>;
};