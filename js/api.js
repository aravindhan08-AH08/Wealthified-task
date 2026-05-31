// Backend connection URL
const BASE_URL = "http://localhost:8000";

// Global data stores
let DATA = [];
let filtered = [];

// Demo data for offline/GitHub Pages fallback
const DEFAULT_MOCK_DATA = [
  {
    amc: "DSP",
    folio: "10074454/92",
    scheme: "DSP Nifty 50 Equal Weight Index Fund - Reg - Growth",
    inv: "Meethala Pullutummal Narayani",
    pan: "AAEPN3766A",
    tradeDate: "2025-05-27",
    purPrice: 24.86,
    units: 261.4965,
    amount: 6499.68,
    schemeType: "Index Fund",
    taxStatus: "Individual",
  },
  {
    amc: "Kotak",
    folio: "16635601/85",
    scheme: "Kotak Gold Fund - Growth (Regular Plan)",
    inv: "Shilpa J Suresh",
    pan: "FRSPS3248J",
    tradeDate: "2025-05-27",
    purPrice: 36.9,
    units: 40.431,
    amount: 1491.93,
    schemeType: "Gold FOF",
    taxStatus: "NRI - Non-Repatriable (NRO)",
  },
  {
    amc: "Kotak",
    folio: "16675812/23",
    scheme: "Kotak Gold Fund - Growth (Regular Plan)",
    inv: "Priyavarshini Damodaran",
    pan: "HECPD7014E",
    tradeDate: "2025-05-27",
    purPrice: 36.9,
    units: 54.2,
    amount: 1999.9,
    schemeType: "Gold FOF",
    taxStatus: "Individual",
  },
  {
    amc: "Kotak",
    folio: "15160625/67",
    scheme: "Kotak Gold Fund - Growth (Regular Plan)",
    inv: "Nivedhitha Rajagopal",
    pan: "AVNPN8269J",
    tradeDate: "2025-05-27",
    purPrice: 36.9,
    units: 27.1,
    amount: 999.95,
    schemeType: "Gold FOF",
    taxStatus: "Individual",
  },
];

// Offline flag if backend is unreachable
let isOfflineMode = false;

