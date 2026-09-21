# Submission Document — Unbox Robotics Full-Stack Assignment

**Candidate Role:** Robotics Software Engineer – Full Stack  
**Project:** Real-Time Robot Speedometer Monitoring System  

---

## Live Deployment Links

* **Live Frontend UI:** [https://unbox-frontend-s2qu.onrender.com/](https://unbox-frontend-s2qu.onrender.com/)
* **Live Backend API:** [https://unbox-backend-ucjg.onrender.com/](https://unbox-backend-ucjg.onrender.com/)
* **Health Check Probe:** [https://unbox-backend-ucjg.onrender.com/health](https://unbox-backend-ucjg.onrender.com/health)
* **Latest Telemetry API:** [https://unbox-backend-ucjg.onrender.com/api/speed/latest](https://unbox-backend-ucjg.onrender.com/api/speed/latest)
* **GitHub Repository:** [https://github.com/AKSHITAK1040/unbox-robotics](https://github.com/AKSHITAK1040/unbox-robotics)

---

## 1. Approach

The objective was to engineer an industrial, production-grade real-time speedometer system reflecting the operating realities of Autonomous Mobile Robots (AMRs). Real warehouse robots emit continuous velocity telemetry that must be persisted durably for fleet safety, telemetry audit trails, and performance analytics before being surfaced to operations dashboards.

The system is decoupled into four containerized microservices:
1. An autonomous **Sensor Simulator** that generates realistic, bounded physical velocities at 1 Hz intervals.
2. A **Node.js / Express Backend** that validates incoming sensor readings and handles database persistence.
3. A **PostgreSQL Database** that acts as the durable system of record for all velocity samples.
4. A **React Frontend Console** that displays an industrial gauge, digital velocity readout, live telemetry status, and recent readings without client polling or synthetic timers.

---

## 2. Architecture Block Diagram

```mermaid
flowchart TD
    Sensor[Sensor Simulator] -->|1. HTTP POST /api/speed (every 1s)| Backend[Node.js / Express Backend]
    Backend -->|2. INSERT INTO speed_data| Postgres[(PostgreSQL Database)]
    Postgres -->|3. Success confirmation| Backend
    Backend -->|4. Socket.IO emit 'speed_update'| Socket[WebSocket Layer]
    Socket -->|5. Real-time push| Frontend[React Speedometer UI]

    Frontend -.->|Initial load: GET /api/speed/latest| Backend
    Backend -.->|Query latest committed record| Postgres
```

---

## 3. Real-Time Strategy

* **Why Socket.IO:** Instead of wasteful HTTP polling which introduces latency and heavy server overhead, Socket.IO provides bi-directional, event-driven WebSocket communication with automatic reconnection, heartbeat ping/pong, and fallback buffering.
* **DB-First Guarantee:** To prevent "ghost telemetry" (data displayed on-screen that failed to persist), the backend broadcasts the `speed_update` event strictly inside the database transaction's success callback. If PostgreSQL is temporarily down or a write fails, no broadcast occurs, ensuring the UI is always a true reflection of committed database state.

---

## 4. Database Design

PostgreSQL 15 is used with a dedicated time-series table:

```sql
CREATE TABLE IF NOT EXISTS speed_data (
    id BIGSERIAL PRIMARY KEY,
    speed DOUBLE PRECISION NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_speed_data_recorded_at ON speed_data(recorded_at DESC);
```

* `speed`: Double precision numeric field representing linear velocity (0–120 km/h).
* `recorded_at`: Microsecond-precision timezone-aware timestamp set at transaction commit.
* `idx_speed_data_recorded_at`: Descending B-tree index enabling $O(\log n)$ queries for `GET /api/speed/latest` and recent history sliding windows.
* Persistence is preserved across container lifecycles via the Docker named volume `pgdata`.

---

## 5. Dockerization

The entire application runs via `docker compose up --build`, managing four services on a private bridge network (`unbox_network`):

1. **`db` (`unbox_db`):** Official `postgres:15-alpine` image with automatic schema initialization (`database/init.sql`) and a healthcheck (`pg_isready`).
2. **`backend` (`unbox_backend`):** Node.js runtime exposing port `3000`, configured with `depends_on: db: condition: service_healthy` to guarantee database readiness prior to starting the HTTP/WS listener.
3. **`frontend` (`unbox_frontend`):** Multi-stage build (Node 22 build stage compiling Vite bundle, served via static HTTP server on port `5173`).
4. **`simulator` (`unbox_simulator`):** Lightweight Node.js background worker executing the 1-second telemetry loop.

---

## 6. Challenges & Solutions

| Challenge | Impact | Implemented Solution |
| :--- | :--- | :--- |
| **Real-time Synchronization** | Showing data that failed to save would violate audit integrity. | Strict DB-first pipeline: emit `speed_update` only after PostgreSQL `INSERT` succeeds. |
| **Service Startup Race Conditions** | Backend failing to start if PostgreSQL is not yet accepting connections. | PostgreSQL Docker container includes native `pg_isready` healthcheck; backend waits for `service_healthy`. |
| **Failure Handling & Isolation** | Database outage should not crash the backend process. | Handled via structured `try/catch` and error isolation; returns HTTP 500 without broadcasting fake events. |
| **WebSocket Reconnection** | Network drops or restarts should not require manual browser refresh. | Socket.IO client configured with exponential backoff (`reconnectionDelay: 1000`) and live UI connection badge (`SYSTEM ONLINE` / `RECONNECTING...`). |
| **Page Refresh Hydration** | Refreshing browser shouldn't show blank/zero state. | On mount, frontend calls `GET /api/speed/latest` and `GET /api/speed/history` before attaching the live listener. |

---

## 7. Verification

* **Automated Unit & Integration Tests:** 10/10 Jest/Supertest tests passing in `backend/tests/api.test.js`, validating parameter boundary checks, database persistence isolation, failure recovery, and health status.
* **Live Telemetry & Database Audit:** Verified continuous sequential primary key increments (`id`) and microsecond timestamps directly in PostgreSQL while the simulator runs.
* **Visual & Layout Verification:** Headless browser rendering verified at 1440×900, 768×1024, and mobile viewports with zero horizontal overflow, clean typography hierarchy, and smooth needle animations.
