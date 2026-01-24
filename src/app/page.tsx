'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  if (user) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-90" style={{background: 'linear-gradient(to right, #3d1158, #481468)'}}></div>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
          }}
        ></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Logo BLUKO LIFE horizontal */}
            <div className="flex justify-center mb-10">
              <Image
                src="/logo-bluko-horizontal.jpg"
                alt="Bluko Life"
                width={320}
                height={80}
                className="h-auto"
                priority
              />
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
              Te damos la bienvenida a
            </h1>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">
              <span className="text-white">Bluko</span>
              <span className="text-green-400"> Life</span>
              <span className="text-white">®</span>
            </h2>

            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto animate-slide-up">
              ¡Tecnología que salva vidas!
            </p>
            

            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-slide-up">
              <Link
                href="/register"
                className="group relative overflow-hidden bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Crear Cuenta
                  <Sparkles className="w-5 h-5 group-hover:animate-spin" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>

              <Link
                href="/login"
                className="group bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-semibold text-lg border border-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-105 flex items-center justify-center gap-2"
              >
                Iniciar Sesión
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl animate-bounce"></div>
        <div
          className="absolute bottom-1/4 right-10 w-24 h-24 bg-purple-300/10 rounded-full blur-xl animate-bounce"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>


      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Image
              src="/logo-bluko-icon.png"
              alt="Bluko Life"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-2xl font-bold">Bluko Life</span>
          </div>
          <p className="text-gray-400">
            © 2025 Bluko Life. Protegiendo vidas con tecnología.
          </p>
        </div>
      </footer>
    </div>
  );
}