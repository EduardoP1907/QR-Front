#!/bin/bash
# Script para desplegar el frontend en S3 + CloudFront
# Ejecutar este script EN TU PC LOCAL (Windows con Git Bash o WSL)

# Variables (CAMBIAR ESTOS VALORES)
BUCKET_NAME="pulseras-qr-frontend"
CLOUDFRONT_DISTRIBUTION_ID="E1234567890ABC"  # Obtener de CloudFront Console
API_URL="http://TU_IP_EC2/api"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Iniciando despliegue del frontend...${NC}"

echo -e "${YELLOW}📝 Configurando variables de entorno...${NC}"
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=$API_URL
EOF

echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
npm install

echo -e "${YELLOW}🏗️  Compilando Next.js...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build exitoso${NC}"
else
    echo -e "${RED}❌ Error en el build${NC}"
    exit 1
fi

echo -e "${YELLOW}☁️  Subiendo archivos a S3...${NC}"
aws s3 sync out/ s3://$BUCKET_NAME/ --delete

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Archivos subidos a S3${NC}"
else
    echo -e "${RED}❌ Error al subir archivos${NC}"
    exit 1
fi

echo -e "${YELLOW}🔄 Invalidando cache de CloudFront...${NC}"
aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cache invalidado${NC}"
else
    echo -e "${YELLOW}⚠️  No se pudo invalidar el cache (puede tomar unos minutos)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Despliegue completado${NC}"
echo -e "${GREEN}📱 Frontend disponible en: https://TU_CLOUDFRONT.cloudfront.net${NC}"
echo -e "${YELLOW}⏰ Puede tomar 5-10 minutos propagar los cambios en CloudFront${NC}"
