const API = "/api";

function showLoginForm() {
    document.getElementById("loginTabBtn").classList.add("active");
    document.getElementById("registerTabBtn").classList.remove("active");
    document.getElementById("loginFormContainer").classList.add("active");
    document.getElementById("registerFormContainer").classList.remove("active");
}

function showRegisterForm() {
    document.getElementById("registerTabBtn").classList.add("active");
    document.getElementById("loginTabBtn").classList.remove("active");
    document.getElementById("registerFormContainer").classList.add("active");
    document.getElementById("loginFormContainer").classList.remove("active");
}

document.getElementById("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    const msg = document.getElementById("loginMessage");
    if (!res.ok) {
        msg.textContent = data.error;
        msg.className = "auth-message error";
        return;
    }
    sessionStorage.setItem("gardenUser", JSON.stringify(data));
    window.location.href = "index.html";
});

document.getElementById("registerForm").addEventListener("submit", async e => {
    e.preventDefault();
    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    const msg = document.getElementById("registerMessage");
    if (!res.ok) {
        msg.textContent = data.error;
        msg.className = "auth-message error";
        return;
    }
    sessionStorage.setItem("gardenUser", JSON.stringify(data));
    window.location.href = "index.html";
});

if (sessionStorage.getItem("gardenUser")) {
    window.location.href = "index.html";
}