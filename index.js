const colorSlots = {
  background1: {
    labelId: "colorHex1",
    cssVar: "--background-1",
    fallback: "#f0eef6",
  },
  background2: {
    labelId: "colorHex2",
    cssVar: "--background-2",
    fallback: "#ffffff",
  },
  text: {
    labelId: "colorHex3",
    cssVar: "--text",
    fallback: "#192a3e",
  },
  textGray: {
    labelId: "colorHex4",
    cssVar: "--text-gray",
    fallback: "#707683",
  },
  primary: {
    labelId: "colorHex5",
    cssVar: "--primary",
    fallback: "#109cf1",
  },
  secondary: {
    labelId: "colorHex6",
    cssVar: "--secondary",
    fallback: "#2ed47a",
  },
  danger: {
    labelId: "colorHex7",
    cssVar: "--danger",
    fallback: "#e82127",
  },
};

const storageKey = "saas-color-picker-palettes-v2";

function normalizeHex(hex) {
  if (!hex) return "";
  const value = hex.startsWith("#") ? hex : `#${hex}`;
  return value.toUpperCase();
}

function isValidHex(hex) {
  if (!hex) return false;
  const value = hex.trim();
  return /^#?[0-9a-fA-F]{3}$/.test(value) || /^#?[0-9a-fA-F]{6}$/.test(value);
}

function setColorSlot(key, hex) {
  const slot = colorSlots[key];
  if (!slot) return;

  const normalized = normalizeHex(hex || slot.fallback);
  document.documentElement.style.setProperty(slot.cssVar, normalized);

  const label = document.getElementById(slot.labelId);
  if (label) {
    label.textContent = normalized;
  }

  paintSwatch(key, normalized);
}

function initColorPicker() {
  Object.entries(colorSlots).forEach(([key, slot]) => {
    const cssValue = getComputedStyle(document.documentElement)
      .getPropertyValue(slot.cssVar)
      .trim();

    setColorSlot(key, cssValue || slot.fallback);
  });

  wireCustomPicker();
  wirePersistence();
}

document.addEventListener("DOMContentLoaded", initColorPicker);

// ---------- Custom picker logic ----------

let activeSlot = "primary";
let hue = 200; // degrees
let sat = 0.6; // 0-1
let val = 0.95; // 0-1

function hexToHsv(hex) {
  const raw = hex.replace("#", "");
  const bigint = parseInt(raw, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function hsvToHex(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n) => Math.round((n + m) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function positionCursor(x, y) {
  const svCursor = document.getElementById("svCursor");
  if (svCursor) {
    svCursor.style.left = `${x}px`;
    svCursor.style.top = `${y}px`;
  }
}

function positionHueCursor(x) {
  const hueCursor = document.getElementById("hueCursor");
  if (hueCursor) {
    hueCursor.style.left = `${x}px`;
  }
}

function updatePickerUI() {
  const svArea = document.getElementById("svArea");
  const pickerValue = document.getElementById("pickerValue");
  const liveChip = document.getElementById("liveChip");
  const hexInput = document.getElementById("pickerHexInput");

  const currentHex = hsvToHex(hue, sat, val);
  const satGradient = `linear-gradient(90deg, #fff, hsl(${hue}, 100%, 50%))`;
  if (svArea) {
    svArea.style.background = `${satGradient}, linear-gradient(0deg, #000, transparent)`;
  }
  if (pickerValue) pickerValue.textContent = currentHex;
  if (liveChip) liveChip.style.background = currentHex;
  if (hexInput) hexInput.value = currentHex;

  const svRect = svArea?.getBoundingClientRect();
  if (svRect) {
    positionCursor(sat * svRect.width, (1 - val) * svRect.height);
  }

  const hueTrack = document.getElementById("hueTrack");
  const hueRect = hueTrack?.getBoundingClientRect();
  if (hueRect) {
    positionHueCursor((hue / 360) * hueRect.width);
  }
}

function setFromHex(hex) {
  const { h, s, v } = hexToHsv(hex);
  hue = h;
  sat = s;
  val = v;
  updatePickerUI();
}

function attachDrag(element, moveHandler) {
  let dragging = false;
  const stop = () => (dragging = false);
  const move = (event) => {
    if (!dragging) return;
    moveHandler(event);
  };
  element.addEventListener("pointerdown", (event) => {
    dragging = true;
    element.setPointerCapture(event.pointerId);
    moveHandler(event);
  });
  element.addEventListener("pointermove", move);
  element.addEventListener("pointerup", stop);
  element.addEventListener("pointercancel", stop);
}

function openPicker(slotKey) {
  activeSlot = slotKey;
  const picker = document.getElementById("customPicker");
  const label = document.getElementById("pickerLabel");
  const currentHex = normalizeHex(
    getComputedStyle(document.documentElement).getPropertyValue(colorSlots[slotKey].cssVar).trim() ||
      colorSlots[slotKey].fallback
  );

  setFromHex(currentHex);

  if (picker) {
    picker.classList.add("open");
    picker.setAttribute("aria-hidden", "false");
  }
  if (label) label.textContent = `Adjust ${slotKey}`;
}

function closePicker() {
  const picker = document.getElementById("customPicker");
  if (picker) {
    picker.classList.remove("open");
    picker.setAttribute("aria-hidden", "true");
  }
}

function wireCustomPicker() {
  const svArea = document.getElementById("svArea");
  const hueTrack = document.getElementById("hueTrack");
  const closeBtn = document.getElementById("pickerClose");
  const picker = document.getElementById("customPicker");
  const hexInput = document.getElementById("pickerHexInput");

  document.querySelectorAll(".swatch[data-slot]").forEach((button) => {
    button.addEventListener("click", () => openPicker(button.dataset.slot));
  });

  if (svArea) {
    attachDrag(svArea, (event) => {
      const rect = svArea.getBoundingClientRect();
      const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
      const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
      sat = x / rect.width;
      val = 1 - y / rect.height;
      const hex = hsvToHex(hue, sat, val);
      setColorSlot(activeSlot, hex);
      updatePickerUI();
      paintSwatch(activeSlot, hex);
    });
  }

  if (hueTrack) {
    attachDrag(hueTrack, (event) => {
      const rect = hueTrack.getBoundingClientRect();
      const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
      hue = (x / rect.width) * 360;
      const hex = hsvToHex(hue, sat, val);
      setColorSlot(activeSlot, hex);
      updatePickerUI();
      paintSwatch(activeSlot, hex);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closePicker);
  }

  if (hexInput) {
    const applyHex = () => {
      const value = hexInput.value.trim();
      if (!isValidHex(value)) return;
      const normalized = normalizeHex(value);
      setColorSlot(activeSlot, normalized);
      setFromHex(normalized);
    };

    hexInput.addEventListener("change", applyHex);
    hexInput.addEventListener("blur", applyHex);
    hexInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyHex();
      }
    });
  }

  // Close on outside click
  document.addEventListener("pointerdown", (event) => {
    if (!picker) return;
    if (!picker.classList.contains("open")) return;
    if (!picker.contains(event.target)) {
      closePicker();
    }
  });
}

function getCurrentPalette() {
  return Object.fromEntries(
    Object.entries(colorSlots).map(([key, slot]) => {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(slot.cssVar)
        .trim();
      return [key, normalizeHex(value || slot.fallback)];
    })
  );
}

function applyPalette(palette) {
  Object.entries(colorSlots).forEach(([key, slot]) => {
    const value = palette?.[key] || slot.fallback;
    setColorSlot(key, value);
  });
}

function getStoredPalettes() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function persistPalettes(list) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(list));
  } catch (error) {
    // ignore quota issues
  }
}

