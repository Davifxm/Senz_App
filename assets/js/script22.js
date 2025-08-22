    // Aplica animação e redireciona após 4 segundos
    window.onload = () => {
      setTimeout(() => {
        document.body.classList.add('fade-out');
        setTimeout(() => {
          window.location.href = "./public/ativacao.html";
        }, 1000); // Aguarda a transição de 1s antes de trocar de página
      }, 4000);
    };