// Flag to auto-detect date bounds from database on first load
let isInitialLoad = true;

// Set today's date in the top header
const dateOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
};
document.getElementById("currentDateDisplay").textContent =
  new Date().toLocaleDateString("en-US", dateOptions);

// Reset date input fields and reload dashboard data
function resetFilter() {
  isInitialLoad = true;
  document.getElementById("fromDate").value = "";
  document.getElementById("toDate").value = "";
  loadAndRender();
}

// Initial dashboard load
loadAndRender();
