'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Preservar el URL actual para volver después del login
      const currentPath = typeof window !== 'undefined'
        ? window.location.pathname + window.location.search
        : '/dashboard';
      router.push(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <Image
            src="/logo-bluko-icon.png"
            alt="Cargando..."
            width={64}
            height={64}
            className="object-contain"
          />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;