// Load transaction records from the backend API or fallback to localStorage
async function loadAndRender() {
  let fromDate = document.getElementById("fromDate").value;
  let toDate = document.getElementById("toDate").value;

  try {
    let url = `${BASE_URL}/api/transactions`;
    const params = [];

    // Apply date filters if not initial load
    if (typeof isInitialLoad !== "undefined" && !isInitialLoad) {
      if (fromDate) params.push(`from_date=${fromDate}`);
      if (toDate) params.push(`to_date=${toDate}`);
    }

    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Server returned error status: ${response.status}`);
    }

    const result = await response.json();
    DATA = result.data || [];
    isOfflineMode = false;

    // Detect dates from database for filtering on first load
    if (
      typeof isInitialLoad !== "undefined" &&
      isInitialLoad &&
      DATA.length > 0
    ) {
      filtered = [...DATA];
      setInitialDates(DATA);
    } else {
      filtered = [...DATA];
    }
  } catch (error) {
    isOfflineMode = true;
    console.warn("FastAPI backend is offline. Using local storage fallback...", error);

    let localData = localStorage.getItem("mutual_funds_transactions");
    let hasLocalData = false;

    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          DATA = parsed;
          hasLocalData = true;
        }
      } catch (e) {
        hasLocalData = false;
      }
    }

    // Seed default mock data if local storage is empty
    if (!hasLocalData) {
      localStorage.setItem(
        "mutual_funds_transactions",
        JSON.stringify(DEFAULT_MOCK_DATA),
      );
      DATA = [...DEFAULT_MOCK_DATA];
    }

    // Filter data locally when offline
    if (typeof isInitialLoad !== "undefined" && isInitialLoad) {
      filtered = [...DATA];
      setInitialDates(DATA);
    } else {
      filtered = DATA.filter((r) => {
        const d = r.tradeDate;
        return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
      });
    }

    if (typeof isInitialLoad !== "undefined" && isInitialLoad) {
      showNotification("Running in Local Demo Mode (Static/GitHub Pages).", "success");
    }
  } finally {
    // Redraw the dashboard UI
    if (typeof renderAll === "function") {
      renderAll();
    } else {
      console.warn("renderAll function is not loaded yet.");
    }
  }
}

// Detect and set input date ranges from the data
function setInitialDates(transactions) {
  const dates = transactions.map((r) => r.tradeDate).filter(Boolean);
  if (dates.length > 0) {
    const minDate = dates.reduce((a, b) => (a < b ? a : b));
    const maxDate = dates.reduce((a, b) => (a > b ? a : b));
    document.getElementById("fromDate").value = minDate;
    document.getElementById("toDate").value = maxDate;
  }
  isInitialLoad = false;
}

// CSV file upload handler
async function uploadCSV(inputElement) {
  const file = inputElement.files[0];
  if (!file) return;

  const uploadLabel = document.querySelector("label[for='csvFileInput']");
  const originalText = uploadLabel.innerHTML;
  uploadLabel.innerHTML = `
    <svg class="nav-icon animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="animation: spin 1s linear infinite;">
      <path d="M8 2v3M8 11v3M4 8H1M15 8h-3" />
    </svg>
    Uploading...
  `;
  uploadLabel.style.pointerEvents = "none";
  uploadLabel.style.opacity = "0.7";

  if (!document.getElementById("spin-style")) {
    const style = document.createElement("style");
    style.id = "spin-style";
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // Upload to FastAPI backend if online
  if (!isOfflineMode) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${BASE_URL}/api/upload-csv`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showNotification(result.message || "CSV successfully imported.", "success");
        await loadAndRender();
      } else {
        throw new Error(result.detail || "Import failed.");
      }
    } catch (error) {
      console.error("Backend CSV upload failed, trying offline parser:", error);
      await uploadCSVClientSide(file);
    } finally {
      inputElement.value = "";
      uploadLabel.innerHTML = originalText;
      uploadLabel.style.pointerEvents = "auto";
      uploadLabel.style.opacity = "1";
    }
  }
  // Parse in browser if offline
  else {
    try {
      await uploadCSVClientSide(file);
    } catch (error) {
      console.error("Offline CSV parsing failed:", error);
      showNotification("Failed to parse and import CSV file.", "error");
    } finally {
      inputElement.value = "";
      uploadLabel.innerHTML = originalText;
      uploadLabel.style.pointerEvents = "auto";
      uploadLabel.style.opacity = "1";
    }
  }
}

// Client-side CSV file reader
async function uploadCSVClientSide(file) {
  const reader = new FileReader();
  reader.onload = async function (e) {
    const text = e.target.result;
    const count = parseCSVText(text);
    if (count > 0) {
      showNotification(`Successfully imported ${count} transactions offline.`, "success");
      await loadAndRender();
    } else {
      showNotification("No transactions found or malformed CSV file.", "error");
    }
  };
  reader.readAsText(file);
}

