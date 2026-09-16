# Smartbin Microservices Portal Hub 🚀

> **Nhánh**: `portal` / `smartbin-portal`  
> **Kiến trúc**: Micro-Frontends & Docker Containerization Hub  
> **Cổng truy cập Portal**: `http://localhost:3080`

Cổng điều hành hợp nhất (**Single Pane of Glass**) cho toàn bộ hệ sinh thái Smartbin IoT. Nhánh này được khởi tạo độc lập, chứa ứng dụng web đóng vai trò trung tâm điều phối, giám sát trạng thái sức khỏe (health checks) và nhúng trực tiếp giao diện tương tác của 6 Microservices chạy trên Docker.

---

## 🌐 Danh Mục 6 Microservices Độc Lập

| STT | Dịch Vụ Microservice | Nhánh Git | Cổng Host | Docker Container | Docker Image |
| :---: | :--- | :--- | :---: | :--- | :--- |
| **0** | **Smartbin Portal Hub** *(Trang này)* | `portal` | **`3080`** | `smartbin-portal` | `smartbin-portal:latest` |
| **1** | **Web App Giám Sát & Báo Cáo** | `webapp` | **`3005`** | `smartbin-webapp-service` | `smartbin-webapp:latest` |
| **2** | **Cổng Dịch Vụ Cư Dân** | `smartbin-citizen-service` | **`3002`** | `smartbin-citizen-microservice` | `smartbin-citizen-service:latest` |
| **3** | **Quản Trị & Thu Phí Dịch Vụ** | `smartbin-admin-billing-service` | **`3003`** | `smartbin-admin-billing-microservice` | `smartbin-admin-billing-service:latest` |
| **4** | **Quản Lý Nhân Sự & Ca Trực** | `smartbin-hrm-service` | **`3004`** | `smartbin-hrm-microservice` | `smartbin-hrm-service:latest` |
| **5** | **Mô Phỏng 3D Thùng Rác IoT** | `project` | **`8080`** | `smart-trashcan-microservice` | `smart-trashcan-3d:latest` |
| **6** | **Hệ Thống Lõi & Traccar Server** | `project-main` | **`3000`** | `smartbin-web-app` | `smartbin-web:latest` |

---

## ⚡ Hướng Dẫn Khởi Chạy

### 1. Khởi chạy riêng Portal Hub (Port 3080)

```bash
# Build image và chạy container ở chế độ nền
docker compose up -d --build

# Kiểm tra trạng thái container
docker ps | grep smartbin-portal

# Truy cập trình duyệt:
# http://localhost:3080
```

### 2. Khởi chạy toàn bộ cụm 6 Microservices cùng Portal

Nếu bạn đã build sẵn toàn bộ các Docker image của các nhánh, có thể khởi động toàn bộ cụm:

```bash
docker compose -f docker-compose.all.yml up -d
```

### 3. Lệnh chạy thủ công từng Container

```bash
# 0. Portal Hub (Port 3080)
docker run -d --name smartbin-portal -p 3080:80 smartbin-portal:latest

# 1. Web App Giám Sát (Port 3005)
docker run -d --name smartbin-webapp-service -p 3005:80 smartbin-webapp:latest

# 2. Cổng Cư Dân (Port 3002)
docker run -d --name smartbin-citizen-service -p 3002:80 smartbin-citizen-service:latest

# 3. Quản Trị & Thu Phí (Port 3003)
docker run -d --name smartbin-admin-billing-service -p 3003:80 smartbin-admin-billing-service:latest

# 4. Nhân Sự & Ca Trực (Port 3004)
docker run -d --name smartbin-hrm-service -p 3004:80 smartbin-hrm-service:latest

# 5. Mô Phỏng 3D Thùng Rác (Port 8080)
docker run -d --name smart-trashcan-microservice -p 8080:80 smart-trashcan-3d:latest

# 6. Core System Web (Port 3000)
docker run -d --name smartbin-web-app --add-host host.docker.internal:host-gateway -p 3000:80 smartbin-web:latest
```

---

## 🛠️ Cấu Trúc Thư Mục Nhánh `portal`

```text
.
├── .gitignore              # Bỏ qua node_modules, build, logs
├── Dockerfile              # Nginx Alpine image tối ưu (~20MB)
├── docker-compose.yml      # File compose khởi chạy portal tại port 3080
├── docker-compose.all.yml  # File compose khởi chạy toàn bộ 6 microservices
├── index.html              # Ứng dụng điều hành giao diện Micro-Frontend Single Pane of Glass
├── nginx.conf              # Cấu hình Nginx reverse-proxy, healthcheck và CORS
└── README.md               # Tài liệu hướng dẫn sử dụng
```

---

## 🎯 Tính Năng Chính Của Web Portal

1. **Dashboard KPI Cụm**: Hiển thị tổng số dịch vụ, số lượng dịch vụ đang hoạt động thực tế thời gian thực.
2. **Ping Kiểm Tra Trạng Thái Sức Khỏe Tự Động**: Định kỳ mỗi 15 giây gửi health ping tới từng microservice và hiển thị độ trễ latency (ms).
3. **Sandbox Iframe Đa Nhiệm**: Cho phép trực tiếp điều khiển, thao tác hoặc tra cứu trên bất kỳ microservice nào ngay trong portal mà không cần chuyển qua nhiều tab khác nhau.
4. **Mở Tab Độc Lập**: Mỗi thẻ dịch vụ đều có nút mở sang tab mới cho các tác vụ cần toàn màn hình.
5. **Hộp Thoại Docker Cheatsheet**: Cung cấp sẵn mẫu câu lệnh Docker CLI và Docker Compose để kỹ sư DevOps thao tác nhanh.
