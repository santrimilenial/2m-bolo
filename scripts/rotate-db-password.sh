#!/bin/bash
# ==============================================
# ROTATE PostgreSQL Password — Clicco Finance
# ==============================================
# Jalankan sebagai root atau user postgres
# ==============================================

set -e

# Generate random password
NEW_PASSWORD=$(openssl rand -base64 24)

echo "=========================================="
echo "  ROTATE PostgreSQL Password"
echo "=========================================="
echo ""
echo "New password: $NEW_PASSWORD"
echo ""

# Update PostgreSQL password
sudo -u postgres psql -c "ALTER USER clicco WITH PASSWORD '$NEW_PASSWORD';"

# Update .env file
ENV_FILE="/home/1m.clicco.co.id/public_html/.env"
sed -i "s|postgresql://clicco:.*@localhost|postgresql://clicco:${NEW_PASSWORD}@localhost|" "$ENV_FILE"

echo ""
echo "✅ PostgreSQL password rotated successfully!"
echo "✅ .env file updated!"
echo ""
echo "PENTING: Restart aplikasi setelah ini:"
echo "  cd /home/1m.clicco.co.id/public_html && npx pm2 restart all"
