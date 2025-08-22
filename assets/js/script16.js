    function goBack() { window.history.back(); }
    function setActive(el) {
      document.querySelectorAll('.dock-flutuante .dock-icon').forEach(i => i.classList.remove('active'));
      el.classList.add('active');
    }
    function navigateTo(page, el) { setActive(el); window.location.href = page; }

    // 🔹 Animação do círculo ao clicar em play + barra de progresso de 19s
    window.onload = () => {
      const btnPlay = document.getElementById("btn-play");
      const icon = document.getElementById("icon-play").querySelector("path");
      const pulmao = document.getElementById("pulmao");
      const barra = document.querySelector(".progresso");

      const DURACAO = 19000; // 19 segundos
      const AMP = 0.12;      // amplitude do pulso
      const FREQ = 2;        // frequência do seno (rad/s no fator usado)

      let animando = false;
      let animFrame;
      let startTime = 0;     // performance.now() quando dá play
      let elapsedBase = 0;   // acumula tempo quando pausa
      let terminou = false;

      function loop(now) {
        const elapsed = elapsedBase + (now - startTime);
        const t = Math.min(elapsed / DURACAO, 1);

        // Pulso do círculo
        const scale = 1 + AMP * Math.sin((elapsed / 1000) * FREQ);
        pulmao.style.transform = `scale(${scale})`;

        // Barra de progresso
        barra.style.width = (t * 100).toFixed(1) + "%";

        if (elapsed >= DURACAO) {
          // Finaliza: para pulso, barra em 100%, ícone volta para play
          finalizarAnimacao();
          return;
        }
        animFrame = requestAnimationFrame(loop);
      }

      function iniciarAnimacao() {
        // Se já terminou antes, ao novo play reinicia tudo
        if (terminou || elapsedBase >= DURACAO) {
          elapsedBase = 0;
          terminou = false;
          barra.style.width = "0%";
        }
        startTime = performance.now();
        animando = true;
        icon.setAttribute("d", "M6 4h4v16H6zm8 0h4v16h-4z"); // pause
        animFrame = requestAnimationFrame(loop);
      }

      function pausarAnimacao() {
        // acumula o tempo até aqui
        cancelAnimationFrame(animFrame);
        const now = performance.now();
        elapsedBase += (now - startTime);
        animando = false;
        icon.setAttribute("d", "M8 5v14l11-7z"); // play
        // mantém a barra onde parou; círculo volta ao normal
        pulmao.style.transform = "scale(1)";
      }

      function finalizarAnimacao() {
        cancelAnimationFrame(animFrame);
        animando = false;
        terminou = true;
        elapsedBase = DURACAO;           // marca como completo
        barra.style.width = "100%";      // garante 100%
        pulmao.style.transform = "scale(1)";
        icon.setAttribute("d", "M8 5v14l11-7z"); // volta para play
      }

      // Clique do botão play/pause
      btnPlay.addEventListener("click", () => {
        if (!animando) {
          iniciarAnimacao();
        } else {
          pausarAnimacao();
        }
      });
    };