# VPS Deployment Guide (Ubuntu + Nginx + PM2)

This guide provides step-by-step instructions for deploying the RestoLedger POS SaaS on a Linux VPS.

## 1. Initial Server Setup
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm mysql-server nginx -y
```

## 2. Database Setup
```bash
sudo mysql -u root
CREATE DATABASE restoledger;
CREATE USER 'ledger_admin'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON restoledger.* TO 'ledger_admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```
Import the schema:
```bash
mysql -u ledger_admin -p restoledger < path/to/schema.sql
```

## 3. Backend Deployment
1. Upload code to `/var/www/restoledger/backend`.
2. Install dependencies: `npm install --production`.
3. Configure `.env`:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=ledger_admin
   DB_PASS=your_strong_password
   DB_NAME=restoledger
   JWT_SECRET=your_32_char_secret
   FRONTEND_URL=https://pos.yourdomain.com
   ```
4. Start with PM2:
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name restoledger-api
   pm2 save
   pm2 startup
   ```

## 4. Frontend Deployment
1. Build locally: `npm run build`.
2. Upload `dist/` folder to `/var/www/restoledger/frontend/dist`.

## 5. Nginx Configuration
Create `/etc/nginx/sites-available/restoledger`:
```nginx
server {
    listen 80;
    server_name pos.yourdomain.com;

    location / {
        root /var/www/restoledger/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/restoledger /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 6. SSL with Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d pos.yourdomain.com
```

## 7. Automatic Backups
Ensure the `backups` directory in the backend is writable:
```bash
mkdir -p /var/www/restoledger/backend/backups
chmod 755 /var/www/restoledger/backend/backups
```
The built-in `backupScheduler.js` will handle daily dumps.