function renderSavedPalettes() {
  const container = document.getElementById("savedPalettes");
  if (!container) return;

  const palettes = getStoredPalettes();
  container.innerHTML = "";

  palettes.forEach((item) => {
    const card = document.createElement("div");
    card.className = "saved-card";

    const top = document.createElement("div");
    top.className = "top";
    const name = document.createElement("p");
    name.className = "name";
    name.textContent = item.name || "Unnamed palette";
    top.appendChild(name);

    const swatches = document.createElement("div");
    swatches.className = "swatches";
    Object.values(colorSlots).forEach((slot) => {
      const dot = document.createElement("div");
      dot.className = "dot";
      const value = item.colors?.[slot.cssVar] || slot.fallback;
      dot.style.background = normalizeHex(value);
      swatches.appendChild(dot);
    });

    const actions = document.createElement("div");
    actions.className = "actions";
    const loadBtn = document.createElement("button");
    loadBtn.textContent = "Load";
    loadBtn.dataset.id = item.id;
    loadBtn.dataset.action = "load";
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.dataset.id = item.id;
    deleteBtn.dataset.action = "delete";
    actions.appendChild(loadBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(top);
    card.appendChild(swatches);
    card.appendChild(actions);
    container.appendChild(card);
  });
}

function savePalette() {
  const nameInput = document.getElementById("paletteName");
  const name = (nameInput?.value || "").trim() || "Saved palette";
  const colors = {};

  Object.entries(colorSlots).forEach(([key, slot]) => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(slot.cssVar)
      .trim();
    colors[slot.cssVar] = normalizeHex(value || slot.fallback);
  });

  const palettes = getStoredPalettes();
  palettes.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name,
    colors,
  });
  persistPalettes(palettes);
  renderSavedPalettes();
  if (nameInput) nameInput.value = "";
}

function loadPalette(id) {
  const palettes = getStoredPalettes();
  const found = palettes.find((p) => p.id === id);
  if (found) {
    applyPalette(mapCssVarsToSlots(found.colors));
  }
}

function mapCssVarsToSlots(colorMap) {
  const result = {};
  Object.entries(colorSlots).forEach(([key, slot]) => {
    const value = colorMap?.[slot.cssVar];
    if (value) result[key] = value;
  });
  return result;
}

function deletePalette(id) {
  const palettes = getStoredPalettes().filter((p) => p.id !== id);
  persistPalettes(palettes);
  renderSavedPalettes();
}

function resetPalette() {
  applyPalette({});
}

function wirePersistence() {
  const resetButton = document.getElementById("resetPalette");
  const saveButton = document.getElementById("savePalette");
  const list = document.getElementById("savedPalettes");

  if (resetButton) resetButton.addEventListener("click", resetPalette);
  if (saveButton) saveButton.addEventListener("click", savePalette);

  if (list) {
    list.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.dataset.action;
      const id = target.dataset.id;
      if (!action || !id) return;
      if (action === "load") loadPalette(id);
      if (action === "delete") deletePalette(id);
    });
  }

  renderSavedPalettes();
}

function paintSwatch(slotKey, hex) {
  const swatch = document.querySelector(`.swatch[data-slot="${slotKey}"]`);
  if (swatch) {
    swatch.style.background = normalizeHex(hex);
  }
}
