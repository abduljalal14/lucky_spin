const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");

let segments = [];
let spinDuration = 4;
let currentRotation = 0;
let isSpinning = false;

const colors = ["#e74c3c", "#3498db", "#f1c40f", "#2ecc71", "#9b59b6", "#e67e22", "#1abc9c"];

function loadData() {
  const stored = localStorage.getItem("spin_v2_data");
  const dur = localStorage.getItem("spin_v2_dur");
  segments = stored
    ? JSON.parse(stored)
    : [
        { text: "1", weight: 150},
        { text: "2", weight: 6 },
        { text: "3", weight: 5 },
        { text: "4", weight: 24 },
        { text: "5", weight: 7 },
        { text: "6", weight: 4 },
        { text: "7", weight: 50 },
        { text: "8", weight: 14 },
        { text: "9", weight: 7 },
        { text: "10", weight: 23 },
        { text: "11", weight: 33 },
        { text: "12", weight: 24 },
        { text: "13", weight: 5 },
        { text: "14", weight: 5 },
        { text: "15", weight: 4 },
        { text: "16", weight: 7 },
        { text: "17", weight: 6 },
        { text: "18", weight: 7 },
        { text: "19", weight: 24 },
        { text: "20", weight: 6 }
      ];
  spinDuration = dur ? parseInt(dur) : 4;
}

function drawWheel() {
  const num = segments.length;
  const arc = (Math.PI * 2) / num;
  const centerX = 250, centerY = 250;

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
    ctx.textAlign = "center"; // Diubah ke center agar lebih rapi
    ctx.fillStyle = "white";
    ctx.font = "bold 18px Arial";
    // Menampilkan Teks dan Sisa Bobot di visual wheel
    ctx.fillText(`${s.text}`, 0, -250 + 40);
    ctx.restore();
  });
}

function getWeightedRandom() {
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  
  // Jika semua item berbobot 0, berikan peringatan atau cegah spin
  if (totalWeight <= 0) return -1; 

  let random = Math.random() * totalWeight;
  for (let i = 0; i < segments.length; i++) {
    if (random < segments[i].weight) return i;
    random -= segments[i].weight;
  }
  return 0;
}

function spin() {
  if (isSpinning) return;

  // Cek apakah masih ada peluang tersisa
  const winnerIndex = getWeightedRandom();
  if (winnerIndex === -1) {
    alert("Semua item sudah habis (peluang 0)!");
    return;
  }

  isSpinning = true;
  spinBtn.disabled = true;

  document.getElementById('spinSound').play();

  const sliceDeg = 360 / segments.length;
  const targetItemCenter = winnerIndex * sliceDeg + sliceDeg / 2;
  const stopAngle = (270 - targetItemCenter + 360) % 360;
  const extraRotations = 360 * 8;
  const totalRotation = extraRotations + stopAngle;

  const baseRotation = currentRotation - (currentRotation % 360);
  const finalRotation = baseRotation + totalRotation + 360;

  canvas.style.transition = `transform ${spinDuration}s cubic-bezier(0.15, 0, 0.15, 1)`;
  canvas.style.transform = `rotate(${finalRotation}deg)`;
  currentRotation = finalRotation;

  setTimeout(() => {
    isSpinning = false;
    spinBtn.disabled = false;
    
    // Tampilkan Hasil
    document.getElementById("resultValue").innerText = segments[winnerIndex].text;
    
    // --- LOGIKA PENGURANGAN PELUANG ---
    if (segments[winnerIndex].weight > 0) {
        segments[winnerIndex].weight -= 1; // Kurangi 1
    }

    // Update LocalStorage agar data tersimpan meski di-refresh
    localStorage.setItem("spin_v2_data", JSON.stringify(segments));
    
    // Gambar ulang wheel untuk memperbarui teks angka peluang di dalam roda
    drawWheel();

    document.getElementById('spinSound').pause();
    document.getElementById('resultSound').play();
    toggleModal("resultModal", true);
  }, spinDuration * 1000);
}

// UI & SETTINGS (Tidak berubah banyak, hanya penyesuaian filter)
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
      return { 
        text: p[0].trim(), 
        weight: Math.max(0, parseInt(p[1]) || 0) // Memastikan minimal 0
      };
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