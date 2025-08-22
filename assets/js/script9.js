    // Configuração Firebase (sua config)
    var firebaseConfig = {
      apiKey: "AIzaSyBOqDbKnGTkP-35Hjsga8hnPQFqQRp7AME",
      authDomain: "senz-bae74.firebaseapp.com",
      projectId: "senz-bae74",
      storageBucket: "senz-bae74.appspot.com",
      messagingSenderId: "604865943153",
      appId: "1:604865943153:web:b17d947e686a5becc4add0",
      measurementId: "G-3GNNQWFVGH"
    };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();

    // Login com email e senha
    document.getElementById('btnLogin').addEventListener('click', () => {
      const email = document.getElementById('email').value;
      const senha = document.getElementById('senha').value;

      if (!email || !senha) {
        alert('Preencha e-mail e senha.');
        return;
      }

      auth.signInWithEmailAndPassword(email, senha)
        .then(() => {
          window.location.href = 'telainicial.html';
        })
        .catch((error) => {
          alert('Erro no login: ' + error.message);
        });
    });

    // Login com Google
    document.getElementById('btnGoogle').addEventListener('click', () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
        .then(() => {
          window.location.href = 'telainicial.html';
        })
        .catch((error) => {
          alert('Erro no login com Google: ' + error.message);
        });
    });

    // "Esqueci minha senha"
    document.getElementById('forgot-password').addEventListener('click', () => {
      const email = prompt("Digite seu email para receber o link de redefinição de senha:");

      if (!email) {
        alert("Você precisa digitar um email válido.");
        return;
      }

      auth.sendPasswordResetEmail(email)
        .then(() => {
          alert("Email de redefinição enviado! Verifique sua caixa de entrada.");
        })
        .catch((error) => {
          alert("Erro ao enviar email: " + error.message);
        });
    });