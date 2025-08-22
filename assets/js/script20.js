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

    function setActive(el) {
      document.querySelectorAll('.dock-icon').forEach(icon => {
        icon.classList.remove('active');
      });
      el.classList.add('active');
    }

    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        const nome = user.displayName || 'Usuário';
        const foto = user.photoURL;
        const greeting = document.querySelector('.greeting');
        if (greeting) greeting.innerHTML = `Bem vindo(a) de volta,<br>${nome}`;
        const userCircle = document.querySelector('.user-circle');
        if (foto) {
          userCircle.innerHTML = `<img src="${foto}" alt="Foto de ${nome}" style="width:100%; height:100%; border-radius:50%;">`;
          userCircle.style.border = "none";
          userCircle.style.background = "transparent";
          userCircle.style.color = "transparent";
        } else {
          userCircle.textContent = nome.charAt(0).toUpperCase();
        }
      } else {
        window.location.href = "index.html";
      }
    });

    const firebaseSecret = "eGvu0jhnP7YMRVnuj4jGKxXmpq4fVW6x087THsVq";
    const userId = localStorage.getItem('firebaseUid');

    function getBpmValueElement() {
      return document.querySelector('#card-ansiedade .value');
    }

    async function buscarUltimoBPM() {
      const bpmValueEl = getBpmValueElement();
      if (!bpmValueEl) return;
      if (!userId) {
        bpmValueEl.textContent = "-- bpm";
        return;
      }
      const firebaseUrl = `https://senz-bae74-default-rtdb.firebaseio.com/users/${userId}/batimentos.json?auth=${firebaseSecret}`;
      try {
        const res = await fetch(firebaseUrl);
        const data = await res.json();
        if (!data || Object.keys(data).length === 0) {
          bpmValueEl.textContent = "-- bpm";
          return;
        }
        let ultimoBpm = null;
        let ultimoTimestamp = -1;
        Object.values(data).forEach(item => {
          if (item && item.timestamp > ultimoTimestamp) {
            ultimoTimestamp = item.timestamp;
            ultimoBpm = item.bpm;
          }
        });
        bpmValueEl.textContent = ultimoBpm !== null ? ultimoBpm + " bpm" : "-- bpm";
        
        // Atualizar status baseado no BPM
        if (ultimoBpm !== null) {
          atualizarStatusBaseadoBPM(ultimoBpm);
        }
      } catch (e) {
        bpmValueEl.textContent = "-- bpm";
      }
    }

    buscarUltimoBPM();
    setInterval(buscarUltimoBPM, 10000);
    
    // Atualizar dados de EDA
    atualizarDadosEDA();
    setInterval(atualizarDadosEDA, 10000);
    
    // Iniciar monitoramento de interferências
    iniciarMonitoramentoInterferencias();

    // Redireciona ao clicar em Nivel de Ansiedade
    document.getElementById('card-ansiedade').style.cursor = 'pointer';
    document.getElementById('card-ansiedade').addEventListener('click', () => {
      window.location.href = 'freqcard.html';
    });

    // Configurar clique no ícone do Jarvis
    const robotIcon = document.querySelector('.robot-icon');
    if (robotIcon) {
      robotIcon.addEventListener('click', () => {
        const bubble = document.querySelector('.bubble');
        if (bubble && bubble.style.display === 'none') {
          mostrarBolhaJarvis();
        } else {
          toggleChat();
        }
      });
    }

    // Variáveis para monitoramento de interferências
    let ultimoBPM = null;
    let historicoBPM = [];
    let ultimaInterferencia = null;
    let respostasUsuario = {};

    // Função para detectar interferências significativas
    function detectarInterferencia(bpmAtual) {
      if (ultimoBPM === null) {
        ultimoBPM = bpmAtual;
        return null;
      }

      const diferenca = Math.abs(bpmAtual - ultimoBPM);
      const percentualMudanca = (diferenca / ultimoBPM) * 100;

      // Considerar interferência se mudança > 15% ou > 10 BPM
      if (percentualMudanca > 15 || diferenca > 10) {
        const agora = new Date();
        const hora = agora.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        return {
          bpmAnterior: ultimoBPM,
          bpmAtual: bpmAtual,
          diferenca: diferenca,
          percentual: percentualMudanca,
          hora: hora,
          timestamp: agora.getTime()
        };
      }

      ultimoBPM = bpmAtual;
      return null;
    }

    // Função para determinar tipo de interferência
    function determinarTipoInterferencia(interferencia) {
      if (interferencia.bpmAtual > interferencia.bpmAnterior) {
        if (interferencia.bpmAtual > 100) return 'ansiedade_alta';
        if (interferencia.bpmAtual > 90) return 'ansiedade_moderada';
        return 'estresse';
      } else {
        if (interferencia.bpmAtual < 60) return 'relaxamento_profundo';
        return 'calma';
      }
    }

    // Função para gerar pergunta do Jarvis
    function gerarPerguntaJarvis(interferencia) {
      const tipo = determinarTipoInterferencia(interferencia);
      const hora = interferencia.hora;
      
      const perguntas = {
        'ansiedade_alta': `Detectei uma elevação significativa nos seus batimentos às ${hora} (de ${interferencia.bpmAnterior} para ${interferencia.bpmAtual} bpm). Isso foi causado por ansiedade, raiva ou alguma situação estressante?`,
        'ansiedade_moderada': `Notei uma mudança nos seus batimentos às ${hora} (de ${interferencia.bpmAnterior} para ${interferencia.bpmAtual} bpm). Você estava se sentindo ansioso ou preocupado?`,
        'estresse': `Houve uma variação nos seus batimentos às ${hora} (de ${interferencia.bpmAnterior} para ${interferencia.bpmAtual} bpm). Você estava sob algum tipo de pressão ou estresse?`,
        'relaxamento_profundo': `Seus batimentos diminuíram às ${hora} (de ${interferencia.bpmAnterior} para ${interferencia.bpmAtual} bpm). Você estava meditando ou se sentindo muito relaxado?`,
        'calma': `Detectei uma redução nos seus batimentos às ${hora} (de ${interferencia.bpmAnterior} para ${interferencia.bpmAtual} bpm). Você estava se sentindo calmo ou tranquilo?`
      };

      return perguntas[tipo] || `Houve uma mudança nos seus batimentos às ${hora}. Pode me contar o que estava acontecendo?`;
    }

    // Função para mostrar diálogo do Jarvis
    function mostrarDialogoJarvis(interferencia) {
      const pergunta = gerarPerguntaJarvis(interferencia);
      
      // Mostrar a bolha do Jarvis se estiver oculta
      const bubble = document.querySelector('.bubble');
      if (bubble && bubble.style.display === 'none') {
        bubble.style.display = 'block';
      }
      
      // Atualizar mensagem do Jarvis
      const bubbleText = document.querySelector('.bubble p');
      if (bubbleText) {
        bubbleText.innerHTML = pergunta + '<br><br><small>Clique para responder</small>';
      }

      // Armazenar interferência atual
      ultimaInterferencia = interferencia;

      // Mostrar chat automaticamente
      if (!document.getElementById('chatPopup').classList.contains('active')) {
        toggleChat();
      }

      // Adicionar pergunta ao chat
      addMessage(pergunta, false, false);
    }

    // Função para processar resposta do usuário
    function processarRespostaUsuario(resposta) {
      if (!ultimaInterferencia) return;

      const tipo = determinarTipoInterferencia(ultimaInterferencia);
      
      // Salvar resposta no Firebase
      salvarRespostaInterferencia(ultimaInterferencia, tipo, resposta);

      // Gerar resposta do Jarvis baseada na resposta do usuário
      const respostaJarvis = gerarRespostaJarvis(tipo, resposta, ultimaInterferencia);
      addMessage(respostaJarvis, false);

      // Atualizar status baseado na resposta
      atualizarStatusBaseadoResposta(tipo, resposta);

      ultimaInterferencia = null;
      
      // Restaurar mensagem padrão da bolha
      const bubbleText = document.querySelector('.bubble p');
      if (bubbleText) {
        bubbleText.innerHTML = 'Olá, pronto para ajudar com foco e bem-estar.<br>Precisa de algo?';
      }
    }

    // Função para salvar resposta no Firebase
    async function salvarRespostaInterferencia(interferencia, tipo, resposta) {
      if (!userId) return;

      try {
        const dados = {
          timestamp: interferencia.timestamp,
          hora: interferencia.hora,
          bpmAnterior: interferencia.bpmAnterior,
          bpmAtual: interferencia.bpmAtual,
          tipo: tipo,
          resposta: resposta,
          data: new Date().toLocaleDateString('pt-BR')
        };

        const firebaseUrl = `https://senz-bae74-default-rtdb.firebaseio.com/users/${userId}/interferencias.json?auth=${firebaseSecret}`;
        await fetch(firebaseUrl, {
          method: 'POST',
          body: JSON.stringify(dados)
        });

        console.log('Resposta de interferência salva');
      } catch (error) {
        console.error('Erro ao salvar resposta:', error);
      }
    }

    // Função para gerar resposta do Jarvis
    function gerarRespostaJarvis(tipo, resposta, interferencia) {
      const respostas = {
        'ansiedade_alta': {
          'sim': 'Entendo que você estava ansioso. Vamos trabalhar juntos para gerenciar isso. Que tal praticar uma técnica de respiração agora?',
          'nao': 'Obrigado por esclarecer. Às vezes mudanças nos batimentos podem ter outras causas. Como você está se sentindo agora?',
          'outro': 'Obrigado por compartilhar. É importante entender o que afeta seus batimentos. Posso ajudar com alguma técnica de relaxamento?'
        },
        'ansiedade_moderada': {
          'sim': 'É normal sentir ansiedade às vezes. Que tal fazermos uma pausa para respirar fundo?',
          'nao': 'Entendo. Cada pessoa reage diferente às situações. Como posso te ajudar agora?',
          'outro': 'Obrigado por me contar. É sempre bom entender o que está acontecendo. Precisa de algum apoio?'
        },
        'estresse': {
          'sim': 'O estresse pode realmente afetar nossos batimentos. Vamos fazer uma pausa para relaxar?',
          'nao': 'Entendo. Às vezes as mudanças são naturais. Como você está se sentindo?',
          'outro': 'Obrigado por compartilhar. É importante cuidar do nosso bem-estar. Posso ajudar com algo?'
        },
        'relaxamento_profundo': {
          'sim': 'Que ótimo! O relaxamento é muito benéfico. Continue praticando essas técnicas.',
          'nao': 'Interessante! Às vezes nosso corpo relaxa naturalmente. Como você está se sentindo?',
          'outro': 'Obrigado por me contar. É sempre bom entender o que está acontecendo. Continue cuidando de si mesmo!'
        },
        'calma': {
          'sim': 'Perfeito! A calma é muito importante. Continue cultivando esse estado de espírito.',
          'nao': 'Entendo. Cada momento é único. Como você está se sentindo agora?',
          'outro': 'Obrigado por compartilhar. É sempre bom entender o que está acontecendo. Continue cuidando de si mesmo!'
        }
      };

      return respostas[tipo]?.[resposta] || 'Obrigado por compartilhar. É importante entender o que afeta nossos batimentos. Como posso te ajudar?';
    }

    // Função para atualizar status baseado na resposta
    function atualizarStatusBaseadoResposta(tipo, resposta) {
      const statusElement = document.querySelector('#card-ansiedade .status');
      if (!statusElement) return;

      let novoStatus = 'Estável';
      let cor = '#28a745';

      if (resposta === 'sim') {
        switch (tipo) {
          case 'ansiedade_alta':
            novoStatus = 'Ansiedade Alta';
            cor = '#dc3545';
            break;
          case 'ansiedade_moderada':
            novoStatus = 'Ansiedade Moderada';
            cor = '#ffc107';
            break;
          case 'estresse':
            novoStatus = 'Estressado';
            cor = '#fd7e14';
            break;
          case 'relaxamento_profundo':
            novoStatus = 'Muito Relaxado';
            cor = '#17a2b8';
            break;
          case 'calma':
            novoStatus = 'Calmo';
            cor = '#28a745';
            break;
        }
      } else if (resposta === 'nao') {
        novoStatus = 'Estável';
        cor = '#28a745';
      }

      statusElement.textContent = novoStatus;
      statusElement.style.color = cor;
    }

    // Função para converter BPM para EDA
    function converterBPMparaEDA(bpm) {
      const baseEDA = 0.2;
      const multiplicador = (bpm - 60) / 40;
      const eda = baseEDA + (multiplicador * 0.8);
      return Math.round(eda * 100) / 100;
    }

    // Função para atualizar dados de EDA
    async function atualizarDadosEDA() {
      try {
        const firebaseUrl = `https://senz-bae74-default-rtdb.firebaseio.com/users/${userId}/batimentos.json?auth=${firebaseSecret}`;
        const response = await fetch(firebaseUrl);
        const data = await response.json();

        if (data && Object.keys(data).length > 0) {
          let ultimoBpm = null;
          let ultimoTimestamp = -1;
          
          Object.values(data).forEach(item => {
            if (item && item.timestamp > ultimoTimestamp) {
              ultimoTimestamp = item.timestamp;
              ultimoBpm = item.bpm;
            }
          });

          if (ultimoBpm !== null) {
            const eda = converterBPMparaEDA(ultimoBpm);
            const edaValueEl = document.querySelector('#card-eda .value');
            const edaStatusEl = document.querySelector('#card-eda .status');
            
            if (edaValueEl) {
              edaValueEl.textContent = eda + " μS";
            }
            
            if (edaStatusEl) {
              if (eda < 0.4) {
                edaStatusEl.textContent = "Normal";
                edaStatusEl.style.color = "#28a745";
              } else if (eda <= 0.7) {
                edaStatusEl.textContent = "Elevado";
                edaStatusEl.style.color = "#ffc107";
              } else {
                edaStatusEl.textContent = "Alto";
                edaStatusEl.style.color = "#dc3545";
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao atualizar dados de EDA:', error);
      }
    }

    // Função para atualizar status baseado no BPM
    function atualizarStatusBaseadoBPM(bpm) {
      const statusElement = document.querySelector('#card-ansiedade .status');
      if (!statusElement) return;

      let novoStatus = 'Estável';
      let cor = '#28a745';

      if (bpm < 60) {
        novoStatus = 'Baixa Frequência';
        cor = '#17a2b8';
      } else if (bpm <= 80) {
        novoStatus = 'Normal';
        cor = '#28a745';
      } else if (bpm <= 100) {
        novoStatus = 'Elevada';
        cor = '#ffc107';
      } else {
        novoStatus = 'Alta';
        cor = '#dc3545';
      }

      statusElement.textContent = novoStatus;
      statusElement.style.color = cor;
    }

    // Função para iniciar monitoramento de interferências
    function iniciarMonitoramentoInterferencias() {
      // Monitorar mudanças a cada 30 segundos
      setInterval(async () => {
        try {
          const firebaseUrl = `https://senz-bae74-default-rtdb.firebaseio.com/users/${userId}/batimentos.json?auth=${firebaseSecret}`;
          const response = await fetch(firebaseUrl);
          const data = await response.json();

          if (data && Object.keys(data).length > 0) {
            // Pegar o BPM mais recente
            let ultimoBpm = null;
            let ultimoTimestamp = -1;
            
            Object.values(data).forEach(item => {
              if (item && item.timestamp > ultimoTimestamp) {
                ultimoTimestamp = item.timestamp;
                ultimoBpm = item.bpm;
              }
            });

            if (ultimoBpm !== null) {
              const interferencia = detectarInterferencia(ultimoBpm);
              if (interferencia && !ultimaInterferencia) {
                console.log('Interferência detectada:', interferencia);
                mostrarDialogoJarvis(interferencia);
              }
            }
          }
        } catch (error) {
          console.error('Erro ao monitorar interferências:', error);
        }
      }, 30000); // 30 segundos
    }
  // Ativar clique no card de Atividade Galvânica (EDA)
  const cardEDA = document.getElementById('card-eda');
  if (cardEDA) {
    cardEDA.style.cursor = 'pointer';
    cardEDA.addEventListener('click', () => {
      window.location.href = 'eda.html';
    });
  }

  // Chat Popup Functions
  let conversationHistory = [];
  
  // Função para fechar a bolha do Jarvis
  function fecharBolha(event) {
    event.stopPropagation(); // Evita que o clique propague para o wrapper
    const bubble = document.querySelector('.bubble');
    if (bubble) {
      bubble.style.display = 'none';
    }
  }
  
  function toggleChat() {
    const chatPopup = document.getElementById('chatPopup');
    chatPopup.classList.toggle('active');
    
    if (chatPopup.classList.contains('active')) {
      document.getElementById('chatInput').focus();
      loadConversationHistory();
      scrollToBottom();
    }
  }

  // Função para mostrar a bolha do Jarvis
  function mostrarBolhaJarvis() {
    const bubble = document.querySelector('.bubble');
    if (bubble) {
      bubble.style.display = 'block';
      
      // Restaurar mensagem padrão
      const bubbleText = document.querySelector('.bubble p');
      if (bubbleText) {
        bubbleText.innerHTML = 'Olá, pronto para ajudar com foco e bem-estar.<br>Precisa de algo?';
      }
    }
  }

  // Carregar histórico de conversas do Firebase
  async function loadConversationHistory() {
    if (!userId) return;
    
    try {
      const firebaseUrl = `https://senz-bae74-default-rtdb.firebaseio.com/users/${userId}/chat_history.json?auth=${firebaseSecret}`;
      const response = await fetch(firebaseUrl);
      const data = await response.json();
      
      if (data && data.messages) {
        conversationHistory = data.messages;
        
        // Limpar mensagens atuais e recarregar
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        // Adicionar mensagem de boas-vindas se não há histórico
        if (conversationHistory.length === 0) {
          addMessage('Olá! Sou o Jarvis, seu assistente de bem-estar. Como posso ajudá-lo hoje?', false, false);
        } else {
          // Recarregar todas as mensagens do histórico
          conversationHistory.forEach(msg => {
            addMessage(msg.content, msg.role === 'user', false);
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      addMessage('Olá! Sou o Jarvis, seu assistente de bem-estar. Como posso ajudá-lo hoje?', false);
    }
  }

  // Salvar mensagem no histórico
  async function saveMessageToHistory(content, role) {
    if (!userId) return;
    
    const message = {
      content: content,
      role: role,
      timestamp: Date.now()
    };
    
    conversationHistory.push(message);
    
    try {
      const firebaseUrl = `https://senz-bae74-default-rtdb.firebaseio.com/users/${userId}/chat_history.json?auth=${firebaseSecret}`;
      await fetch(firebaseUrl, {
        method: 'PATCH',
        body: JSON.stringify({
          messages: conversationHistory,
          last_updated: Date.now()
        })
      });
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  }

  function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addMessage(content, isUser = false, saveToHistory = true) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    messageDiv.innerHTML = `
      <div class="message-content">
        ${content}
      </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    // Salvar no histórico se necessário
    if (saveToHistory) {
      saveMessageToHistory(content, isUser ? 'user' : 'assistant');
    }
  }

  function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Verificar se é uma resposta sobre interferência
    if (ultimaInterferencia) {
      const resposta = message.toLowerCase();
      if (resposta.includes('sim') || resposta.includes('sí') || resposta.includes('yes')) {
        processarRespostaUsuario('sim');
      } else if (resposta.includes('não') || resposta.includes('nao') || resposta.includes('no')) {
        processarRespostaUsuario('nao');
      } else {
        processarRespostaUsuario('outro');
      }
      
      addMessage(message, true);
      input.value = '';
      return;
    }
    
    // Adiciona mensagem do usuário
    addMessage(message, true);
    input.value = '';
    
    // Mostra indicador de digitação
    showTypingIndicator();
    
    try {
      // Preparar mensagens para a API incluindo histórico
      const apiMessages = [
        {
          role: 'system',
          content: 'Você é o Jarvis, um assistente de bem-estar e saúde mental. Você ajuda usuários com técnicas de respiração, meditação, gerenciamento de estresse e ansiedade. Seja empático, profissional e sempre em português brasileiro. Mantenha as respostas concisas mas úteis. Lembre-se das conversas anteriores para dar respostas mais personalizadas.'
        }
      ];
      
      // Adicionar histórico de conversas (últimas 10 mensagens para não exceder limite)
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach(msg => {
        apiMessages.push({
          role: msg.role,
          content: msg.content
        });
      });
      
      // Adicionar mensagem atual
      apiMessages.push({
        role: 'user',
        content: message
      });
      
      // Chama a Groq API (URL correta da Groq)
      let response;
      try {
                 response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
           method: 'POST',
           headers: {
             'Authorization': `Bearer ${GROQ_API_KEY}`,
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({
             model: 'llama-3.1-8b-instant',
             messages: apiMessages,
             max_tokens: 500,
             temperature: 0.7
           })
         });
      } catch (corsError) {
        // Se der erro de CORS, tenta com proxy alternativo
        console.log('Tentando com proxy devido a CORS...');
        response = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://api.groq.com/openai/v1/chat/completions'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
                     body: JSON.stringify({
             model: 'llama-3.1-8b-instant',
             messages: apiMessages,
             max_tokens: 500,
             temperature: 0.7
           })
        });
      }
      
      // Verificar status da resposta
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro HTTP:', response.status, errorData);
        throw new Error(`Erro HTTP ${response.status}: ${errorData.error?.message || 'Erro desconhecido'}`);
      }
      
      const data = await response.json();
      
      // Log da resposta para debug
      console.log('Resposta da API:', data);
      
      if (data.choices && data.choices[0]) {
        const botResponse = data.choices[0].message.content;
        hideTypingIndicator();
        addMessage(botResponse, false);
      } else {
        console.error('Resposta inválida:', data);
        throw new Error(`Resposta inválida da API: ${JSON.stringify(data)}`);
      }
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      hideTypingIndicator();
      
      // Mostrar erro mais específico
      let errorMessage = 'Desculpe, estou com dificuldades técnicas no momento.';
      
      if (error.message.includes('CORS')) {
        errorMessage = 'Erro de CORS detectado. Tentando solução alternativa...';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet.';
      } else if (error.message.includes('401')) {
        errorMessage = 'API key inválida. Verifique a configuração.';
      } else if (error.message.includes('429')) {
        errorMessage = 'Limite de requisições atingido. Tente novamente em alguns minutos.';
      } else if (error.message.includes('404')) {
        errorMessage = 'API não encontrada. Verifique a URL.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Acesso negado. Verifique a API key.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Erro interno do servidor. Tente novamente.';
      } else if (error.message.includes('Resposta inválida')) {
        errorMessage = 'Resposta inesperada da API. Verifique o console para detalhes.';
      }
      
      addMessage(errorMessage, false);
    }
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      sendMessage();
    }
  }

  // Limpar histórico de conversas
  async function clearChatHistory() {
    if (!userId) return;
    
    if (confirm('Tem certeza que deseja limpar todo o histórico de conversas?')) {
      try {
        // Limpar do Firebase
        const firebaseUrl = `https://senz-bae74-default-rtdb.firebaseio.com/users/${userId}/chat_history.json?auth=${firebaseSecret}`;
        await fetch(firebaseUrl, {
          method: 'DELETE'
        });
        
        // Limpar array local
        conversationHistory = [];
        
        // Limpar interface
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        // Adicionar mensagem de boas-vindas
        addMessage('Histórico limpo! Olá! Sou o Jarvis, seu assistente de bem-estar. Como posso ajudá-lo hoje?', false, false);
        
      } catch (error) {
        console.error('Erro ao limpar histórico:', error);
        alert('Erro ao limpar histórico. Tente novamente.');
      }
    }
  }