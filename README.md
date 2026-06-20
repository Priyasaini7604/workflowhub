# WorkflowHub

A full-stack HR and IT Asset Lifecycle Management System 
built with Django REST Framework and React.

## Tech Stack
- Backend: Django + Django REST Framework
- Frontend: React (in progress)
- Database: MySQL
- Authentication: JWT (JSON Web Tokens)
- Authorization: Role-Based Access Control (RBAC)

## Project Setup

### 1. Clone the repository
    git clone https://github.com/Priyasaini7604/workflowhub.git
    cd workflowhub

### 2. Create virtual environment
    python -m venv venv
    venv\Scripts\activate

### 3. Install dependencies
    pip install -r requirements.txt

### 4. Create .env file
    SECRET_KEY=your-secret-key
    DEBUG=True
    DB_NAME=it_asset_lifecycle
    DB_USER=your-db-user
    DB_PASSWORD=your-db-password
    DB_HOST=localhost
    DB_PORT=3306

### 5. Run migrations
    python manage.py makemigrations
    python manage.py migrate

### 6. Run server
    python manage.py runserver

## Apps
- users — Authentication & User Management
- employees — Employee Profiles
- assets — IT Asset Management
- onboarding — Employee Onboarding
- offboarding — Employee Offboarding
- notifications — Notifications
- Documents — Document Management
- audit — Audit Logs

## API Endpoints
- /api/users/ — User Authentication
- /api/employees/ — Employee Management
- /api/assets/ — Asset Management
- /api/onboarding/ — Onboarding Tasks
- /api/offboarding/ — Offboarding Tasks
- /api/notifications/ — Notifications
- /api/documents/ — Document Management
- /api/audit/ — Audit Logs

## Project Status
- ✅ Phase 1 — Setup
- ✅ Phase 2 — Models
- ✅ Phase 3 — Serializers
- ✅ Phase 4 — Views
- ✅ Phase 5 — URLs
- ✅ Phase 6 — Permissions
- ✅ Phase 7 — JWT Auth
