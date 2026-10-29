import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import KelolaBarang from "./pages/KelolaBarang";
import BarangMasuk from "./pages/BarangMasuk";
import BarangKeluar from "./pages/BarangKeluar";
import StokBarang from "./pages/StokBarang";
import RiwayatTransaksi from "./pages/RiwayatTransaksi";
import ExportLaporan from "./pages/ExportLaporan";
import KelolaPengguna from "./pages/KelolaPengguna";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: ('admin' | 'manajer')[] }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/kelola-barang" element={<ProtectedRoute allowedRoles={['admin']}><KelolaBarang /></ProtectedRoute>} />
      <Route path="/barang-masuk" element={<ProtectedRoute allowedRoles={['admin']}><BarangMasuk /></ProtectedRoute>} />
      <Route path="/barang-keluar" element={<ProtectedRoute allowedRoles={['admin']}><BarangKeluar /></ProtectedRoute>} />
      <Route path="/stok-barang" element={<ProtectedRoute><StokBarang /></ProtectedRoute>} />
      <Route path="/riwayat-transaksi" element={<ProtectedRoute allowedRoles={['manajer']}><RiwayatTransaksi /></ProtectedRoute>} />
      <Route path="/export-laporan" element={<ProtectedRoute><ExportLaporan /></ProtectedRoute>} />
      <Route path="/kelola-pengguna" element={<ProtectedRoute allowedRoles={['manajer']}><KelolaPengguna /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
