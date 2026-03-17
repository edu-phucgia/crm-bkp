import { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'sales_manager' | 'sales_rep';

export interface User {
  id: string;
  name: string;
  email: string;
  availableRoles: UserRole[];
  avatar: string;
}

export interface AuthContextType {
  user: User | null;
  activeRole: UserRole;
  setRole: (role: UserRole) => void;
  login: () => void;
  logout: () => void;
}

const MOCK_USER: User = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Lê Mạnh Tiến',
  email: 'tien@pgl.vn',
  availableRoles: ['admin', 'sales_manager', 'sales_rep'], // This user has all 3 roles
  avatar: 'LM',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(MOCK_USER);
  const [activeRole, setActiveRole] = useState<UserRole>('admin');

  const setRole = (role: UserRole) => {
    setActiveRole(role);
  };

  const login = () => {
    setUser(MOCK_USER);
    setActiveRole('admin');
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, activeRole, setRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
