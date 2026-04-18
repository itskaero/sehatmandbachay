/* ═══════════════════════════════════════════════════════════════
   hospital-auth.js
   Hospital/location management and PIN-based access control.
   - Attendants (no PIN): view-only
   - Staff with hospital PIN: can add assessments, edit diet charts,
     add weight/MUAC measurements
═══════════════════════════════════════════════════════════════ */

const HospitalAuth = (() => {

  const STORE_KEY      = "smb_hospital";
  const SESSION_KEY    = "smb_session";
  const SAVED_LIST_KEY = "smb_hospitals_list";

  let hospital = null;   // { id, name, location, pinHash }
  let authed   = false;  // true = staff has entered correct PIN this session

  /* ── Simple hash (for client-side PIN; not cryptographic) ──── */
  function hashPin(pin) {
    let h = 5381;
    for (let i = 0; i < pin.length; i++) {
      h = ((h << 5) + h) + pin.charCodeAt(i);
      h = h & 0xFFFFFFFF;
    }
    return (h >>> 0).toString(16);
  }

  /* ── Init ─────────────────────────────────────────────────── */
  function init() {
    try {
      const stored = localStorage.getItem(STORE_KEY);
      hospital = stored ? JSON.parse(stored) : null;
    } catch { hospital = null; }

    // Restore session auth
    try {
      const sess = sessionStorage.getItem(SESSION_KEY);
      if (sess && hospital) {
        const { hospitalId, hash } = JSON.parse(sess);
        if (hospitalId === hospital.id && hash === hospital.pinHash) {
          authed = true;
        }
      }
    } catch { authed = false; }

    updateUI();
    return hospital;
  }

  /* ── Hospital Setup ───────────────────────────────────────── */
  function setupHospital(name, location, pin) {
    if (!name.trim()) throw new Error("Hospital name required");
    if (!pin || pin.length < 4) throw new Error("PIN must be at least 4 digits");

    const id = "hosp_" + Date.now();
    hospital = { id, name: name.trim(), location: location.trim(), pinHash: hashPin(pin) };
    localStorage.setItem(STORE_KEY, JSON.stringify(hospital));
    _addToSavedList(hospital);

    // Auto-auth after setup
    authed = true;
    _saveSession();
    updateUI();
    return hospital;
  }

  /* ── Saved Hospitals List ─────────────────────────────────── */
  function getSavedHospitals() {
    try { return JSON.parse(localStorage.getItem(SAVED_LIST_KEY)) || []; }
    catch { return []; }
  }

  function _addToSavedList(hosp) {
    const list = getSavedHospitals();
    const idx  = list.findIndex(h => h.id === hosp.id);
    if (idx >= 0) list[idx] = hosp; else list.push(hosp);
    localStorage.setItem(SAVED_LIST_KEY, JSON.stringify(list));
  }

  function selectSavedHospital(id) {
    const found = getSavedHospitals().find(h => h.id === id);
    if (!found) { AppController.showToast("Hospital not found", "error"); return; }
    hospital = found;
    authed   = false;
    localStorage.setItem(STORE_KEY, JSON.stringify(hospital));
    sessionStorage.removeItem(SESSION_KEY);
    closeSetupModal();
    updateUI();
    AppController.showToast(`Switched to "${hospital.name}"`, "info");
    setTimeout(() => openPinModal(), 350);
  }

  function deleteSavedHospital(id) {
    if (!confirm("Remove this hospital from the saved list?")) return;
    const list = getSavedHospitals().filter(h => h.id !== id);
    localStorage.setItem(SAVED_LIST_KEY, JSON.stringify(list));
    if (hospital && hospital.id === id) {
      hospital = null; authed = false;
      localStorage.removeItem(STORE_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      updateUI();
    }
    renderSavedList();
  }

  /* ── Geolocation Detection ────────────────────────────────── */
  const NEARBY_RADIUS_M = 3000; // 3 km search radius

  function detectLocation() {
    const btn    = document.getElementById("hosp-detect-btn");
    const status = document.getElementById("hosp-detect-status");
    if (!navigator.geolocation) {
      _setDetectStatus("Geolocation is not supported by this browser.", "error");
      return;
    }
    _resetNearbyList();
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting…'; }
    _setDetectStatus("Requesting location…", "detecting");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Detect My Location'; }
        _setDetectStatus("Location acquired — searching for nearby hospitals…", "detecting");
        _findNearbyHospitals(lat, lon);
      },
      (err) => {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Detect My Location'; }
        const msgs = {
          1: "Location access denied — allow it in browser settings.",
          2: "Location unavailable.",
          3: "Request timed out."
        };
        _setDetectStatus(msgs[err.code] || "Location detection failed.", "error");
      },
      { timeout: 12000, maximumAge: 120000 }
    );
  }

  function _findNearbyHospitals(lat, lon) {
    // Overpass API: find hospitals, clinics, health posts within radius
    const amenityFilter = "hospital|clinic|health_post|doctors";
    const query = `
[out:json][timeout:15];
(
  node["amenity"~"^(${amenityFilter})$"](around:${NEARBY_RADIUS_M},${lat},${lon});
  way["amenity"~"^(${amenityFilter})$"](around:${NEARBY_RADIUS_M},${lat},${lon});
  node["healthcare"](around:${NEARBY_RADIUS_M},${lat},${lon});
  way["healthcare"](around:${NEARBY_RADIUS_M},${lat},${lon});
);
out center 20;`.trim();

    const overpassUrl = "https://overpass-api.de/api/interpreter";

    // Parallel: Overpass for hospitals + Nominatim for city name
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`;

    Promise.allSettled([
      fetch(overpassUrl, {
        method: "POST",
        body: query,
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }).then(r => r.json()),
      fetch(nominatimUrl).then(r => r.json())
    ]).then(([overpassRes, nominatimRes]) => {
      // --- Location string from Nominatim ---
      let locStr = "";
      if (nominatimRes.status === "fulfilled") {
        const addr  = nominatimRes.value.address || {};
        const city  = addr.city || addr.town || addr.village || addr.county || "";
        const state = addr.state || "";
        locStr = [city, state].filter(Boolean).join(", ");
      }

      // --- Nearby hospitals from Overpass ---
      if (overpassRes.status !== "fulfilled") {
        _setDetectStatus("Could not reach OpenStreetMap — enter hospital name manually.", "warning");
        _renderNearbyHospitals([], locStr);
        return;
      }

      const elements = overpassRes.value.elements || [];
      // Deduplicate by name, filter out nameless results
      const seen  = new Set();
      const found = [];
      for (const el of elements) {
        const tags   = el.tags || {};
        const name   = tags.name || tags["name:en"] || tags["name:ur"] || "";
        if (!name || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        const amenity   = tags.amenity || tags.healthcare || "";
        const addr      = [
          tags["addr:street"],
          tags["addr:city"] || locStr
        ].filter(Boolean).join(", ");
        found.push({ name, amenity, addr: addr || locStr });
      }

      _renderNearbyHospitals(found, locStr);
    });
  }

  function _renderNearbyHospitals(hospitals, locStr) {
    const container = document.getElementById("hosp-nearby-list");
    const locInput  = document.getElementById("hosp-detect-location");
    if (locInput && locStr) locInput.value = locStr;

    if (!container) return;

    if (!hospitals.length) {
      container.innerHTML = `
        <div class="alert alert-warning" style="margin-bottom:1rem;">
          <i class="fas fa-exclamation-triangle"></i>
          <div>No hospital found within ${NEARBY_RADIUS_M / 1000} km. Enter the name manually below.</div>
        </div>`;
      _setDetectStatus(locStr ? `Location: ${locStr}` : "No nearby hospital found.", locStr ? "success" : "warning");
      return;
    }

    _setDetectStatus(`${hospitals.length} hospital${hospitals.length > 1 ? "s" : ""} found nearby — select one below.`, "success");
    container.innerHTML = hospitals.map((h, i) => `
      <div class="nearby-hosp-card" id="nearby-card-${i}" onclick="HospitalAuth.selectNearbyResult(${i})">
        <div class="nearby-hosp-icon"><i class="fas fa-hospital-alt"></i></div>
        <div class="nearby-hosp-info">
          <div class="nearby-hosp-name">${_esc(h.name)}</div>
          <div class="nearby-hosp-meta">
            <span class="nearby-hosp-type">${_esc(_formatAmenity(h.amenity))}</span>
            ${h.addr ? `<span class="nearby-hosp-addr"><i class="fas fa-map-pin"></i> ${_esc(h.addr)}</span>` : ""}
          </div>
        </div>
        <i class="fas fa-check nearby-check" style="display:none;color:var(--primary);"></i>
      </div>`).join("");

    // Store for selection
    container.dataset.results = JSON.stringify(hospitals);
  }

  function selectNearbyResult(idx) {
    const container  = document.getElementById("hosp-nearby-list");
    if (!container) return;
    const hospitals  = JSON.parse(container.dataset.results || "[]");
    const h = hospitals[idx];
    if (!h) return;

    // Fill fields
    const nameInput = document.getElementById("hosp-detect-name");
    const locInput  = document.getElementById("hosp-detect-location");
    if (nameInput) nameInput.value = h.name;
    if (locInput && h.addr) locInput.value = h.addr;

    // Highlight selected card
    container.querySelectorAll(".nearby-hosp-card").forEach((card, i) => {
      card.classList.toggle("selected", i === idx);
      const chk = card.querySelector(".nearby-check");
      if (chk) chk.style.display = (i === idx) ? "" : "none";
    });
  }

  function _formatAmenity(str) {
    const map = {
      hospital: "Hospital", clinic: "Clinic", health_post: "Health Post",
      doctors: "Doctor's Office", pharmacy: "Pharmacy",
      dentist: "Dentist", hospital_ward: "Hospital Ward"
    };
    return map[str] || (str ? str.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Healthcare Facility");
  }

  function _resetNearbyList() {
    const container = document.getElementById("hosp-nearby-list");
    if (container) { container.innerHTML = ""; container.dataset.results = "[]"; }
    const nameInput = document.getElementById("hosp-detect-name");
    const locInput  = document.getElementById("hosp-detect-location");
    if (nameInput) nameInput.value = "";
    if (locInput)  locInput.value  = "";
  }

  function _setDetectStatus(msg, type) {
    const status = document.getElementById("hosp-detect-status");
    if (!status) return;
    status.textContent = msg;
    status.className   = "detect-status " + (type || "");
  }

  function changePin(oldPin, newPin) {
    if (!hospital) throw new Error("No hospital configured");
    if (hashPin(oldPin) !== hospital.pinHash) throw new Error("Current PIN incorrect");
    if (!newPin || newPin.length < 4) throw new Error("New PIN must be at least 4 digits");
    hospital.pinHash = hashPin(newPin);
    localStorage.setItem(STORE_KEY, JSON.stringify(hospital));
    AppController.showToast("PIN changed successfully", "success");
  }

  /* ── Authentication ───────────────────────────────────────── */
  function verifyPin(pin) {
    if (!hospital) return false;
    const ok = hashPin(pin) === hospital.pinHash;
    if (ok) {
      authed = true;
      _saveSession();
      updateUI();
    }
    return ok;
  }

  function logout() {
    authed = false;
    sessionStorage.removeItem(SESSION_KEY);
    updateUI();
    AppController.showToast("Signed out — view-only mode", "info");
  }

  function _saveSession() {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        hospitalId: hospital.id,
        hash: hospital.pinHash
      }));
    } catch {}
  }

  /* ── Access checks ────────────────────────────────────────── */
  function canEdit()    { return authed; }
  function isSetup()    { return !!hospital; }
  function getHospital(){ return hospital; }

  /**
   * Returns hospital context fields to embed in records.
   */
  function getRecordContext() {
    if (!hospital) return {};
    return { hospitalId: hospital.id, hospitalName: hospital.name, location: hospital.location };
  }

  /* ── UI helpers ───────────────────────────────────────────── */
  function updateUI() {
    const badge = document.getElementById("auth-badge");
    const hosp  = document.getElementById("hosp-name-display");
    const pinBtn = document.getElementById("pin-btn");
    if (badge) {
      badge.textContent = authed ? "Staff" : "View Only";
      badge.className   = "auth-badge " + (authed ? "authed" : "view-only");
    }
    if (hosp) {
      hosp.textContent = hospital ? hospital.name : "No Hospital Set";
    }
    if (pinBtn) {
      pinBtn.innerHTML = authed
        ? `<i class="fas fa-lock-open"></i><span>Sign Out</span>`
        : `<i class="fas fa-key"></i><span>Enter PIN</span>`;
    }

    // Show/hide edit controls throughout the app
    document.querySelectorAll(".staff-only").forEach(el => {
      el.style.display = authed ? "" : "none";
    });
    document.querySelectorAll(".view-only-msg").forEach(el => {
      el.style.display = authed ? "none" : "";
    });
  }

  /* ── Modal controllers ────────────────────────────────────── */
  function openSetupModal() {
    document.getElementById("modal-hospital-setup").style.display = "flex";
    const hasSaved = getSavedHospitals().length > 0;
    openSetupTab(hasSaved ? "saved" : "manual");
  }
  function closeSetupModal() {
    document.getElementById("modal-hospital-setup").style.display = "none";
  }
  function openPinModal() {
    if (authed) { logout(); return; }
    if (!hospital) { openSetupModal(); return; }
    document.getElementById("modal-pin").style.display = "flex";
    document.getElementById("pin-input").value = "";
    setTimeout(() => document.getElementById("pin-input")?.focus(), 100);
  }
  function closePinModal() {
    document.getElementById("modal-pin").style.display = "none";
  }

  function submitSetup() {
    const isDetect = document.getElementById("hosp-tab-detect")?.classList.contains("active");
    const nameId  = isDetect ? "hosp-detect-name"        : "hosp-setup-name";
    const locId   = isDetect ? "hosp-detect-location"    : "hosp-setup-location";
    const pinId   = isDetect ? "hosp-detect-pin"         : "hosp-setup-pin";
    const confId  = isDetect ? "hosp-detect-pin-confirm" : "hosp-setup-pin-confirm";

    const name     = document.getElementById(nameId)?.value || "";
    const location = document.getElementById(locId)?.value  || "";
    const pin      = document.getElementById(pinId)?.value  || "";
    const confirm  = document.getElementById(confId)?.value || "";
    if (pin !== confirm) { AppController.showToast("PINs do not match", "error"); return; }
    try {
      setupHospital(name, location, pin);
      closeSetupModal();
      AppController.showToast(`Hospital "${name}" configured. Staff access granted.`, "success");
    } catch (e) {
      AppController.showToast(e.message, "error");
    }
  }

  /* ── Setup modal tab controller ───────────────────────────── */
  function openSetupTab(tab) {
    document.querySelectorAll("#modal-hospital-setup .tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll("#modal-hospital-setup .tab-panel").forEach(p => p.classList.remove("active"));
    const btn   = document.getElementById("hosp-tab-btn-" + tab);
    const panel = document.getElementById("hosp-tab-" + tab);
    if (btn)   btn.classList.add("active");
    if (panel) panel.classList.add("active");
    const saveBtn = document.getElementById("hosp-setup-save-btn");
    if (saveBtn) saveBtn.style.display = (tab === "saved") ? "none" : "";
    if (tab === "saved") renderSavedList();
  }

  function renderSavedList() {
    const list      = getSavedHospitals();
    const container = document.getElementById("hosp-saved-list");
    const empty     = document.getElementById("hosp-saved-empty");
    if (!container) return;
    if (!list.length) {
      container.innerHTML = "";
      if (empty) empty.style.display = "";
      return;
    }
    if (empty) empty.style.display = "none";
    container.innerHTML = list.map(h => `
      <div class="saved-hosp-item${hospital && hospital.id === h.id ? " current" : ""}">
        <div class="saved-hosp-info">
          <div class="saved-hosp-name">${_esc(h.name)}</div>
          <div class="saved-hosp-loc"><i class="fas fa-map-pin"></i> ${_esc(h.location || "No location set")}</div>
        </div>
        <div class="saved-hosp-actions">
          <button class="btn btn-sm btn-primary" onclick="HospitalAuth.selectSavedHospital('${h.id}')">
            <i class="fas fa-check"></i> Select
          </button>
          <button class="btn btn-sm btn-outline" style="color:var(--danger,#e53935);" onclick="HospitalAuth.deleteSavedHospital('${h.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`).join("");
  }

  function _esc(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function submitPin() {
    const pin = document.getElementById("pin-input")?.value || "";
    if (verifyPin(pin)) {
      closePinModal();
      AppController.showToast("Staff access granted", "success");
    } else {
      AppController.showToast("Incorrect PIN", "error");
      document.getElementById("pin-input").value = "";
      document.getElementById("pin-input")?.select();
    }
  }

  return {
    init, setupHospital, changePin, verifyPin, logout,
    canEdit, isSetup, getHospital, getRecordContext,
    getSavedHospitals, selectSavedHospital, deleteSavedHospital,
    detectLocation, selectNearbyResult, openSetupTab, renderSavedList,
    updateUI,
    openSetupModal, closeSetupModal, openPinModal, closePinModal,
    submitSetup, submitPin
  };

})();
