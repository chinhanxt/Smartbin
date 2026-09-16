# 🐳 Hướng Dẫn Đóng Gói & Chạy Docker Microservices Độc Lập — Hệ Thống Smartbin

Dự án đã được module hóa và đóng gói thành **2 Docker Microservices độc lập hoàn toàn**, sử dụng cơ chế **Multi-stage build** và nền tảng **Nginx Alpine** siêu nhẹ (~70 MB mỗi container), đảm bảo hiệu năng cao, bảo mật và khả năng mở rộng linh hoạt.

---

## 🏗️ 1. Danh Sách 2 Docker Microservices Độc Lập

| STT | Microservice | Thư mục nguồn | Tên Docker Image | Cổng Container | Cổng Host Mặc định | Chức năng nghiệp vụ |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **1** | **App Web Giám Sát Trung Tâm** | `/home/chinhan/traccar/traccar-web` | `smartbin-web:latest` | `80` | `3000` | Bảng điều khiển trung tâm, bản đồ trực tuyến xe thu gom, biểu đồ phân tích viễn thông, báo cáo sự cố & điểm dừng đỗ. |
| **2** | **Bộ Phát GPS Di Động Độc Lập** | `/home/chinhan/smartbin-mobile-tracker` | `smartbin-mobile-tracker:latest` | `80` | `3001` | Microservice độc lập dành cho tài xế & điện thoại hiện trường: tự nhận diện IP thiết bị, phát toạ độ vệ tinh liên tục & nút bấm SOS khẩn cấp. |

---

## 🚀 2. Cách Khởi Chạy Từng Docker Container Độc Lập (Docker CLI)

Bạn có thể build và chạy từng container hoàn toàn riêng biệt mà không phụ thuộc vào nhau:

### 🔹 Microservice 1: App Web Giám Sát (`smartbin-web`)
```bash
# Di chuyển vào thư mục web app
cd /home/chinhan/traccar/traccar-web

# Build image độc lập
docker build -t smartbin-web:latest .

# Chạy container độc lập (ánh xạ cổng 3000 host -> cổng 80 container)
docker run -d \
  --name smartbin-web-app \
  -p 3000:80 \
  --add-host=host.docker.internal:host-gateway \
  --restart unless-stopped \
  smartbin-web:latest
```
* 🌐 **Truy cập Web Quản trị**: `http://localhost:3000`
* 🩺 **Kiểm tra Healthcheck**: `curl http://localhost:3000/health` (Trả về `healthy`)
* 🔍 **Kiểm tra Client IP**: `curl http://localhost:3000/client-ip`

---

### 🔹 Microservice 2: Bộ Phát GPS Mobile (`smartbin-mobile-tracker`)
```bash
# Di chuyển vào thư mục mobile tracker
cd /home/chinhan/smartbin-mobile-tracker

# Build image độc lập
docker build -t smartbin-mobile-tracker:latest .

# Chạy container độc lập (ánh xạ cổng 3001 host -> cổng 80 container)
docker run -d \
  --name smartbin-mobile-tracker-app \
  -p 3001:80 \
  --add-host=host.docker.internal:host-gateway \
  --restart unless-stopped \
  smartbin-mobile-tracker:latest
```
* 📱 **Truy cập App Mobile GPS**: `http://localhost:3001`
* 🩺 **Kiểm tra Healthcheck**: `curl http://localhost:3001/health` (Trả về `healthy`)
* 🔍 **Kiểm tra Client IP**: `curl http://localhost:3001/client-ip`

---

## 🧩 3. Khởi Chạy Toàn Bộ Hệ Thống Bằng Docker Compose

Nếu bạn muốn khởi chạy đồng thời cả 2 microservices chỉ bằng 1 lệnh duy nhất:

```bash
# Di chuyển vào thư mục traccar
cd /home/chinhan/traccar

# Khởi chạy toàn bộ cụm container ở chế độ chạy nền
docker compose up -d --build

# Xem trạng thái các container
docker compose ps

# Xem nhật ký hoạt động (logs)
docker compose logs -f

# Dừng hệ thống
docker compose down
```

---

## ⚙️ 4. Cấu Trúc Đóng Gói Bên Trong Container

Mỗi microservice đều được trang bị:
1. **Multi-stage Dockerfile**:
   - `Stage 1 (node:20-alpine)`: Cài đặt dependencies và biên dịch mã nguồn JavaScript/React tối ưu bằng Vite.
   - `Stage 2 (nginx:alpine)`: Chỉ giữ lại bundle tĩnh đã build và file cấu hình máy chủ Nginx, giúp giảm kích thước image xuống mức tối thiểu (~70 MB).
2. **Nginx Tinh Gọn & Tối Ưu Hóa**:
   - **SPA Routing**: Tự động fallback `try_files $uri $uri/ /index.html` để hỗ trợ điều hướng router phía client mà không bị lỗi 404.
   - **Gzip Compression**: Nén tự động toàn bộ file tĩnh (CSS, JS, JSON, SVG).
   - **Proxy thông minh**:
     - `smartbin-web`: Reverse proxy `/api` và WebSocket `/api/socket` về backend Traccar (port 8082).
     - `smartbin-mobile-tracker`: Reverse proxy gói tin `/gps` về cổng thu thập OsmAnd (port 5055).
   - **Endpoint `/client-ip`**: Tự động nhận diện địa chỉ IP của thiết bị client kết nối.
   - **Healthcheck `/health`**: Định kỳ 30 giây kiểm tra tình trạng sống của container để tự động phục hồi nếu có sự cố.
