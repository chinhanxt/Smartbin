# Smartbin Unified Cloudflare Gateway & Auto Permission Sync

Cổng Reverse Proxy hợp nhất (Unified Gateway) dành cho Cloudflare Tunnel và tiến trình phân quyền tự động cho các thiết bị GPS ngoại mạng kết nối vào hệ sinh thái Smartbin.

## Chức năng chính
- **Reverse Proxy Port 3090:** Định tuyến subpath thông suốt giữa:
  - `/appmobile/` ➡️ Smartbin Mobile Driver GPS Tracker (`:3001`)
  - `/core/` ➡️ Smartbin Central Web Application (`:3000`)
  - `/api/socket` ➡️ Traccar WebSocket (`:8082`)
  - `/api/` ➡️ Traccar REST API (`:8082`)
  - `/gps` & `/appmobile/gps` ➡️ Traccar OsmAnd GPS Receiver (`:5055`)
  - `/client-ip` & `/appmobile/client-ip` ➡️ Trích xuất IP thực thoại di động từ header `CF-Connecting-IP`.
- **Auto Permission Sync (`auto_permission_sync.py`):** Tiến trình nền tự động quét các thiết bị di động mới kết nối từ Internet và tự động gán quyền xem cho Admin (`userId: 1`), giúp thiết bị hiển thị và focus tức thì trên bản đồ.

## Khởi chạy
```bash
docker compose up -d
```
