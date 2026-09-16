import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const ipDeviceRegistry = new Map(); // ip -> Array of client tokens

async function syncDevicePermissions() {
  try {
    const authHeader = 'Basic ' + Buffer.from('admin@xathongminh.gov.vn:AdminPassword123!').toString('base64');
    const res = await fetch('http://localhost:8082/api/devices?all=true', {
      headers: { Authorization: authHeader },
    });
    if (res.ok) {
      const devices = await res.json();
      for (const dev of devices) {
        await fetch('http://localhost:8082/api/permissions', {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: 1, deviceId: dev.id }),
        }).catch(() => {});

        await fetch('http://localhost:8082/api/permissions', {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ deviceId: dev.id, notificationId: 1 }),
        }).catch(() => {});
      }
    }
  } catch {}
}

const clientIpPlugin = () => ({
  name: 'client-ip',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const urlObj = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && (urlObj.pathname === '/client-ip' || urlObj.pathname === '/client-ip/')) {
        const rawIp =
          req.headers['cf-connecting-ip'] ||
          req.headers['x-real-ip'] ||
          req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
          req.socket?.remoteAddress ||
          '127.0.0.1';
        const ip = String(rawIp).replace(/^::ffff:/, '');
        
        const token = urlObj.searchParams.get('token') || `dev_${Math.random().toString(36).substring(2, 8)}`;
        if (!ipDeviceRegistry.has(ip)) {
          ipDeviceRegistry.set(ip, []);
        }
        const tokens = ipDeviceRegistry.get(ip);
        let index = tokens.indexOf(token);
        if (index === -1) {
          tokens.push(token);
          index = tokens.length - 1;
        }

        // Generate unique suffix per device on the same IP (e.g. 171.236.48.232-01, 171.236.48.232-02)
        const deviceIndex = index + 1;
        const numStr = String(deviceIndex).padStart(2, '0');
        const deviceId = `${ip}-${numStr}`;

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          ip,
          deviceId,
          deviceIndex,
        }));
        return;
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), clientIpPlugin()],
  server: {
    port: 3001,
    host: true,
    allowedHosts: true,
    proxy: {
      '/gps': {
        target: 'http://localhost:5055',
        rewrite: (path) => path.replace(/^\/gps/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', () => {
            setTimeout(syncDevicePermissions, 500);
          });
        },
      },
    },
  },
});
