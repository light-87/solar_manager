'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@/types';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  userId: string | null;
  username: string | null;
  workspaceCode: string | null;
  workspaceName: string | null;
  login: (
    role: UserRole,
    userId: string,
    username: string,
    workspaceCode?: string,
    workspaceName?: string
  ) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [workspaceCode, setWorkspaceCode] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      try {
        const { role, userId, username, workspaceCode, workspaceName } = JSON.parse(storedAuth);
        setIsAuthenticated(true);
        setUserRole(role);
        setUserId(userId);
        setUsername(username);
        setWorkspaceCode(workspaceCode || null);
        setWorkspaceName(workspaceName || null);
      } catch (e) {
        localStorage.removeItem('auth');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (
    role: UserRole,
    userId: string,
    username: string,
    workspaceCode?: string,
    workspaceName?: string
  ) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserId(userId);
    setUsername(username);
    setWorkspaceCode(workspaceCode || null);
    setWorkspaceName(workspaceName || null);
    localStorage.setItem(
      'auth',
      JSON.stringify({ role, userId, username, workspaceCode, workspaceName })
    );
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUserId(null);
    setUsername(null);
    setWorkspaceCode(null);
    setWorkspaceName(null);
    localStorage.removeItem('auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userRole,
        userId,
        username,
        workspaceCode,
        workspaceName,
        login,
        logout,
      }}
    >
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
