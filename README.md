# Bluko Life QR - Frontend

Sistema de gestión y venta Bluko Life con códigos QR para información médica de emergencia.

## 🚀 Características

- **Venta de Pulseras**: Sistema completo de e-commerce con carrito y pasarela de pago
- **Gestión Médica**: Administración de información médica y contactos de emergencia
- **Códigos QR**: Generación y escaneo de códigos QR únicos
- **Autenticación**: Sistema completo de registro, login y verificación OTP
- **Responsive**: Diseño adaptable para móviles y desktop

## 🛠️ Tecnologías

- **Next.js 15**: Framework de React
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos y diseño
- **React Hook Form**: Manejo de formularios
- **Axios**: Cliente HTTP
- **React Hot Toast**: Notificaciones
- **Lucide React**: Iconografía

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Páginas (App Router)
│   ├── page.tsx           # Página principal
│   ├── register/          # Registro de usuarios
│   ├── verify-otp/        # Verificación OTP
│   ├── login/             # Inicio de sesión
│   ├── dashboard/         # Panel de usuario
│   ├── purchase/          # Compra de pulseras
│   ├── checkout/          # Proceso de pago
│   ├── order-success/     # Confirmación de compra
│   ├── payment-failed/    # Error de pago
│   └── scan/[qrCode]/     # Escaneo público de QR
├── components/            # Componentes reutilizables
├── context/              # Contextos de React
├── hooks/                # Custom hooks
├── services/             # Servicios API
├── types/                # Definiciones TypeScript
├── utils/                # Utilidades y helpers
└── constants/            # Constantes de la aplicación
```

## 🔄 Flujo de Usuario

### 1. Registro y Autenticación
1. **Página Principal** → Opciones de registro/login
2. **Registro** → Datos del usuario
3. **Verificación OTP** → Código por email
4. **Login** → Autenticación
5. **Dashboard** → Panel principal

### 2. Compra de Pulseras
1. **Selección** → Cantidad de pulseras
2. **Checkout** → Datos de envío y pago
3. **Procesamiento** → Validación de pago
4. **Confirmación** → Estado del pedido

### 3. Gestión de Pulseras
1. **Crear** → Nueva pulsera con información médica
2. **Editar** → Actualizar datos
3. **QR** → Generar código QR
4. **Escanear** → Acceso público a información

## 🚀 Desarrollo

### Instalación
```bash
npm install
```

### Desarrollo
```bash
npm run dev
```

### Variables de Entorno
```env
NEXT_PUBLIC_API_URL=http://localhost:8081/api
```

## 🔧 Configuración

### Backend
El frontend se conecta a un backend Quarkus en:
- **URL**: `http://localhost:8081/api`
- **Base de datos**: PostgreSQL
- **Autenticación**: JWT

## 💰 Precios
- **Pulsera**: $25.000 COP
- **Envío**: Gratuito en Colombia
- **Límites**: 1-10 pulseras por pedido

## 📱 Compatibilidad
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Móviles y tablets

## 🆘 Soporte
- **Email**: soporte@pulserasqr.com
- **Teléfono**: +57 300 123 4567
- **WhatsApp**: Disponible
- **Horarios**: Lunes a Viernes 8:00 AM - 6:00 PM
