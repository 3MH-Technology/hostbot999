# Root Cause Analysis (RCA) - BotOps Platform

## 1. Redundancy & Architectural Conflict
- **Issue**: The system has two distinct "backends". One is implemented within Next.js API routes (`app/api/`), and another is a standalone Python FastAPI service (`backend/`).
- **Symptoms**: `docker-compose.yml` points the frontend to the Python backend, but the Next.js app has its own logic in `lib/botManager.ts` and `lib/db.ts` that isn't shared with the Python backend. Nginx routes `/api/` to the Python backend, potentially breaking Next.js internal API calls if they are used.
- **Root Cause**: Architectural drift or incomplete migration between a Python-based backend and a Next.js full-stack implementation.

## 2. Authentication & Authorization Flaws
- **Issue**: Hardcoded credentials in `app/api/auth/route.ts`.
- **Symptoms**: Vulnerability to unauthorized access if source code is exposed. Lack of JWT verification middleware on sensitive endpoints (`/api/bots`, `/api/system`).
- **Root Cause**: Reliance on "security by obscurity" and lack of a unified authentication middleware.

## 3. Remote Code Execution (RCE) by Design
- **Issue**: The platform allows execution of arbitrary Python/Node.js code.
- **Symptoms**: `lib/botManager.ts` uses `spawn()` to run user-provided code directly on the host/container.
- **Root Cause**: Lack of sandboxing (e.g., Docker containers for bots) for bot execution. While the platform is for a "single admin," a compromised admin account leads to full system compromise.

## 4. Environment Configuration
- **Issue**: Hardcoded values in `nginx.conf` and `next.config.ts`.
- **Root Cause**: Static configuration files instead of template-based or environment-driven configurations.