// CSV parser logic for client-side fallback
function parseCSVText(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length <= 1) return 0;

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const fieldMappings = {
    amc: ["amc", "mutual fund company", "fund house", "asset management company"],
    folio: ["folio", "folio number", "folio no", "folio_number"],
    scheme: ["scheme", "scheme name", "mutual fund", "fund", "fund name", "scheme_name"],
    inv: ["inv", "investor", "investor name", "name", "holder name", "primary holder", "investor_name"],
    pan: ["pan", "pan number", "pan no", "pan_number"],
    tradeDate: ["tradedate", "trade date", "transaction date", "date", "date of purchase", "transaction_date"],
    purPrice: ["purprice", "pur price", "purchase price", "nav", "nav price", "price", "purchase_price"],
    units: ["units", "units purchased", "quantity", "unit quantity"],
    amount: ["amount", "amount invested", "total amount", "investment amount", "purchase amount", "total_amount"],
    schemeType: ["schemetype", "scheme type", "type", "category", "scheme_type"],
    taxStatus: ["taxstatus", "tax status", "investor status", "tax_status"],
  };

  const colMap = {};
  for (const [key, alternates] of Object.entries(fieldMappings)) {
    for (const alt of alternates) {
      const idx = headers.indexOf(alt);
      if (idx !== -1) {
        colMap[key] = idx;
        break;
      }
    }
  }

  if (colMap.scheme === undefined && headers.length >= 3) {
    colMap.amc = 0;
    colMap.folio = 1;
    colMap.scheme = 2;
    colMap.inv = 3;
    colMap.pan = 4;
    colMap.tradeDate = 5;
    colMap.purPrice = 6;
    colMap.units = 7;
    colMap.amount = 8;
    colMap.schemeType = 9;
    colMap.taxStatus = 10;
  }

  let count = 0;
  let localData = [];
  try {
    localData = JSON.parse(localStorage.getItem("mutual_funds_transactions") || "[]");
  } catch (e) {
    localData = [];
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const row = line
      .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      .map((v) => v.replace(/^"|"$/g, "").trim());

    try {
      const scheme = row[colMap.scheme];
      if (!scheme) continue;

      const amc = row[colMap.amc] || "Unknown";
      const folio = row[colMap.folio] || "Unknown";
      const inv = row[colMap.inv] || "Unknown";
      const pan = row[colMap.pan] || "Unknown";

      let tradeDate = row[colMap.tradeDate] || "2025-05-27";
      tradeDate = tradeDate.replace(/\//g, "-");
      const parts = tradeDate.split("-");
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          tradeDate = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
        } else if (parts[2].length === 4) {
          tradeDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      }

      let purPrice = parseFloat((row[colMap.purPrice] || "0").replace(/,/g, ""));
      let units = parseFloat((row[colMap.units] || "0").replace(/,/g, ""));
      let amount = parseFloat((row[colMap.amount] || "0").replace(/,/g, ""));

      if (amount === 0 && units > 0 && purPrice > 0) {
        amount = Math.round(units * purPrice * 100) / 100;
      } else if (units === 0 && amount > 0 && purPrice > 0) {
        units = Math.round((amount / purPrice) * 10000) / 10000;
      }

      const schemeType = row[colMap.schemeType] || "Equity";
      const taxStatus = row[colMap.taxStatus] || "Individual";

      localData.push({
        amc,
        folio,
        scheme,
        inv,
        pan,
        tradeDate,
        purPrice,
        units,
        amount,
        schemeType,
        taxStatus,
      });
      count++;
    } catch (e) {
      console.warn("Failed to parse CSV row: ", e);
      continue;
    }
  }

  if (count > 0) {
    localStorage.setItem("mutual_funds_transactions", JSON.stringify(localData));
  }
  return count;
}

// Reset database trigger
async function resetDatabase() {
  const confirmReset = confirm("Are you sure you want to clear the database and restore default demo records?");
  if (!confirmReset) return;

  if (!isOfflineMode) {
    try {
      const response = await fetch(`${BASE_URL}/api/reset-db`, { method: "POST" });
      const result = await response.json();
      if (response.ok && result.success) {
        showNotification(result.message || "Database reset successful.", "success");
        await loadAndRender();
        return;
      } else {
        throw new Error(result.detail || "Failed to reset database.");
      }
    } catch (error) {
      console.error("Failed to reset database on backend, resetting locally:", error);
    }
  }

  localStorage.setItem("mutual_funds_transactions", JSON.stringify(DEFAULT_MOCK_DATA));
  showNotification("Demo data restored locally.", "success");
  await loadAndRender();
}

// Show a floating notification message
function showNotification(message, type = "success") {
  const existing = document.getElementById("db-notification");
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.id = "db-notification";
  notification.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    background: ${type === "success" ? "rgba(46, 204, 143, 0.12)" : "rgba(224, 90, 106, 0.12)"};
    color: ${type === "success" ? "#2ecc8f" : "#e05a6a"};
    border: 1px solid ${type === "success" ? "rgba(46, 204, 143, 0.25)" : "rgba(224, 90, 106, 0.25)"};
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    padding: 14px 22px;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    z-index: 9999;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    display: flex;
    align-items: center;
    gap: 10px;
  `;

  const successIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="M13.5 4.5l-7 7-3.5-3.5"/></svg>`;
  const errorIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="M12 4L4 12M4 4l8 8"/></svg>`;

  notification.innerHTML = (type === "success" ? successIcon : errorIcon) + `<span>${message}</span>`;
  document.body.appendChild(notification);

  if (!document.getElementById("notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(130%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(130%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards";
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}
