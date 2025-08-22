// Ativa o ícone no dock
function setActive(el) {
  document.querySelectorAll('.dock-icon').forEach(icon => icon.classList.remove('active'));
  el.classList.add('active');
}

// Modal helpers
const modalDev = document.getElementById('modal-dev');

function abrirDev() {
  if (modalDev) {
    modalDev.classList.add('show');
    modalDev.setAttribute('aria-hidden', 'false');
  }
}

function fecharDev() {
  if (modalDev) {
    modalDev.classList.remove('show');
    modalDev.setAttribute('aria-hidden', 'true');
  }
}

if (modalDev) {
  // fecha clicando fora
  modalDev.addEventListener('click', (e) => {
    if (e.target === modalDev) fecharDev();
  });

  // fecha com ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharDev();
  });
}

// Clique nas músicas
document.querySelectorAll('.music-box').forEach(box => {
  box.addEventListener('click', () => {
    const link = box.getAttribute('data-link');
    const dev  = box.hasAttribute('data-dev');

    if (link && !dev) {
      window.location.href = link;
      return;
    }

    abrirDev(); // mostra modal se estiver em dev
  });
});
