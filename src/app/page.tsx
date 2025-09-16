'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Smartphone,
  QrCode,
  Heart,
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
        <div className="absolute inset-0 opacity-90" style={{background: 'linear-gradient(to right, #3C0B5A, #551A8B)'}}></div>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
          }}
        ></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute -inset-4 bg-white/20 rounded-full animate-pulse"></div>
                <div className="relative bg-white/10 backdrop-blur-sm p-6 rounded-full border border-white/20">
                  <Shield className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
              Pulseras
              <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                {' '}Inteligentes
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto animate-slide-up">
              Protege a tus seres queridos con tecnología QR avanzada. 
              Información médica y contactos de emergencia siempre disponibles.
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

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir nuestras pulseras?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tecnología innovadora para tu seguridad y tranquilidad
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="group text-center p-8 rounded-3xl transition-all duration-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:shadow-xl hover:-translate-y-2">
              <div className="relative mb-6 inline-block">
                <div className="absolute -inset-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors duration-300"></div>
                <QrCode className="relative w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Códigos QR Únicos
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Cada pulsera tiene un código QR único que permite acceso inmediato 
                a la información médica y contactos de emergencia.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group text-center p-8 rounded-3xl transition-all duration-500 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:shadow-xl hover:-translate-y-2">
              <div className="relative mb-6 inline-block">
                <div className="absolute -inset-4 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors duration-300"></div>
                <Smartphone className="relative w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Acceso Móvil
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Compatible con cualquier smartphone. Solo escanea y accede 
                instantáneamente a la información vital.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group text-center p-8 rounded-3xl transition-all duration-500 hover:bg-gradient-to-br hover:from-red-50 hover:to-pink-50 hover:shadow-xl hover:-translate-y-2">
              <div className="relative mb-6 inline-block">
                <div className="absolute -inset-4 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors duration-300"></div>
                <Heart className="relative w-12 h-12 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Información Médica
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Almacena información médica crucial, alergias, medicamentos 
                y contactos de emergencia de forma segura.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20" style={{background: 'linear-gradient(to right, #3C0B5A, #551A8B)'}}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Comienza hoy mismo
          </h2>
          <p className="text-xl text-white opacity-90 mb-10 max-w-2xl mx-auto">
            Únete a miles de familias que ya confían en Bluko Life 
            para proteger a sus seres queridos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="group inline-flex items-center gap-3 bg-white px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{color: '#551A8B'}}
            >
              Comprar mi primera pulsera
              <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
            
            <Link
              href="/portador/login"
              className="group inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 px-8 py-5 rounded-2xl font-bold text-xl hover:bg-white/20 hover:scale-105 transform transition-all duration-300"
            >
              <Heart className="w-6 h-6" />
              Acceso Usuarios
              <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
          
          <p className="text-white opacity-80 text-sm mt-6">
            ¿Te asignaron una pulsera? Accede como usuario para gestionar tu información médica
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold">Bluko Life</span>
          </div>
          <p className="text-gray-400">
            © 2024 Bluko Life. Protegiendo vidas con tecnología.
          </p>
        </div>
      </footer>
    </div>
  );
}