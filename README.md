# Mutual Fund Dashboard

A pure HTML + CSS + JS dashboard for mutual fund transaction analysis.
No frameworks. No build tools. Just open `index.html` in a browser.

## Folder Structure

```
mutual-fund-dashboard/
├── index.html              ← Entry point — open this in browser
├── assets/
│   ├── css/
│   │   └── style.css       ← All styles
│   └── js/
│       ├── utils.js        ← fmt(), fmtU() helper functions
│       ├── data.js         ← Transaction data array
│       ├── metrics.js      ← Metric card calculations
│       ├── charts.js       ← Chart.js chart builders
│       ├── filters.js      ← Date range filter logic
│       └── tabs.js         ← Tab switching + table builders
├── data/
│   └── dataset.csv         ← Original CSV file (reference)
└── README.md
```

## How to Run

1. Download and unzip the folder
2. Double-click `index.html` — opens directly in any browser
3. No server needed, no npm install, no build step

## How to Add More Data

Open `assets/js/data.js` and add more objects to the `DATA` array:

```js
{
  amc:        "Kotak",
  folio:      "12345/01",
  scheme:     "Kotak Flexi Cap Fund - Growth",
  inv:        "Investor Name",
  pan:        "ABCDE1234F",
  tradeDate:  "2025-05-15",      // YYYY-MM-DD format
  purPrice:   45.50,
  units:      100.0000,
  amount:     4550.00,
  schemeType: "Equity",
  taxStatus:  "Individual"
}
```

## Dashboard Sections

| Tab | What it shows |
|-----|---------------|
| Investor / Fund | All investors grouped under each mutual fund |
| Fund / Investor | All funds grouped under each investor |
| Investor List   | PAN number + total invested per investor |
| Fund Summary    | Total amount, units, avg NAV + bar charts |

## Tech Stack

- HTML5 + CSS3 + Vanilla JS
- [Chart.js 4.4.1](https://www.chartjs.org/) — bar charts
- [DM Sans + DM Mono](https://fonts.google.com/) — typography (Google Fonts)
