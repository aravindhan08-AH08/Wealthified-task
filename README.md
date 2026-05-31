# Mutual Fund Transaction Dashboard 📈

A modern, high-performance **Vanilla HTML + CSS + JavaScript** dashboard for tracking mutual fund transaction summaries, powered by a **Python / FastAPI** backend and a persistent **SQLite** database.

---

## 🏛 System Architecture (Dual-Mode Design)

To ensure the dashboard works flawlessly in both local and statically deployed environments, it implements a smart **Dual-Mode Architecture**:

1. **Online Mode (FastAPI + SQLite)**: When running locally, the dashboard communicates directly with the Python FastAPI backend, persisting and aggregating your transactions inside a persistent SQLite database.
2. **Offline Fallback Mode (Browser LocalStorage DB)**: When deployed as a static site (such as on **GitHub Pages**), the frontend automatically detects that the backend is unreachable. Instead of showing a blank screen, it seamlessly switches to a client-side database backed by browser `localStorage`. 

All core features—including **date range filtering, metrics cards, interactive Chart.js graphs, and even CSV file uploading/parsing—remain 100% functional** even when running statically online with zero backend servers!

```mermaid
graph TD
    subgraph Frontend [Frontend Dashboard (Port 5500)]
        UI[index.html & CSS] <--> API[api.js (Dual-Mode Fetch)]
        API --> Charts[charts.js (Chart.js)]
        API --> Metrics[metrics.js]
        API --> Tabs[tabs.js]
    end
    
    subgraph Online_Mode [Online Mode (Local Development)]
        Router[main.py (API Routes)] <--> DB_Layer[database.py (SQL Helper)]
        DB_Layer <--> DB[(mutual_funds.db SQLite)]
    end
    
    subgraph Offline_Mode [Offline Fallback Mode (Deployed / GitHub Pages)]
        LS[(Browser LocalStorage DB)]
    end

    API <--> |JSON API / CORS| Router
    API <--> |Local Persistence Fallback| LS
    API -.-> |Multipart CSV Upload| Router
```


---

## 🛠 Prerequisites & Dependencies

To run this application locally, ensure you have the following installed on your system:

| Layer | Tool / Dependency | Version Required | Purpose |
| :--- | :--- | :--- | :--- |
| **System** | [Python](https://www.python.org/downloads/) | `3.9` or higher | Runs the backend and local servers |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/) | `0.110.0` | High-performance async web framework |
| **Backend** | [Uvicorn](https://www.uvicorn.org/) | `0.28.0` | ASGI web server implementation |
| **Backend** | [python-multipart](https://github.com/Kludex/python-multipart) | `0.0.9` | Handles multi-part file uploads (CSV files) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | `15` or higher | Robust persistent SQL transaction storage |
| **Frontend** | HTML, CSS, JS | Native | Clean, responsive and interactive client-side rendering |
| **Frontend** | [Google Fonts](https://fonts.google.com/) | DM Sans & DM Mono | Sleek typography and monospace layouts |

---

## 🚀 How to Setup & Run

### Method 1: The One-Click Way (Windows) — Recommended ⚡
An automated, production-ready launcher script is provided to set up and run everything instantly.

1. Navigate to the root directory `mutual-fund-dashboard/`.
2. **Double-click** the **`run.bat`** file.
3. The launcher will automatically:
   - Verify your local Python installation.
   - Create a localized Python virtual environment (`backend/.venv`) if it does not exist.
   - Upgrade `pip` and install all required dependencies from `backend/requirements.txt`.
   - Start the **FastAPI backend** on `http://localhost:8000` in a new window.
   - Start a **local HTTP server** for the frontend on `http://localhost:5500`.
   - Launch your default web browser and open the dashboard automatically.

---

### Method 2: Manual Installation & Run (Multi-Platform) 💻
If you prefer running manual commands or are using macOS/Linux, follow these steps:

#### 1. Setup & Run the Backend
```bash
# 1. Navigate to the backend folder
cd backend

# 2. Create a virtual environment
python -m venv .venv

# 3. Activate the virtual environment
# On Windows (cmd):
.venv\Scripts\activate.bat
# On macOS/Linux/Git Bash:
source .venv/bin/activate

# 4. Install backend dependencies
pip install -r requirements.txt

# 5. Start the FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The backend database initializes and seeds itself with demo transactions automatically upon startup.*

#### 2. Run the Frontend
In a new terminal window, navigate to the root directory and start a local server:
```bash
# Navigate to project root
cd mutual-fund-dashboard

# Start local server
python -m http.server 5500
```
Open your web browser and navigate to **`http://localhost:5500`**.

---

## 📊 How to See the Output Details

Once the dashboard is loaded in your browser, you can explore the transaction summaries through several interactive views:

### 1. The 4 Dynamic Dashboard Tabs
* **Tab 1: Investor / Fund** — Summarizes transactions grouped by Mutual Fund Scheme. Shows who purchased units, their PAN, the units purchased, purchase price (NAV), and trade dates.
* **Tab 2: Fund / Investor** — Grouped by individual Investor (based on PAN). Displays all schemes purchased by a single investor, with corresponding amount totals.
* **Tab 3: Investor List** — A sorted tabular ledger of all unique investors, listing their primary name, tax status, total transaction count, and cumulative invested capital.
* **Tab 4: Fund Summary** — Aggregate details per scheme showing total invested amount, total units, average purchase price, unique investor counts, and interactive data charts.

### 2. Date-Range Filtering (Auto-Discovered)
* On initial load, the dashboard automatically scans the database to find the absolute minimum and maximum trade dates.
* The date filter input fields (`FROM` and `TO`) are auto-populated to display this full range.
* To filter, select new dates and click **Apply**. The backend dynamically queries SQLite using index-accelerated range filters and returns the updated metrics, tables, and charts instantly.
* Click **Reset** to return to the database's full date bounds.

### 3. Uploading Custom Datasets (CSV File Import)
You can upload your own mutual fund transaction CSV sheet directly from the dashboard:
1. Click the **"Upload CSV"** button in the sidebar.
2. Select any standard transaction CSV file.
3. The dashboard displays a modern loading animation, transmits the file to the FastAPI server, parses it, inserts the records into SQLite, and automatically updates all graphs, summaries, and metrics in real-time.
4. An elegant glassmorphic **floating notification banner** reports the success or failure of your upload.

### 4. Database Reset (Demo Mode)
* Click **"Reset to Demo"** in the sidebar to clear all custom uploads and re-seed the SQLite database back to its standard mock transactions for testing.

---

## 🖥 Output & UI Specifications

The dashboard utilizes a curated **dark-theme modern system design** with harmonized color palettes:

* **Sleek Typography**: Utilizes `DM Sans` for clean UI scanning and `DM Mono` for numerical values.
* **KPI Metric Cards**: Dynamic top-tier indicators showing:
  - **Total Invested**: Multi-colored card using `₹` currency layout.
  - **Total Units**: Displays cumulative NAV units purchased, rounded precisely.
  - **Unique Funds & Investors**: Count indices mapped directly from SQL aggregations.
* **Double Bar-Charts (Tab 4)**: Interactive charts rendering:
  - Total Capital Invested per Mutual Fund.
  - Total Units Purchased per Mutual Fund.
* **Custom Tables**: Responsive tables with hover row highlights, colored amount text, and distinct pill-badges for PAN numbers and scheme categories.
