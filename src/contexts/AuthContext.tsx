import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, initialUsers } from '@/data/dummyData';

interface AuthContextType {
  isAuthenticated: boolean;
  user: {
    email: string;
    role: UserRole;
    nama: string;
  } | null;
  login: (email: string, password: string, role: UserRole) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);

  const login = (email: string, password: string, role: UserRole) => {
    const matchedUser = initialUsers.find(
      (u) => u.email === email && u.password === password && u.role === role
    );

    if (!matchedUser) {
      return false;
    }

    setUser({
      email: matchedUser.email,
      role: matchedUser.role,
      nama: matchedUser.nama,
    });

    return true;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
