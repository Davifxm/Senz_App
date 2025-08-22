    function setActive(el) {
      document.querySelectorAll('.dock-icon').forEach(icon => {
        icon.classList.remove('active');
      });
      el.classList.add('active');
    }
    function goBack() {
      window.history.back();
    }
    // Função para exibir mensagens uma a uma
    document.addEventListener('DOMContentLoaded', function() {
      const mensagens = [
        'Você está indo muito bem! Lembre-se de respirar 🌱',
        'Tudo passa, inclusive o que você sente agora. 😊',
        'Você merece esse cuidado. ✨',
        'Não se cobre tanto<br>Um passo de cada a vez 🦶',
        'Seu corpo está tentando te proteger.<br>Acalme-o com carinho! 🤲',
        'Algumas pausas não são fraqueza.<br>São um jeito bonito de continuar. ☁️',
        'Se tudo parecer demais, reduza. Respire.<br>Um pequeno passo ainda é movimento. 🟢',
        'Seu ritmo é único. E tá tudo bem assim. 🌿'
      ];
      const lista = document.getElementById('mensagens-lista');
      let i = 0;
      function mostrarMensagem() {
        if(i < mensagens.length){
          const div = document.createElement('div');
          div.className = 'mensagem-card';
          div.innerHTML = mensagens[i];
          lista.appendChild(div);
          i++;
          setTimeout(mostrarMensagem, 2000);
        }
      }
      mostrarMensagem();
    });