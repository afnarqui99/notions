#!/bin/bash

# Script para detener todas las bases de datos Docker

echo "🛑 Deteniendo todas las bases de datos Docker..."

echo ""
echo "📦 Deteniendo PostgreSQL..."
cd postgresql
docker-compose down
cd ..

echo ""
echo "📦 Deteniendo MySQL..."
cd mysql
docker-compose down
cd ..

echo ""
echo "📦 Deteniendo SQL Server..."
cd sqlserver
docker-compose down
cd ..

echo ""
echo "✅ Todas las bases de datos han sido detenidas."

