# Sphere // Containerized Inventory & Order Management System

Sphere is a premium, glassmorphism-themed, containerized Inventory and Order Management System built with a **FastAPI (Python) API Backend**, a **React Frontend**, and **PostgreSQL Database** orchestration.

---

## Technical Stack
- **Backend API**: Python 3.11+, FastAPI, SQLAlchemy ORM, Pydantic validations.
- **Frontend App**: React (Vite & ES modules), Vanilla CSS (glassmorphism tokens), Lucide Icons.
- **Database**: PostgreSQL (Docker mode) or SQLite (local developer fallback).
- **Containerization**: Docker, Docker Compose orchestration.

---

## How to Run the Website

### Method A: Direct Local Launcher (No Docker/Node Required)
Since you have Python 3.12.2 installed, you can run the system instantly with a single double-click.

1. Navigate to the root directory `inventory-order-system`.
2. Double-click the launcher script:
   ```cmd
   run_system.bat
   ```
3. This script will automatically:
   - Create a Python virtual environment.
   - Install all Python backend dependencies.
   - Start the FastAPI backend API on `http://localhost:8000`.
   - Create a local `inventory.db` SQLite database file.
   - Open `preview_website.html` in your browser.
4. Interact with the website! (Add products, register customers, place orders, view low stock alerts on the dashboard).

---

### Method B: Full Production Docker Orchestration (Requires Docker)
To test the production-ready containerized PostgreSQL stack:

1. Ensure Docker Desktop is running.
2. In your terminal, run from the root directory:
   ```bash
   docker compose up --build
   ```
3. This orchestrates three services:
   - **PostgreSQL Database**: Exposes port `5432` with data persistent volumes.
   - **FastAPI Backend**: Exposes port `8000`.
   - **Nginx Frontend**: Builds the Vite React static bundle and hosts it via Nginx on `http://localhost:5173`.
4. Open `http://localhost:5173` in your browser.

---

## Business Logic and API Validations
The application strictly enforces:
1. **SKU Uniqueness**: Product creation and updates check that SKU codes do not overlap.
2. **Email Uniqueness**: Customer registry checks that emails are unique.
3. **Inventory Sufficiency**: Orders cannot be completed if requested quantity exceeds product quantity in stock.
4. **Auto-Deduction and Restore**: Placed orders automatically reduce available stock, and cancelling/deleting an order restores the stock to the product inventory.
5. **Auto-Calculation**: Total pricing calculation is computed securely in the API backend database operations.

---

## Deployment to Free Hosting Platforms

### 1. Backend API (Render / Railway / Fly.io)
- **Render Setup**:
  1. Create a free PostgreSQL instance on Render.
  2. Create a Web Service pointing to your GitHub repository under the `backend` directory.
  3. Set the Environment variables:
     - `DATABASE_URL` (your Render PostgreSQL connection URL).
  4. Set the Build Command: `pip install -r requirements.txt` and Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 10000`.

### 2. Frontend React Website (Vercel / Netlify)
- **Vercel Setup**:
  1. Link your Github repository and deploy a new project selecting the `frontend` subfolder.
  2. Configure environment variable:
     - `VITE_API_URL` (points to your live Render Backend API URL).
  3. Deploy! Vite will automatically compile static assets, and Vercel will host it.
