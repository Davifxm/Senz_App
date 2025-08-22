// Configuração do Firebase
    const firebaseConfig = {
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

    function criarConta() {
      const nome = document.getElementById('nome').value.trim();
      const email = document.getElementById('email').value;
      const senha = document.getElementById('senha').value;

      auth.createUserWithEmailAndPassword(email, senha)
        .then((userCredential) => {
          const user = userCredential.user;

          // Atualiza o perfil com o nome informado
          return user.updateProfile({
            displayName: nome,
            photoURL: null // Pode trocar por uma imagem padrão se quiser
          }).then(() => {
            localStorage.setItem('firebaseUid', user.uid);
            alert("Conta criada com sucesso!");
            window.location.href = "telainicial.html";
          });
        })
        .catch((error) => {
          alert("Erro ao criar conta: " + error.message);
        });
    }

    // Função para login com Google
    function loginComGoogle() {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
        .then((userCredential) => {
          const user = userCredential.user;
          localStorage.setItem('firebaseUid', user.uid);
          alert("Login com Google bem-sucedido!");
          window.location.href = "telainicial.html";
        })
        .catch((error) => {
          alert("Erro no login com Google: " + error.message);
        });
    }