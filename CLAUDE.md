# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application for an intelligent bracelet e-commerce system with QR code medical emergency information. The application allows users to purchase smart bracelets, manage medical information, and generate QR codes for emergency access.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 
- **Styling**: Tailwind CSS v4
- **State Management**: React Context (AuthContext)
- **Forms**: React Hook Form
- **HTTP Client**: Axios with interceptors
- **Notifications**: React Hot Toast
- **Icons**: Lucide React
- **QR Generation**: qrcode library

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Environment Variables

Required environment variable:
- `NEXT_PUBLIC_API_URL`: Backend API URL (defaults to `http://localhost:8081/api`)

## Architecture Overview

### Authentication Flow
- JWT-based authentication with automatic token refresh
- OTP verification for registration
- Protected routes using ProtectedRoute component
- AuthContext manages user state globally

### API Integration
- Centralized API configuration in `src/services/api.ts`
- Axios interceptors handle authentication headers and 401 responses
- Separate API modules for auth and pulseras (bracelets)

### Path Aliases
The project uses TypeScript path mapping for clean imports:
- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/app/*` → `./src/app/*`
- `@/types/*` → `./src/types/*`
- `@/utils/*` → `./src/utils/*`
- `@/constants/*` → `./src/constants/*`
- `@/hooks/*` → `./src/hooks/*`
- `@/services/*` → `./src/services/*`
- `@/context/*` → `./src/context/*`

### Key Application Pages
- `/` - Landing page with product information
- `/register` - User registration
- `/verify-otp` - OTP verification
- `/login` - User authentication
- `/dashboard` - User dashboard (protected)
- `/purchase` - Bracelet purchase flow
- `/checkout` - Payment processing
- `/order-success` - Order confirmation
- `/payment-failed` - Payment error handling
- `/scan/[qrCode]` - Public QR code scanning

### Backend Integration
- Quarkus backend running on port 8081
- PostgreSQL database
- JWT authentication
- RESTful API endpoints defined in `API_ENDPOINTS` constant

### Business Logic
- Bracelet price: $25,000 COP
- Purchase limits: 1-10 bracelets per order
- Free shipping in Colombia
- Medical information includes: blood type, emergency contacts, medical conditions, medications, allergies

## Key Components and Patterns

### Authentication Context
- Located at `src/context/AuthContext.tsx`
- Provides global user state and auth methods
- Handles JWT token decoding and expiration
- SSR-safe with proper hydration checks

### API Service Layer
- `src/services/api.ts` contains all API calls
- Uses Axios with request/response interceptors
- Automatic token attachment and 401 handling
- Organized by feature (authApi, pulseraApi)

### Type Definitions
- Comprehensive TypeScript types in `src/types/index.ts`
- Covers User, Pulsera, Order, and Form data structures
- Ensures type safety across the application

### Constants Management
- All application constants in `src/constants/index.ts`
- Includes pricing, validation patterns, API endpoints
- Centralized configuration for easy maintenance

## Development Guidelines

- Use the existing path aliases for imports
- Follow the established API service pattern when adding new endpoints
- Utilize the AuthContext for authentication state
- Add TypeScript types to `src/types/index.ts` for new data structures
- Use React Hook Form for form handling
- Implement proper error handling with React Hot Toast
- Ensure SSR compatibility when accessing localStorage or window objects