    const screens = document.querySelectorAll('.screen');
    const dots = document.querySelectorAll('.dot');
    const nextBtn = document.querySelector('.next-btn');
    let currentIndex = 0;

    function showScreen(index) {
      screens.forEach((screen, i) => {
        screen.classList.toggle('active', i === index);
        dots[i].classList.toggle('active', i === index);
      });

      currentIndex = index;

      // Esconde botão "Próximo" na última tela
      if (currentIndex === screens.length - 1) {
        nextBtn.style.display = 'none';
      } else {
        nextBtn.style.display = 'block';
      }
    }

    function nextScreen() {
      if (currentIndex < screens.length - 1) {
        showScreen(currentIndex + 1);
      }
    }

    nextBtn.addEventListener('click', nextScreen);

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => showScreen(idx));
    });