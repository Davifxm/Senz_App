  function verificarCodigo() {
      const codigoValido = "senz1234";
      const codigo = document.getElementById("codigo").value.trim().toLowerCase();
      const msg = document.getElementById("mensagem");
      const erro = document.getElementById("erro");

      if (codigo === codigoValido) {
        erro.style.display = "none";
        msg.style.display = "block";

        setTimeout(() => {
          window.location.href = "explicacoes.html";
        }, 2500); // Redireciona após 2.5 segundos
      } else {
        msg.style.display = "none";
        erro.style.display = "block";
      }
    }