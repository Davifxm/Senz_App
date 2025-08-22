import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBOqDbKnGTkP-35Hjsga8hnPQFqQRp7AME",
  authDomain: "senz-bae74.firebaseapp.com",
  projectId: "senz-bae74",
  storageBucket: "senz-bae74.appspot.com",
  messagingSenderId: "604865943153",
  appId: "1:604865943153:web:b17d947e686a5becc4add0",
  measurementId: "G-3GNNQWFVGH"
};

initializeApp(firebaseConfig);
const auth = getAuth();

// Atualiza perfil
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Nome e inicial
  const nome = user.displayName || user.email.split("@")[0];
  document.getElementById("userName").textContent = nome;

  if (user.photoURL) {
    document.getElementById("userPhoto").src = user.photoURL;
    document.getElementById("userPhoto").style.display = "block";
    document.getElementById("userLetter").style.display = "none";
  } else {
    const inicial = nome.charAt(0).toUpperCase();
    const letterDiv = document.getElementById("userLetter");
    letterDiv.textContent = inicial;
    letterDiv.style.display = "flex";
    document.getElementById("userPhoto").style.display = "none";
  }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => window.location.href = "login.html")
    .catch(err => console.error("Erro ao sair:", err));
});

// Função dock
window.setActive = function(el) {
  document.querySelectorAll('.dock-icon').forEach(icon => icon.classList.remove('active'));
  el.classList.add('active');
}