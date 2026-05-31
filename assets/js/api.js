// ============================================================
// api.js — Backend API Connection & Database Actions
// ============================================================

const BASE_URL = "http://localhost:8000";

// Global data stores expected by metrics.js, charts.js, and tabs.js
let DATA = [];
let filtered = [];

/**
 * Main function to fetch date-filtered transaction records from backend
 * and trigger metrics, charts, and table rendering.
 */
async function loadAndRender() {
  let fromDate = document.getElementById("fromDate").value;
  let toDate = document.getElementById("toDate").value;

  try {
    let url = `${BASE_URL}/api/transactions`;
    const params = [];
    
    // On the initial load, we fetch all transactions to detect min/max date bounds
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
    filtered = [...DATA];

    // If initial load and data exists, auto-discover and set the input date bounds
    if (typeof isInitialLoad !== "undefined" && isInitialLoad && DATA.length > 0) {
      const dates = DATA.map(r => r.tradeDate).filter(Boolean);
      if (dates.length > 0) {
        const minDate = dates.reduce((a, b) => a < b ? a : b);
        const maxDate = dates.reduce((a, b) => a > b ? a : b);
        document.getElementById("fromDate").value = minDate;
        document.getElementById("toDate").value = maxDate;
      }
      isInitialLoad = false;
    }

    // Trigger complete dashboard re-render
    if (typeof renderAll === "function") {
      renderAll();
    } else {
      console.warn("renderAll function is not loaded yet.");
    }
  } catch (error) {
    console.error("Failed to load transactions from API:", error);
    showNotification("Failed to connect to backend server.", "error");
    
    // Clear display on backend connection failure
    DATA = [];
    filtered = [];
    if (typeof renderAll === "function") {
      renderAll();
    }
  }
}


/**
 * Handles uploading CSV data via the sidebar file input control.
 */
async function uploadCSV(inputElement) {
  const file = inputElement.files[0];
  if (!file) return;

  // Show a visual loading indicator
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

  // Ensure simple spin animation CSS is active
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

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${BASE_URL}/api/upload-csv`, {
      method: "POST",
      body: formData
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      showNotification(result.message || "CSV successfully imported.", "success");
      // Reload dashboard with newly uploaded data
      await loadAndRender();
    } else {
      throw new Error(result.detail || "Import failed on backend.");
    }
  } catch (error) {
    console.error("Error uploading CSV:", error);
    showNotification(error.message || "Failed to process CSV file.", "error");
  } finally {
    // Reset file input and restore button UI
    inputElement.value = "";
    uploadLabel.innerHTML = originalText;
    uploadLabel.style.pointerEvents = "auto";
    uploadLabel.style.opacity = "1";
  }
}

/**
 * Requests the backend to clear and re-seed the SQLite database with the standard demo transactions.
 */
async function resetDatabase() {
  const confirmReset = confirm("Are you sure you want to clear the database and restore default demo mutual fund records?");
  if (!confirmReset) return;

  try {
    const response = await fetch(`${BASE_URL}/api/reset-db`, {
      method: "POST"
    });
    
    const result = await response.json();
    if (response.ok && result.success) {
      showNotification(result.message || "Database reset successful.", "success");
      await loadAndRender();
    } else {
      throw new Error(result.detail || "Failed to reset database.");
    }
  } catch (error) {
    console.error("Error resetting database:", error);
    showNotification(error.message || "Failed to reset database.", "error");
  }
}

/**
 * Premium custom floating notification banner implementation.
 */
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
