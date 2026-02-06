#!/bin/bash
# Server Setup Script for Booking Engine
# Run this once on fresh server

set -e

echo "=== Booking Engine Server Setup ==="

# Update system
echo "Updating system..."
apt update && apt upgrade -y

# Install Node.js 20
echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
echo "Installing pnpm..."
npm install -g pnpm@9

# Install PM2
echo "Installing PM2..."
npm install -g pm2

# Install Nginx
echo "Installing Nginx..."
apt install -y nginx

# Install certbot for SSL
echo "Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Create app directory
echo "Creating app directory..."
mkdir -p /var/www/booking-engine
chown -R $USER:$USER /var/www/booking-engine

# Clone repository (first time only)
if [ ! -d "/var/www/booking-engine/.git" ]; then
    echo "Cloning repository..."
    git clone git@github.com:metinweb/booking-engine.git /var/www/booking-engine
fi

# Setup PM2 to start on boot
echo "Setting up PM2 startup..."
pm2 startup systemd -u root --hp /root

echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Create .env file in /var/www/booking-engine/apps/api/"
echo "2. Configure Nginx (see nginx.conf template)"
echo "3. Run: cd /var/www/booking-engine && pnpm install"
echo "4. Run: pnpm --filter admin run build"
echo "5. Run: pm2 start ecosystem.config.js"
echo "6. Setup SSL: certbot --nginx -d app.maxirez.com -d api.maxirez.com"
