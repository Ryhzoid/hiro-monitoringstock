import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/data/dummyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Warehouse, Lock, Mail, UserCircle } from 'lucide-react';
import logo from '@/assets/logo-hiro.png';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const {
    login
  } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !role) {
      toast({
        title: 'Error',
        description: 'Mohon lengkapi semua field.',
        variant: 'destructive'
      });
      return;
    }
    setIsLoading(true);

    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const success = login(email, password, role);
    setIsLoading(false);

    if (!success) {
      toast({
        title: 'Login Gagal',
        description: 'Email, password, atau role tidak sesuai',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Login Berhasil',
      description: `Selamat datang di Sistem Monitoring Gudang.`
    });
    navigate('/dashboard');
  };
  return <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="PT. Hiro Takashi Mura" className="h-32 w-auto" />
          </div>
          <p className="text-muted-foreground">Warehouse Stock Monitoring System</p>
        </div>

        {/* Login Card */}
        <Card className="border-border shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 p-3 rounded-full bg-primary/10">
              <Warehouse className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Login</CardTitle>
            <CardDescription>Masukkan kredensial untuk mengakses sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="email@hirotakashimura.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">Pilih Role</Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Select value={role} onValueChange={value => setRole(value as UserRole)}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Pilih role anda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin Gudang</SelectItem>
                      <SelectItem value="manajer">Manajer Gudang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Memproses...
                  </span> : 'Login'}
              </Button>
            </form>

            {/* Demo hint */}
            
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">© 2026 PT. Hiro Takashi Mura. All rights reserved.</p>
      </div>
    </div>;
};
export default Login;