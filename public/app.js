const API = "/api";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const currentUser = JSON.parse(sessionStorage.getItem("gardenUser") || "null");
if (!currentUser) {
    window.location.href = "login.html";
}

document.getElementById("currentUserName").textContent = currentUser.name;
document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("gardenUser");
    window.location.href = "login.html";
});

let speciesCache = [];
let plantsCache = [];
let dueMap = {};
let currentLogPlantId = null;
let currentHistoryPlantId = null;
let historyEntriesCache = [];

// ---------- helpers ----------
function toast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.textContent = message;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
        el.classList.remove("show");
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

async function api(path, options = {}) {
    const res = await fetch(`${API}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options
    });
    let data = null;
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) throw new Error((data && data.error) || "Something went wrong.");
    return data;
}

function formatDate(d) {
    return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function computeWaterInfo(row) {
    if (!row || !row.last_watered_date) {
        return { text: "Water plant: never watered \u2014 log a watering to start tracking", className: "status-gray" };
    }
    const lastDate = new Date(row.last_watered_date + "T00:00:00");
    const nextDue = new Date(lastDate);
    nextDue.setDate(nextDue.getDate() + row.watering_interval_days);
    const formatted = formatDate(nextDue);
    const days = row.water_days_overdue;
    if (days > 0) return { text: `Water plant: ${days}d overdue \u2014 was due ${formatted}`, className: "status-red" };
    if (days === 0) return { text: `Water plant: due today (${formatted})`, className: "status-red" };
    if (days >= -3) return { text: `Water plant: water again ${formatted}`, className: "status-amber" };
    return { text: `Water plant: water again ${formatted}`, className: "status-green" };
}

function computeFertilizeInfo(row) {
    if (!row || !row.fertilizing_interval_days) return null;
    if (!row.last_fertilized_date) {
        return { text: "Fertilize plant: never fertilized \u2014 log one to start tracking", className: "status-gray" };
    }
    const lastDate = new Date(row.last_fertilized_date + "T00:00:00");
    const nextDue = new Date(lastDate);
    nextDue.setDate(nextDue.getDate() + row.fertilizing_interval_days);
    const formatted = formatDate(nextDue);
    const days = row.fertilize_days_overdue;
    if (days > 0) return { text: `Fertilize plant: ${days}d overdue \u2014 was due ${formatted}`, className: "status-red" };
    if (days === 0) return { text: `Fertilize plant: due today (${formatted})`, className: "status-red" };
    if (days >= -3) return { text: `Fertilize plant: fertilize again ${formatted}`, className: "status-amber" };
    return { text: `Fertilize plant: fertilize again ${formatted}`, className: "status-green" };
}

const SEVERITY = { "status-red": 3, "status-amber": 2, "status-green": 1, "status-gray": 0 };
function worstClass(...classNames) {
    return classNames.filter(Boolean).sort((a, b) => SEVERITY[b] - SEVERITY[a])[0];
}

// ---------- nav ----------
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.page).classList.add("active");
    });
});

// ---------- modals ----------
document.querySelectorAll(".modal-close").forEach(btn => {
    btn.addEventListener("click", () => btn.closest(".modal").classList.add("hidden"));
});

// ---------- SPECIES ----------
async function loadSpecies() {
    speciesCache = await api("/species");
    const tbody = document.querySelector("#speciesTable tbody");
    const select = document.getElementById("plantSpecies");
    tbody.innerHTML = "";
    select.innerHTML = "";

    document.getElementById("speciesEmptyState").classList.toggle("hidden", speciesCache.length > 0);
    document.getElementById("speciesTable").classList.toggle("hidden", speciesCache.length === 0);

    speciesCache.forEach(s => {
        tbody.innerHTML += `<tr>
            <td>${s.name}</td>
            <td>${s.watering_interval_days}d</td>
            <td>${s.sunlight_needs || "-"}</td>
            <td>${s.fertilizing_interval_days ? s.fertilizing_interval_days + "d" : "No fertilizer required"}</td>
            <td>${s.ideal_temp_min ?? "-"}\u2013${s.ideal_temp_max ?? "-"}\u00b0C</td>
            <td>${s.difficulty_level || "-"}</td>
            <td>
                <button class="btn-small" onclick="editSpecies(${s.id})">Edit</button>
                <button class="btn-danger" onclick="deleteSpecies(${s.id})">Delete</button>
            </td>
        </tr>`;
        select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}

function resetSpeciesForm() {
    document.getElementById("speciesForm").reset();
    document.getElementById("speciesEditId").value = "";
    document.getElementById("speciesSubmitBtn").textContent = "Add Species";
    document.getElementById("speciesCancelBtn").classList.add("hidden");
}

function editSpecies(id) {
    const s = speciesCache.find(x => x.id === id);
    if (!s) return;
    document.getElementById("speciesEditId").value = s.id;
    document.getElementById("spName").value = s.name;
    document.getElementById("spWatering").value = s.watering_interval_days;
    document.getElementById("spSunlight").value = s.sunlight_needs || "";
    document.getElementById("spFertilizing").value = s.fertilizing_interval_days || "";
    document.getElementById("spTempMin").value = s.ideal_temp_min ?? "";
    document.getElementById("spTempMax").value = s.ideal_temp_max ?? "";
    document.getElementById("spDifficulty").value = s.difficulty_level || "";
    document.getElementById("speciesSubmitBtn").textContent = "Update Species";
    document.getElementById("speciesCancelBtn").classList.remove("hidden");
    document.querySelector('[data-page="species"]').click();
    document.getElementById("speciesForm").scrollIntoView({ behavior: "smooth" });
}

document.getElementById("speciesCancelBtn").addEventListener("click", resetSpeciesForm);

document.getElementById("speciesForm").addEventListener("submit", async e => {
    e.preventDefault();
    const editId = document.getElementById("speciesEditId").value;
    const payload = {
        name: document.getElementById("spName").value,
        watering_interval_days: Number(document.getElementById("spWatering").value),
        sunlight_needs: document.getElementById("spSunlight").value,
        fertilizing_interval_days: Number(document.getElementById("spFertilizing").value) || null,
        ideal_temp_min: Number(document.getElementById("spTempMin").value) || null,
        ideal_temp_max: Number(document.getElementById("spTempMax").value) || null,
        difficulty_level: document.getElementById("spDifficulty").value
    };
    try {
        if (editId) {
            await api(`/species/${editId}`, { method: "PUT", body: JSON.stringify(payload) });
            toast("Species updated.");
        } else {
            await api("/species", { method: "POST", body: JSON.stringify(payload) });
            toast("Species added.");
        }
        resetSpeciesForm();
        await loadSpecies();
        await loadPlants();
    } catch (err) {
        toast(err.message, "error");
    }
});

async function deleteSpecies(id) {
    if (!confirm("Delete this species?")) return;
    try {
        await api(`/species/${id}`, { method: "DELETE" });
        toast("Species deleted.");
        await loadSpecies();
    } catch (err) {
        toast(err.message, "error");
    }
}

// ---------- PLANTS ----------
async function refreshDueMap() {
    dueMap = {};
    try {
        const due = await api(`/due_status/${currentUser.id}`);
        due.forEach(r => { dueMap[r.plant_id] = r; });
    } catch (_) {}
}

async function loadPlants() {
    plantsCache = await api(`/plants/user/${currentUser.id}`);
    await refreshDueMap();

    const grid = document.getElementById("plantsGrid");
    const emptyEl = document.getElementById("plantsEmptyState");
    grid.innerHTML = "";

    if (plantsCache.length === 0) {
        emptyEl.classList.remove("hidden");
        emptyEl.textContent = speciesCache.length === 0
            ? "Add a species first (see the Species page), then add your plants here."
            : "No plants yet. Click + Add Plant to get started.";
        return;
    }
    emptyEl.classList.add("hidden");

        plantsCache.forEach(p => {
        const row = dueMap[p.id];
        const water = computeWaterInfo(row);
        const fertilize = computeFertilizeInfo(row);
        const dotClass = worstClass(water.className, fertilize ? fertilize.className : null);

        const card = document.createElement("div");
        card.className = "plant-card";
        card.innerHTML = `
            <div class="plant-card-header">
                <h3>${p.nickname || p.species_name}</h3>
                <span class="status-dot ${dotClass}"></span>
            </div>
            <p class="plant-meta">${p.species_name} \u00b7 ${p.location || "No location set"}</p>
            <p class="due-message ${water.className}">${water.text}</p>
            ${fertilize ? `<p class="due-message ${fertilize.className}">${fertilize.text}</p>` : ""}
            <p class="plant-meta">Acquired ${p.date_acquired}</p>
            <div class="plant-card-actions">
                <button class="btn-small" onclick="openLogModal(${p.id})">Log Activity</button>
                <button class="btn-small" onclick="openHistoryModal(${p.id})">History</button>
                <button class="btn-small" onclick="openPlantModal(${p.id})">Edit</button>
                <button class="btn-danger" onclick="deletePlant(${p.id})">Delete</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

document.getElementById("addPlantBtn").addEventListener("click", () => {
    if (speciesCache.length === 0) {
        toast("Add a species first.", "error");
        return;
    }
    openPlantModal();
});

function openPlantModal(id) {
    const form = document.getElementById("plantForm");
    form.reset();
    document.getElementById("plantEditId").value = "";
    document.getElementById("plantModalTitle").textContent = "Add Plant";

    if (id) {
        const p = plantsCache.find(x => x.id === id);
        if (!p) return;
        document.getElementById("plantEditId").value = p.id;
        document.getElementById("plantSpecies").value = p.species_id;
        document.getElementById("plantNickname").value = p.nickname || "";
        document.getElementById("plantDateAcquired").value = p.date_acquired;
        document.getElementById("plantLocation").value = p.location || "";
        document.getElementById("plantModalTitle").textContent = "Edit Plant";
    }
    document.getElementById("plantModal").classList.remove("hidden");
}

document.getElementById("plantForm").addEventListener("submit", async e => {
    e.preventDefault();
    const editId = document.getElementById("plantEditId").value;
    const payload = {
        user_id: currentUser.id,
        species_id: Number(document.getElementById("plantSpecies").value),
        nickname: document.getElementById("plantNickname").value,
        date_acquired: document.getElementById("plantDateAcquired").value,
        location: document.getElementById("plantLocation").value
    };
    try {
        if (editId) {
            await api(`/plants/${editId}`, { method: "PUT", body: JSON.stringify(payload) });
            toast("Plant updated.");
        } else {
            await api("/plants", { method: "POST", body: JSON.stringify(payload) });
            toast("Plant added.");
        }
        document.getElementById("plantModal").classList.add("hidden");
        await loadPlants();
    } catch (err) {
        toast(err.message, "error");
    }
});

async function deletePlant(id) {
    if (!confirm("Delete this plant and all its care/health history?")) return;
    try {
        await api(`/plants/${id}`, { method: "DELETE" });
        toast("Plant deleted.");
        await loadPlants();
    } catch (err) {
        toast(err.message, "error");
    }
}

// ---------- LOG ACTIVITY ----------
function openLogModal(plantId) {
    const plant = plantsCache.find(p => p.id === plantId);
    currentLogPlantId = plantId;
    document.getElementById("logForm").reset();
    document.getElementById("logModalSubtitle").textContent = plant
        ? `For ${plant.nickname || plant.species_name} (${plant.species_name})`
        : "";
    updateLogTypeOptions(plantId);
    updateLogFormFields();
    document.getElementById("logModal").classList.remove("hidden");
}

function updateLogTypeOptions(plantId) {
    const plant = plantsCache.find(p => p.id === plantId);
    const species = plant ? speciesCache.find(s => s.id === plant.species_id) : null;
    const needsFertilizer = !!(species && species.fertilizing_interval_days);
    const fertilizeOption = document.querySelector('#logType option[value="fertilized"]');
    fertilizeOption.disabled = !needsFertilizer;
    fertilizeOption.hidden = !needsFertilizer;
    if (!needsFertilizer && document.getElementById("logType").value === "fertilized") {
        document.getElementById("logType").value = "watered";
    }
}

function updateLogFormFields() {
    const isHealth = document.getElementById("logType").value === "health";
    document.getElementById("logNotesGroup").classList.toggle("hidden", isHealth);
    document.getElementById("logStatusGroup").classList.toggle("hidden", !isHealth);
}

document.getElementById("logType").addEventListener("change", updateLogFormFields);

document.getElementById("logForm").addEventListener("submit", async e => {
    e.preventDefault();
    const type = document.getElementById("logType").value;
    const date = document.getElementById("logDate").value;
    try {
        if (type === "health") {
            await api("/health_logs", {
                method: "POST",
                body: JSON.stringify({
                    plant_id: currentLogPlantId,
                    status: document.getElementById("logStatus").value,
                    date_logged: date
                })
            });
        } else {
            await api("/care_logs", {
                method: "POST",
                body: JSON.stringify({
                    plant_id: currentLogPlantId,
                    action_type: type,
                    date_performed: date,
                    notes: document.getElementById("logNotes").value
                })
            });
        }
        toast("Logged.");
        document.getElementById("logModal").classList.add("hidden");
        await loadPlants();
    } catch (err) {
        toast(err.message, "error");
    }
});

// ---------- HISTORY ----------
async function loadHistoryEntries(plantId) {
    const [care, health] = await Promise.all([
        api(`/care_logs/plant/${plantId}`),
        api(`/health_logs/plant/${plantId}`)
    ]);
    const entries = [
        ...care.map(c => ({ date: c.date_performed, label: capitalize(c.action_type), detail: c.notes || "" })),
        ...health.map(h => ({ date: h.date_logged, label: `Health: ${capitalize(h.status)}`, detail: "" }))
    ];
    entries.sort((a, b) => b.date.localeCompare(a.date));
    return entries;
}

async function openHistoryModal(plantId) {
    const plant = plantsCache.find(p => p.id === plantId);
    currentHistoryPlantId = plantId;
    document.getElementById("historyModalSubtitle").textContent = plant
        ? `${plant.nickname || plant.species_name} (${plant.species_name})`
        : "";
    try {
        historyEntriesCache = await loadHistoryEntries(plantId);
        renderHistory(false);
        document.getElementById("historyModal").classList.remove("hidden");
    } catch (err) {
        toast(err.message, "error");
    }
}

function renderHistory(showAll) {
    const list = document.getElementById("historyList");
    const entries = showAll ? historyEntriesCache : historyEntriesCache.slice(0, 5);
    list.innerHTML = entries.length === 0
        ? `<p class="empty-state">No history yet.</p>`
        : entries.map(e => `
            <div class="history-entry">
                <span class="history-date">${e.date}</span>
                <span class="history-label">${e.label}</span>
                ${e.detail ? `<span class="history-detail">${e.detail}</span>` : ""}
            </div>
        `).join("");

    document.getElementById("historyShowAllBtn").classList.toggle(
        "hidden", historyEntriesCache.length <= 5 || showAll
    );
}

document.getElementById("historyShowAllBtn").addEventListener("click", () => renderHistory(true));

// ---------- INIT ----------
(async function init() {
    try {
        await loadSpecies();
        await loadPlants();
    } catch (err) {
        toast(err.message, "error");
    }
})();