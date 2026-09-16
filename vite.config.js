import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const clientIpPlugin = () => ({
  name: 'client-ip',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url ? req.url.split('?')[0] : '';
      if (req.method === 'GET' && (url === '/client-ip' || url === '/client-ip/')) {
        const rawIp =
          req.headers['cf-connecting-ip'] ||
          req.headers['x-real-ip'] ||
          req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
          req.socket?.remoteAddress ||
          '127.0.0.1';
        const ip = String(rawIp).replace(/^::ffff:/, '');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ip }));
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
      },
    },
  },
});
