import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📨 POST recibido de VirtualPos en /api/payment-return');

    // Extraer datos del POST de VirtualPos
    const formData = await request.formData();
    const formDataObject = Object.fromEntries(formData);
    console.log('📋 Form data de VirtualPos:', formDataObject);

    // Obtener quantity y cid de los query params originales
    const { searchParams } = new URL(request.url);
    const quantity = searchParams.get('quantity');
    const cid = searchParams.get('cid');

    console.log('🔍 Query params:', { quantity, cid });

    // Redirigir a la página de éxito con GET
    const redirectUrl = `/payment-success?quantity=${quantity || 1}&cid=${cid || ''}`;
    console.log('↩️ Redirigiendo a:', redirectUrl);

    return NextResponse.redirect(new URL(redirectUrl, request.url), 303);
  } catch (error) {
    console.error('❌ Error en POST /api/payment-return:', error);
    return NextResponse.redirect(new URL('/payment-failed', request.url), 303);
  }
}

export async function GET(request: NextRequest) {
  // Si VirtualPos hace GET, también redirigir a la página
  const { searchParams } = new URL(request.url);
  const quantity = searchParams.get('quantity');
  const cid = searchParams.get('cid');

  console.log('📨 GET recibido en /api/payment-return');
  console.log('🔍 Query params:', { quantity, cid });

  return NextResponse.redirect(
    new URL(`/payment-success?quantity=${quantity || 1}&cid=${cid || ''}`, request.url),
    303
  );
}
