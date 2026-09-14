const API = "/api";
let currentPlantId = null;

// tab switching
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.tab).classList.add("active");
    });
});

async function api(path, options = {}) {
    const res = await fetch(`${API}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options
    });
    return res.json();
}

// ---------- USERS ----------
async function loadUsers() {
    const users = await api("/users");
    const tbody = document.querySelector("#usersTable tbody");
    tbody.innerHTML = "";
    const select = document.getElementById("plantUser");
    select.innerHTML = "";
    users.forEach(u => {
        tbody.innerHTML += `<tr>
            <td>${u.name}</td><td>${u.email}</td>
            <td><button onclick="deleteUser(${u.id})">Delete</button></td>
        </tr>`;
        select.innerHTML += `<option value="${u.id}">${u.name}</option>`;
    });
}

document.getElementById("userForm").addEventListener("submit", async e => {
    e.preventDefault();
    await api("/users", {
        method: "POST",
        body: JSON.stringify({
            name: document.getElementById("userName").value,
            email: document.getElementById("userEmail").value
        })
    });
    e.target.reset();
    loadUsers();
});

async function deleteUser(id) {
    await api(`/users/${id}`, { method: "DELETE" });
    loadUsers();
}

// ---------- SPECIES ----------
async function loadSpecies() {
    const species = await api("/species");
    const tbody = document.querySelector("#speciesTable tbody");
    tbody.innerHTML = "";
    const select = document.getElementById("plantSpecies");
    select.innerHTML = "";
    species.forEach(s => {
        tbody.innerHTML += `<tr>
            <td>${s.name}</td><td>${s.watering_interval_days}d</td><td>${s.sunlight_needs || "-"}</td>
            <td>${s.fertilizing_interval_days || "-"}d</td>
            <td>${s.ideal_temp_min ?? "-"}\u2013${s.ideal_temp_max ?? "-"}\u00b0C</td>
            <td>${s.difficulty_level || "-"}</td>
            <td><button onclick="deleteSpecies(${s.id})">Delete</button></td>
        </tr>`;
        select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}

document.getElementById("speciesForm").addEventListener("submit", async e => {
    e.preventDefault();
    await api("/species", {
        method: "POST",
        body: JSON.stringify({
            name: document.getElementById("spName").value,
            watering_interval_days: Number(document.getElementById("spWatering").value),
            sunlight_needs: document.getElementById("spSunlight").value,
            fertilizing_interval_days: Number(document.getElementById("spFertilizing").value) || null,
            ideal_temp_min: Number(document.getElementById("spTempMin").value) || null,
            ideal_temp_max: Number(document.getElementById("spTempMax").value) || null,
            difficulty_level: document.getElementById("spDifficulty").value
        })
    });
    e.target.reset();
    loadSpecies();
});

async function deleteSpecies(id) {
    await api(`/species/${id}`, { method: "DELETE" });
    loadSpecies();
}

// ---------- PLANTS ----------
async function loadPlants() {
    const plants = await api("/plants");
    const tbody = document.querySelector("#plantsTable tbody");
    tbody.innerHTML = "";
    plants.forEach(p => {
        tbody.innerHTML += `<tr>
            <td>${p.nickname || "-"}</td><td>${p.species_name}</td><td>${p.owner_name}</td>
            <td>${p.location || "-"}</td><td>${p.date_acquired}</td>
            <td><button onclick="openLogModal(${p.id}, 'care')">Log Care</button></td>
            <td><button onclick="openLogModal(${p.id}, 'health')">Log Health</button></td>
            <td><button onclick="deletePlant(${p.id})">Delete</button></td>
        </tr>`;
    });
}

document.getElementById("plantForm").addEventListener("submit", async e => {
    e.preventDefault();
    await api("/plants", {
        method: "POST",
        body: JSON.stringify({
            user_id: Number(document.getElementById("plantUser").value),
            species_id: Number(document.getElementById("plantSpecies").value),
            nickname: document.getElementById("plantNickname").value,
            date_acquired: document.getElementById("plantDateAcquired").value,
            location: document.getElementById("plantLocation").value
        })
    });
    e.target.reset();
    loadPlants();
    loadDueStatus();
});

async function deletePlant(id) {
    await api(`/plants/${id}`, { method: "DELETE" });
    loadPlants();
    loadDueStatus();
}

// ---------- LOG MODAL ----------
function openLogModal(plantId, type) {
    currentPlantId = plantId;
    document.getElementById("logModal").classList.remove("hidden");
    document.getElementById("careLogForm").classList.toggle("hidden", type !== "care");
    document.getElementById("healthLogForm").classList.toggle("hidden", type !== "health");
    document.getElementById("logModalTitle").textContent = type === "care" ? "Log Care Action" : "Log Health Status";
}

document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("logModal").classList.add("hidden");
});

document.getElementById("careLogForm").addEventListener("submit", async e => {
    e.preventDefault();
    await api("/care_logs", {
        method: "POST",
        body: JSON.stringify({
            plant_id: currentPlantId,
            action_type: document.getElementById("careActionType").value,
            date_performed: document.getElementById("careDate").value,
            notes: document.getElementById("careNotes").value
        })
    });
    e.target.reset();
    document.getElementById("logModal").classList.add("hidden");
    loadDueStatus();
});

document.getElementById("healthLogForm").addEventListener("submit", async e => {
    e.preventDefault();
    await api("/health_logs", {
        method: "POST",
        body: JSON.stringify({
            plant_id: currentPlantId,
            status: document.getElementById("healthStatus").value,
            date_logged: document.getElementById("healthDate").value
        })
    });
    e.target.reset();
    document.getElementById("logModal").classList.add("hidden");
});

// ---------- DUE STATUS ----------
async function loadDueStatus() {
    const rows = await api("/due_status");
    const tbody = document.querySelector("#dueTable tbody");
    tbody.innerHTML = "";
    rows.forEach(r => {
        const overdue = r.days_overdue !== null && r.days_overdue > 0;
        tbody.innerHTML += `<tr>
            <td>${r.nickname || "-"}</td><td>${r.species_name}</td>
            <td>${r.last_watered_date || "never"}</td><td>${r.watering_interval_days}</td>
            <td class="${overdue ? "overdue" : ""}">${r.days_overdue ?? "-"}</td>
        </tr>`;
    });
}

// ---------- INIT ----------
loadUsers();
loadSpecies();
loadPlants();
loadDueStatus();