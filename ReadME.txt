# Mutual Fund Dashboard — Frontend

A vanilla HTML + CSS + JavaScript dashboard that displays mutual fund transaction summaries by consuming a FastAPI backend.

---

## 📁 Project Structure

```
frontend/
├── index.html
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js        ← All API calls (change BASE_URL here)
│       ├── utils.js      ← Shared helpers (fmt, fmtU, etc.)
│       ├── metrics.js    ← Metric card rendering
│       ├── charts.js     ← Chart.js bar charts
│       └── tabs.js       ← Tab logic + table rendering
└── README.md
```

---

## 🚀 How to Run

1. Clone this repo
2. Open `index.html` in a browser **or** serve with:
   ```bash
   npx serve .
   # or
   python -m http.server 5500
   ```
3. Make sure the backend is running at `http://localhost:8000`
4. If your backend URL is different, update `BASE_URL` in `assets/js/api.js`

---

## 🔗 Backend Repo

> **Backend repo:** `https://github.com/<your-org>/mutual-fund-backend`

The backend is built with **Python / FastAPI**. See the backend README for setup instructions.

---

## 📡 API Contracts

All endpoints accept optional `from_date` and `to_date` query params (`YYYY-MM-DD` format).

---

### 1. Investor-wise Purchase per Mutual Fund

```
GET /api/investor-fund-summary
Query params:
  from_date  (optional) — e.g. 2025-05-01
  to_date    (optional) — e.g. 2025-05-31
```

**Response:**
```json
{
  "data": [
    {
      "scheme": "DSP Nifty 50 Equal Weight Index Fund - Reg - Growth",
      "scheme_type": "Index Fund",
      "total_amount": 6499.68,
      "total_units": 261.4965,
      "investors": [
        {
          "inv_name": "Meethala Pullutummal Narayani",
          "pan": "AAEPN3766A",
          "amount": 6499.68,
          "units": 261.4965,
          "pur_price": 24.86,
          "trade_date": "2025-05-27"
        }
      ]
    }
  ]
}
```

---

### 2. Fund-wise Summary per Investor

```
GET /api/fund-investor-summary
Query params:
  from_date  (optional)
  to_date    (optional)
```

**Response:**
```json
{
  "data": [
    {
      "inv_name": "Shilpa J Suresh",
      "pan": "FRSPS3248J",
      "tax_status": "NRI - Non-Repatriable (NRO)",
      "total_amount": 1491.93,
      "funds": [
        {
          "scheme": "Kotak Gold Fund - Growth (Regular Plan)",
          "scheme_type": "Gold FOF",
          "amount": 1491.93,
          "units": 40.431,
          "pur_price": 36.90
        }
      ]
    }
  ]
}
```

---

### 3. Investor List with Purchase Details

```
GET /api/investor-list
Query params:
  from_date  (optional)
  to_date    (optional)
```

**Response:**
```json
{
  "data": [
    {
      "inv_name": "Priyavarshini Damodaran",
      "pan": "HECPD7014E",
      "tax_status": "Individual",
      "total_amount": 1999.90,
      "transaction_count": 1
    }
  ]
}
```

---

### 4. Mutual Fund Summary

```
GET /api/fund-summary
Query params:
  from_date  (optional)
  to_date    (optional)
```

**Response:**
```json
{
  "data": [
    {
      "scheme": "Kotak Gold Fund - Growth (Regular Plan)",
      "scheme_type": "Gold FOF",
      "total_amount": 4491.78,
      "total_units": 121.731,
      "avg_nav_price": 36.9000,
      "investor_count": 3
    }
  ]
}
```

---

## 🛠 Tech Stack

| Layer      | Technology            |
|------------|----------------------|
| UI         | HTML5, CSS3, Vanilla JS |
| Charts     | Chart.js 4.4.1        |
| Fonts      | DM Sans, DM Mono (Google Fonts) |
| API calls  | Fetch API (native)    |
| Backend    | Python / FastAPI      |

---

## ⚙️ Configuration

To point the frontend to a different backend URL, edit `assets/js/api.js`:

```js
const BASE_URL = "http://localhost:8000"; // ← change this
```