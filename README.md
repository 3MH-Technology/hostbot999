# BotOps Platform

A fully private, production-ready, high-performance Telegram bot hosting platform for a single admin user.

## Features
- **Backend**: Python FastAPI, PostgreSQL, Redis, Celery
- **Frontend**: Next.js (React), Tailwind CSS, Recharts (Dark Theme)
- **Infrastructure**: Docker, Nginx (Reverse Proxy & SSL), Kubernetes manifests
- **Capabilities**: Upload/start/stop/restart bots, real-time logs, CPU/RAM monitoring, multi-language support (Python, Node.js, Go).

## Setup Instructions

### 1. Prerequisites
- Docker and Docker Compose installed.
- Domain name pointed to your server (for SSL).

### 2. Configuration
- Update `nginx/nginx.conf` with your domain name.
- Set up environment variables in a `.env` file based on `docker-compose.yml`.

### 3. Running with Docker Compose
```bash
docker-compose up -d --build
```

### 4. Running with Kubernetes (Optional)
```bash
kubectl apply -f k8s/
```

### 5. Accessing the Dashboard
Open your browser and navigate to `https://your-domain.com`.
Default admin credentials should be configured in your environment variables.
