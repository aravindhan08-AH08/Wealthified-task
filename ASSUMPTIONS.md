# Core Assumptions — Wealthify Mutual Fund Dashboard

This document details the core architectural assumptions made during the development and restructuring of the **Wealthify** application.

---

### 1. Database Architecture (PostgreSQL Migration)
- We assume that the production and local database server uses **PostgreSQL (v15+)**.
- The default connection parameters are:
  - **Host**: `localhost`
  - **Port**: `5432`
  - **Database Name**: `wealthify`
  - **User**: `postgres`
  - **Password**: `postgres`
- Environment variables (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) are supported to dynamically override connection parameters.
- We assume tables and indexes are initialized automatically on FastAPI application startup if they do not exist.

---

### 2. Transaction Date Normalization
- We assume that transaction records uploaded via CSV files may have varying date formats (such as `DD-MM-YYYY`, `DD/MM/YYYY`, or `YYYY-MM-DD`).
- To maintain reliable date range filtering and sorting in PostgreSQL, all incoming transaction dates are strictly normalized to a zero-padded `YYYY-MM-DD` format on import.

---

### 3. Dual-Mode Resilient Fallback (Statically Deployed Environments)
- We assume the frontend dashboard may be deployed statically to hostings like **GitHub Pages**, where a live Python FastAPI backend server is unreachable.
- To prevent blank page errors, a dual-mode persistence fallback is implemented:
  - If the FastAPI server is reachable, all transactions are fetched dynamically from PostgreSQL.
  - If the backend server is unreachable, the system automatically falls back to client-side data stored in the browser's `localStorage` and seeds a default demo transaction dataset.

---

### 4. Financial Calculations (Weighted NAV)
- We assume that calculating a simple arithmetic mean of the purchase NAV price is financially inaccurate because transaction amounts and held units vary.
- We implement the **Weighted Average NAV** formula:
  $$\text{Weighted NAV} = \frac{\sum (\text{Purchase Price} \times \text{Units})}{\sum \text{Units}}$$
  This accurately represents the blended cost basis of the entire active portfolio.

---

### 5. UI Elements & Database Buttons Removal
- We assume that the user wants a clean, distraction-free dashboard header matching their layout screenshot.
- Therefore, the **Upload CSV** label and **Reset** database buttons have been completely removed from the frontend top-right header interface.
- The corresponding backend API endpoints `/api/upload-csv` and `/api/reset-db` remain active for testing, developer administrative scripting, or background operations.
