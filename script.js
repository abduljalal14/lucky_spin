const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");

let segments = [];
let spinDuration = 4;
let currentRotation = 0;
let isSpinning = false;

const colors = [
  "#e74c3c",
  "#3498db",
  "#f1c40f",
  "#2ecc71",
  "#9b59b6",
  "#e67e22",
  "#1abc9c",
];

function loadData() {
  const stored = localStorage.getItem("spin_v2_data");
  const dur = localStorage.getItem("spin_v2_dur");
  segments = stored
    ? JSON.parse(stored)
    : [
        { text: "1", weight: 1 },
        { text: "2", weight: 1 },
        { text: "3", weight: 1 },
        { text: "4", weight: 1 },
        { text: "5", weight: 10 }, // Nomor 5 lebih sering muncul
        { text: "6", weight: 1 }, // Nomor 5 lebih sering muncul
        { text: "7", weight: 1 }, // Nomor 5 lebih sering muncul
        { text: "8", weight: 1 }, // Nomor 5 lebih sering muncul
        { text: "9", weight: 1 }, // Nomor 5 lebih sering muncul
        { text: "10", weight: 1 }, // Nomor 5 lebih sering muncul
      ];
  spinDuration = dur ? parseInt(dur) : 4;
}

function drawWheel() {
  const num = segments.length;
  const arc = (Math.PI * 2) / num;
  const centerX = 250,
    centerY = 250;

  ctx.clearRect(0, 0, 500, 500);
  segments.forEach((s, i) => {
    const angle = i * arc;
    ctx.beginPath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, 250, angle, angle + arc);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle + arc / 2);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "white";
    ctx.font = "bold 18px Arial";
    //ctx.fillText(s.text, 150, 8);
    ctx.fillText(s.text, 0, -250 + 30);
    ctx.restore();
  });
}

// --- ALGORITMA PENENTUAN PEMENANG ---
function getWeightedRandom() {
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < segments.length; i++) {
    if (random < segments[i].weight) return i;
    random -= segments[i].weight;
  }
  return 0;
}

function spin() {
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.disabled = true;

  // Play spin sound
  document.getElementById('spinSound').play();

  // 1. Tentukan siapa pemenangnya secara matematis DULU
  const winnerIndex = getWeightedRandom();

  // 2. Hitung posisi sudut yang harus dituju agar winnerIndex ada di JARUM (Atas)
  // Sudut tiap irisan (derajat)
  const sliceDeg = 360 / segments.length;

  // Hitung target sudut agar item tersebut berada di jam 12 (270 derajat canvas)
  // Kita taruh di tengah-tengah irisan tersebut
  const targetItemCenter = winnerIndex * sliceDeg + sliceDeg / 2;
  const stopAngle = (270 - targetItemCenter + 360) % 360;

  // 3. Tambahkan putaran ekstra (misal 5-10 putaran penuh)
  const extraRotations = 360 * 8;
  const totalRotation = extraRotations + stopAngle;

  // Agar animasi smooth, kita tidak reset currentRotation ke 0
  // Tapi kita hitung sisa dari rotasi sebelumnya
  const baseRotation = currentRotation - (currentRotation % 360);
  const finalRotation = baseRotation + totalRotation + 360;

  canvas.style.transition = `transform ${spinDuration}s cubic-bezier(0.15, 0, 0.15, 1)`;
  canvas.style.transform = `rotate(${finalRotation}deg)`;
  currentRotation = finalRotation;

  setTimeout(() => {
    isSpinning = false;
    spinBtn.disabled = false;
    document.getElementById("resultValue").innerText =
      segments[winnerIndex].text;
    // Stop spin sound
    document.getElementById('spinSound').pause();
    // Play result sound
    document.getElementById('resultSound').play();
    toggleModal("resultModal", true);
  }, spinDuration * 1000);
}

// --- UI & SETTINGS ---
function toggleModal(id, show) {
  document.getElementById(id).classList.toggle("active", show);
}

document.getElementById("settingsBtn").addEventListener("click", () => {
  document.getElementById("itemsInput").value = segments
    .map((s) => `${s.text}:${s.weight}`)
    .join("\n");
  toggleModal("settingsModal", true);
});

document.getElementById("saveSettingsBtn").addEventListener("click", () => {
  const lines = document.getElementById("itemsInput").value.split("\n");
  const newSegments = lines
    .map((l) => {
      const p = l.split(":");
      return { text: p[0].trim(), weight: parseInt(p[1]) || 1 };
    })
    .filter((s) => s.text !== "");

  if (newSegments.length < 2) return alert("Min 2 item");

  segments = newSegments;
  spinDuration = parseInt(document.getElementById("durationInput").value) || 4;
  localStorage.setItem("spin_v2_data", JSON.stringify(segments));
  localStorage.setItem("spin_v2_dur", spinDuration);

  drawWheel();
  toggleModal("settingsModal", false);
});

spinBtn.addEventListener("click", spin);
loadData();
drawWheel();
