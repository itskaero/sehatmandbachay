/* ═══════════════════════════════════════════════════════════════
   hospital-auth.js
   Hospital/location management and PIN-based access control.
   - Attendants (no PIN): view-only
   - Staff with hospital PIN: can add assessments, edit diet charts,
     add weight/MUAC measurements
═══════════════════════════════════════════════════════════════ */

const HospitalAuth = (() => {

  const STORE_KEY  = "smb_hospital";
  const SESSION_KEY = "smb_session";

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

    // Auto-auth after setup
    authed = true;
    _saveSession();
    updateUI();
    return hospital;
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
    const name     = document.getElementById("hosp-setup-name")?.value || "";
    const location = document.getElementById("hosp-setup-location")?.value || "";
    const pin      = document.getElementById("hosp-setup-pin")?.value || "";
    const confirm  = document.getElementById("hosp-setup-pin-confirm")?.value || "";
    if (pin !== confirm) { AppController.showToast("PINs do not match", "error"); return; }
    try {
      setupHospital(name, location, pin);
      closeSetupModal();
      AppController.showToast(`Hospital "${name}" configured. Staff access granted.`, "success");
    } catch (e) {
      AppController.showToast(e.message, "error");
    }
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
    updateUI,
    openSetupModal, closeSetupModal, openPinModal, closePinModal,
    submitSetup, submitPin
  };

})();
