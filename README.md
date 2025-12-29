# 🛡️ PG Backup Pro  
### Enterprise Database Backup Automation Manager

![Backend](https://img.shields.io/badge/Backend-FastAPI-05998b?style=for-the-badge&logo=fastapi)
![Frontend](https://img.shields.io/badge/Frontend-React-61dafb?style=for-the-badge&logo=react)
![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL-336791?style=for-the-badge&logo=postgresql)
![MSSQL](https://img.shields.io/badge/DB-MSSQL-CC2927?style=for-the-badge&logo=microsoft-sql-server)

**PG Backup Pro** is a centralized control plane designed to **automate, monitor, and manage database backups** for **PostgreSQL** and **Microsoft SQL Server (SSMS)**.  
It is built with a strong focus on **security, reliability, performance**, and a **modern DevOps-friendly UI**.

---

## 🚀 Key Features

### 🔹 Core Capabilities
- **Multi-Database Engine Support**
  - PostgreSQL using `pg_dump`
  - Microsoft SQL Server using `sqlcmd` / `pymssql`
- **Smart Background Tasks**
  - Non-blocking backup execution using FastAPI `BackgroundTasks`
- **Automated Retention Policy**
  - Retains only:
    - Last **3 successful**
    - Last **3 failed** backups per connection
- **Dynamic OS Path Detection**
  - Auto-detects backup paths:
    - macOS / Windows → `~/Downloads/PG_Backups`
    - Cloud (Render) → `/app/storage`

### 🔹 Security & Reliability
- **Secure Credential Vault**
  - Database passwords encrypted at rest using **AES-256-GCM**
- **JWT-Based Authentication**
  - Secure API access & file downloads
- **Authenticated File Streaming**
  - No direct disk access to backup files

### 🔹 Monitoring & UX
- **Real-Time Backup Monitoring**
  - Status badges: `Pending`, `Running`, `Completed`, `Failed`
- **History & Audit Trail**
  - Polling-based dashboard with execution metadata
- **One-Click Secure Downloads**

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + Vite  
- **Styling:** Tailwind CSS + shadcn/ui  
- **Animations:** Framer Motion  
- **Icons:** Lucide React  
- **API Client:** Axios with JWT interceptors  

### Backend
- **Language & API:** Python 3.12 + FastAPI  
- **ORM:** SQLAlchemy 2.0 (PostgreSQL & MSSQL dialects)  
- **Migrations:** Alembic  
- **Security:**  
  - JWT (python-jose)  
  - Password hashing: Passlib (bcrypt 4.0.1)  
  - Encryption: PyCryptodome (AES-256-GCM)  
- **Database Drivers:**  
  - PostgreSQL: `psycopg2-binary`  
  - SQL Server: `pymssql`  

---

## 📁 Project Structure

    PG-Data-Backup-Automation/
    ├── Backend/
    │ ├── app/
    │ │ ├── api/v1/ # Route controllers (Auth, Connections, History)
    │ │ ├── core/ # Config, JWT, Security utilities
    │ │ ├── models/ # SQLAlchemy models (SQL Server schema)
    │ │ ├── schemas/ # Pydantic validation schemas
    │ │ └── services/ # Backup engines (Postgres & MSSQL logic)
    │ ├── alembic/ # Database migration scripts
    │ └── Dockerfile # Production Docker build (PostgreSQL 18 tools)
    ├── Frontend/
    │ ├── src/
    │ │ ├── components/ # UI & layout components
    │ │ ├── hooks/ # Custom hooks (backup history, schedules)
    │ │ └── pages/ # Pages (Dashboard, Connections)
    │ └── vercel.json # SPA routing configuration
    └── .gitignore # Root ignore file

---

## ⚙️ Setup & Installation

### 1️⃣ Backend Setup

```bash
cd Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

# Run database migrations
```
alembic upgrade head
```
# Start the API server
```
python -m uvicorn app.main:app --reload
```
### 2️⃣ Frontend Setup
```
cd Frontend
npm install
npm run dev
```
## 🔑 Environment Variables

### Backend (`.env`)

| Variable         | Description                                      |
|------------------|--------------------------------------------------|
| DATABASE_URL     | Connection string for Company SQL Server         |
| SECRET_KEY       | JWT signing secret                               |
| ENCRYPTION_KEY   | 32-character key for AES-256 encryption          |
| ALGORITHM        | JWT algorithm (HS256)                            |

### Frontend (`.env`)

| Variable              | Description            |
|-----------------------|------------------------|
| VITE_API_BASE_URL     | Backend API base URL   |

---

## 🛡️ Security Implementation

### Frontend
- Database passwords are **never stored in plain text**

### Backend
- Credentials are encrypted using **AES-GCM** before database persistence

### Downloads
- Backup files are served only via **JWT-authorized streaming endpoints**

---

## ☁️ Deployment

### Backend / Worker
- Hosted on **Render** using Docker
- Ensures correct `postgresql-client-18` availability

### Frontend
- Hosted on **Vercel**
- SPA rewrite rules enabled

### Database
- Managed **Microsoft SQL Server** for application metadata

---

## 💡 Troubleshooting

### CORS Issues
- Add the Vercel domain to `allow_origins` or `allow_origin_regex` in `app/main.py`

### pg_dump Version Errors
- Ensure the Docker image includes a PostgreSQL client version matching the target database

### 404 on Page Refresh
- Confirm `vercel.json` rewrite rules are enabled

---

## 📜 License

**Internal Project – Proprietary**  
Developed by **Yash Bhilare**

---

⭐ **PG Backup Pro** is designed for teams that value **secure, automated, and observable database operations**.
