// --- KONFIGURASI & STATE ---
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const settingsBtn = document.getElementById("settingsBtn");

let segments = [];
let spinDuration = 3; // detik
let currentAngle = 0; // Sudut saat ini untuk mencegah reset animasi
let isSpinning = false;

// Warna-warna untuk segmen
const colors = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#8AC926",
  "#1982C4",
  "#6A4C93",
  "#F15BB5",
];

// --- MANAJEMEN DATA (LOCALSTORAGE) ---
function loadData() {
  const storedItems = localStorage.getItem("luckySpinItems");
  const storedDuration = localStorage.getItem("luckySpinDuration");

  if (storedItems) {
    segments = JSON.parse(storedItems);
  } else {
    // Default 1-10
    segments = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
  }

  if (storedDuration) {
    spinDuration = parseInt(storedDuration);
  }
}

function saveData(items, duration) {
  localStorage.setItem("luckySpinItems", JSON.stringify(items));
  localStorage.setItem("luckySpinDuration", duration);
  segments = items;
  spinDuration = duration;
  drawWheel();
}

// --- FUNGSI MENGGAMBAR RODA ---
function drawWheel() {
  if (segments.length === 0) return;

  const arc = (Math.PI * 2) / segments.length;
  const radius = canvas.width / 2;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  segments.forEach((segment, i) => {
    const angle = i * arc;

    // Gambar Irisan
    ctx.beginPath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, angle, angle + arc);
    ctx.lineTo(centerX, centerY);
    ctx.fill();
    ctx.stroke();

    // Gambar Teks
    ctx.save();
    ctx.translate(centerX, centerY);

    // rotasi ke tengah segmen
    ctx.rotate(angle + arc / 2);

    // putar balik supaya teks berdiri
    ctx.rotate(Math.PI / 2);

    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Arial";

    // tarik teks ke atas
    ctx.fillText(segment, 0, -radius + 45);

    ctx.restore();
  });
}

// --- LOGIKA SPIN ---
function spin() {
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.disabled = true;

  // Hitung putaran acak
  // Minimal 5 putaran penuh (1800 derajat) + acak 0-360
  const randomDegree = Math.floor(Math.random() * 360);
  const extraSpins = 360 * 5;
  const totalDegree = extraSpins + randomDegree;

  // Tambahkan ke sudut saat ini agar berputar terus (tidak reset)
  const newAngle = currentAngle + totalDegree;

  // Terapkan CSS Transition
  canvas.style.transition = `transform ${spinDuration}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
  canvas.style.transform = `rotate(${newAngle}deg)`;

  currentAngle = newAngle;

  // Tunggu animasi selesai
  setTimeout(() => {
    isSpinning = false;
    spinBtn.disabled = false;
    calculateWinner(newAngle);
  }, spinDuration * 1000);
}

// --- MENGHITUNG PEMENANG ---
function calculateWinner(actualAngle) {
  // Normalisasi sudut ke 0-360
  // Kita menggunakan modulus. Karena CSS rotate berputar searah jarum jam,
  // posisi 0 derajat di Canvas ada di 'Jam 3'.
  // Pointer ada di 'Jam 12' (270 derajat relatif thd canvas, atau -90).

  // Cara termudah: Hitung sisa rotasi efektif
  const deg = actualAngle % 360;

  // Hitung ukuran per segmen dalam derajat
  const sliceDeg = 360 / segments.length;

  // Karena pointer di ATAS (Jam 12) dan rotasi searah jarum jam:
  // Nilai jarum menunjuk = (360 - (rotasi % 360) + offset_90_derajat) % 360
  // Tapi karena canvas start di 0 (kanan), kita perlu penyesuaian.
  // Rumus universal untuk pointer di atas:

  const value = (270 - deg + 360) % 360;
  const index = Math.floor(value / sliceDeg);

  const winner = segments[index];
  showResult(winner);
}

// --- MODAL & UI HANDLING ---
function toggleModal(modalId, show) {
  const el = document.getElementById(modalId);
  if (show) {
    el.classList.add("active");
  } else {
    el.classList.remove("active");
  }
}

function showResult(text) {
  document.getElementById("resultValue").textContent = text;
  toggleModal("resultModal", true);
}

// --- EVENT LISTENERS ---

// Tombol Spin
spinBtn.addEventListener("click", spin);

// Buka Pengaturan
settingsBtn.addEventListener("click", () => {
  // Isi form dengan data saat ini
  document.getElementById("itemsInput").value = segments.join("\n");
  document.getElementById("durationInput").value = spinDuration;
  toggleModal("settingsModal", true);
});

// Simpan Pengaturan
document.getElementById("saveSettingsBtn").addEventListener("click", () => {
  const rawText = document.getElementById("itemsInput").value;
  const newDuration = document.getElementById("durationInput").value;

  // Filter baris kosong
  const newSegments = rawText
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s !== "");

  if (newSegments.length < 2) {
    alert("Minimal harus ada 2 item!");
    return;
  }

  saveData(newSegments, parseInt(newDuration));
  toggleModal("settingsModal", false);

  // Reset rotasi visual agar gambar ulang rapi
  canvas.style.transition = "none";
  canvas.style.transform = "rotate(0deg)";
  currentAngle = 0;
});

// Klik di luar modal untuk menutup
window.onclick = function (event) {
  if (event.target.classList.contains("modal-overlay")) {
    event.target.classList.remove("active");
  }
};

// --- INITIALIZATION ---
loadData();
drawWheel();
