import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, Transaction, User, StockBatch, initialProducts, initialTransactions, initialUsers, initialBatches } from '@/data/dummyData';

interface DataContextType {
  products: Product[];
  transactions: Transaction[];
  users: User[];
  batches: StockBatch[];
  addProduct: (product: Omit<Product, 'id' | 'stokAwal' | 'totalMasuk' | 'totalKeluar'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  toggleUserStatus: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [batches, setBatches] = useState<StockBatch[]>(initialBatches);

  const addProduct = (product: Omit<Product, 'id' | 'stokAwal' | 'totalMasuk' | 'totalKeluar'>) => {
    const newProduct: Product = {
      ...product,
      id: String(products.length + 1),
      stokAwal: 0,
      totalMasuk: 0,
      totalKeluar: 0,
    };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    setBatches(batches.filter(b => b.productId !== id));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `TRX-${String(transactions.length + 1).padStart(4, '0')}`,
    };
    setTransactions([newTransaction, ...transactions]);

    // Update product stock
    const product = products.find(p => p.id === transaction.barangId);
    if (product) {
      if (transaction.jenis === 'Masuk') {
        updateProduct(product.id, { totalMasuk: product.totalMasuk + transaction.jumlah });
        const newBatch: StockBatch = {
          id: `BATCH-${String(batches.length + 1).padStart(4, '0')}`,
          productId: transaction.barangId,
          tanggal: transaction.tanggal,
          jumlahAwal: transaction.jumlah,
          sisa: transaction.jumlah,
        };
        setBatches([...batches, newBatch]);
      } else {
        updateProduct(product.id, { totalKeluar: product.totalKeluar + transaction.jumlah });
        if (transaction.batchAllocations?.length) {
          setBatches(batches.map(b => {
            const allocation = transaction.batchAllocations.find(a => a.batchId === b.id);
            return allocation ? { ...b, sisa: b.sisa - allocation.jumlah } : b;
          }));
        }
      }
    }
  };

  const addUser = (user: Omit<User, 'id'>) => {
    const newUser: User = {
      ...user,
      id: String(users.length + 1),
    };
    setUsers([...users, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(users.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const toggleUserStatus = (id: string) => {
    setUsers(users.map(u => 
      u.id === id ? { ...u, status: u.status === 'Aktif' ? 'Nonaktif' : 'Aktif' } : u
    ));
  };

  return (
    <DataContext.Provider value={{
      products,
      transactions,
      users,
      batches,
      addProduct,
      updateProduct,
      deleteProduct,
      addTransaction,
      addUser,
      updateUser,
      toggleUserStatus,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
