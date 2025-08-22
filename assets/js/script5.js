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

// Inicializar Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
}

const firebaseSecret = "eGvu0jhnP7YMRVnuj4jGKxXmpq4fVW6x087THsVq";
const userId = localStorage.getItem('firebaseUid');

// Variáveis globais
let chart = null;
let dadosFrequencia = [];
let intervalId = null;
let ultimaDataSalva = null;

function setActive(el) {
  document.querySelectorAll('.dock-icon').forEach(icon => {
    icon.classList.remove('active');
  });
  el.classList.add('active');
}

// Função para buscar dados de frequência cardíaca do Firebase
async function buscarDadosFrequencia() {
  if (!userId) {
    console.log('Usuário não autenticado');
    return [];
  }

  try {
    const firebaseUrl = `https://senz-bae74-default-rtdb.firebaseio.com/users/${userId}/batimentos.json?auth=${firebaseSecret}`;
    const response = await fetch(firebaseUrl);
    const data = await response.json();

    if (!data || Object.keys(data).length === 0) {
      console.log('Nenhum dado de frequência encontrado');
      return [];
    }

    // Converter dados para array e ordenar por timestamp
    const dadosArray = Object.values(data).filter(item => item && item.bpm && item.timestamp);
    dadosArray.sort((a, b) => a.timestamp - b.timestamp);

    // Pegar os últimos 20 registros para o gráfico
    const ultimosDados = dadosArray.slice(-20);
    
    return ultimosDados.map(item => ({
      bpm: item.bpm,
      timestamp: item.timestamp,
      data: new Date(item.timestamp).toLocaleDateString('pt-BR'),
      hora: new Date(item.timestamp).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }));

  } catch (error) {
    console.error('Erro ao buscar dados de frequência:', error);
    return [];
  }
}

// Função para salvar dados diários no histórico
async function salvarDadosDiarios(dados) {
  if (!userId || dados.length === 0) return;

  try {
    const hoje = new Date().toLocaleDateString('pt-BR');
    
    // Verificar se já salvamos dados para hoje
    if (ultimaDataSalva === hoje) {
      console.log('Dados de hoje já foram salvos no histórico');
      return;
    }

    // Filtrar dados apenas do dia atual
    const dadosHoje = dados.filter(item => {
      const dataItem = new Date(item.timestamp).toLocaleDateString('pt-BR');
      return dataItem === hoje;
    });

    if (dadosHoje.length === 0) {
      console.log('Nenhum dado de hoje encontrado para salvar');
      return;
    }

    // Calcular estatísticas do dia
    const valores = dadosHoje.map(item => item.bpm);
    const media = Math.round(valores.reduce((a, b) => a + b, 0) / valores.length);
    const maximo = Math.max(...valores);
    const minimo = Math.min(...valores);
    
    const resumoDiario = {
      data: hoje,
      timestamp: Date.now(),
      media: media,
      maximo: maximo,
      minimo: minimo,
      totalRegistros: dadosHoje.length,
      dados: dadosHoje
    };

    // Salvar no histórico diário
    const historicoUrl = `https://senz-bae74-default-rtdb.firebaseio.com/users/${userId}/historico_diario/${hoje.replace(/\//g, '-')}.json?auth=${firebaseSecret}`;
    
    await fetch(historicoUrl, {
      method: 'PUT',
      body: JSON.stringify(resumoDiario)
    });

    console.log(`Dados diários salvos no histórico: ${hoje} (${dadosHoje.length} registros)`);
    ultimaDataSalva = hoje;

  } catch (error) {
    console.error('Erro ao salvar dados diários:', error);
  }
}

// Função para gerar dados simulados (fallback apenas se não houver dados reais)
function gerarDadosSimulados() {
  let dados = [];
  let base = Math.floor(Math.random() * 20) + 60; // entre 60 e 80 bpm
  
  for (let i = 0; i < 20; i++) {
    const timestamp = Date.now() - (19 - i) * 2 * 60 * 1000; // 2 minutos de intervalo
    dados.push({
      bpm: base + Math.floor(Math.random() * 10 - 5),
      timestamp: timestamp,
      data: new Date(timestamp).toLocaleDateString('pt-BR'),
      hora: new Date(timestamp).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    });
  }
  return dados;
}

// Função para calcular interpretação do BPM
function calcularAnsiedade(bpm) {
  if (bpm < 60) return "Muito baixa (possível bradicardia)";
  if (bpm <= 80) return "Normal e saudável";
  if (bpm <= 100) return "Levemente elevada";
  return "Alta ansiedade (possível taquicardia)";
}

// Função para obter detalhes do status
function obterDetalhesStatus(bpm) {
  if (bpm < 60) {
    return {
      status: "Baixa Frequência",
      descricao: "Sua frequência cardíaca está abaixo do normal. Isso pode indicar relaxamento profundo ou, em alguns casos, bradicardia.",
      recomendacoes: [
        "Se você se sente bem, pode ser apenas relaxamento",
        "Se sentir tontura ou fraqueza, consulte um médico",
        "Mantenha-se hidratado",
        "Evite mudanças bruscas de posição"
      ]
    };
  } else if (bpm <= 80) {
    return {
      status: "Frequência Normal",
      descricao: "Sua frequência cardíaca está dentro da faixa saudável. Continue mantendo seus hábitos saudáveis.",
      recomendacoes: [
        "Mantenha sua rotina de exercícios",
        "Continue com alimentação equilibrada",
        "Durma bem",
        "Gerencie o estresse adequadamente"
      ]
    };
  } else if (bpm <= 100) {
    return {
      status: "Frequência Elevada",
      descricao: "Sua frequência cardíaca está um pouco elevada. Pode ser devido a atividade física, estresse ou ansiedade.",
      recomendacoes: [
        "Pratique técnicas de respiração",
        "Faça uma pausa e relaxe",
        "Beba água",
        "Evite cafeína em excesso"
      ]
    };
  } else {
    return {
      status: "Frequência Alta",
      descricao: "Sua frequência cardíaca está significativamente elevada. Considere técnicas de relaxamento imediatas.",
      recomendacoes: [
        "Respire fundo e lentamente",
        "Sente-se e relaxe",
        "Se persistir, consulte um médico",
        "Evite atividades intensas"
      ]
    };
  }
}

// Função para atualizar o gráfico
function atualizarGrafico(dados) {
  const ctx = document.getElementById("graficoCardiaco").getContext("2d");
  
  // Destruir gráfico anterior se existir
  if (chart) {
    chart.destroy();
  }

  // Preparar dados para o gráfico
  const labels = dados.map((item, index) => `${item.hora}`);
  const valores = dados.map(item => item.bpm);
  
  // Pegar o último valor para exibição
  const bpmAtual = valores[valores.length - 1] || 0;

  // Atualizar display de BPM
  document.getElementById("bpmDisplay").textContent = bpmAtual + " bpm";
  document.getElementById("interpretacaoBPM").textContent = `${bpmAtual} bpm é ${calcularAnsiedade(bpmAtual).toLowerCase()}.`;
  
  // Atualizar detalhes do status
  const detalhes = obterDetalhesStatus(bpmAtual);
  document.getElementById("statusDetalhado").innerHTML = `
    <strong>${detalhes.status}</strong><br>
    ${detalhes.descricao}
  `;
  
  document.getElementById("recomendacoes").innerHTML = `
    <strong>Recomendações:</strong><br>
    • ${detalhes.recomendacoes.join('<br>• ')}
  `;

  // Criar novo gráfico
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Frequência Cardíaca',
        data: valores,
        borderColor: '#3866A9',
        backgroundColor: 'rgba(56, 102, 169, 0.2)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#3866A9',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { 
        y: { 
          suggestedMin: 50, 
          suggestedMax: 120,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      plugins: { 
        legend: { 
          display: false 
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `BPM: ${context.parsed.y}`;
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });

  // Atualizar timestamp de "Atualizado agora"
  const agora = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  document.querySelector('._29-de-junho').textContent = `Atualizado às ${agora}`;
}

// Função para atualizar status do Firebase
function atualizarStatusFirebase(mensagem, tipo = 'info') {
  const statusEl = document.getElementById('statusFirebase');
  if (statusEl) {
    statusEl.textContent = mensagem;
    
    // Definir cor baseada no tipo
    switch (tipo) {
      case 'sucesso':
        statusEl.style.color = '#28a745';
        statusEl.style.background = 'rgba(40, 167, 69, 0.1)';
        break;
      case 'erro':
        statusEl.style.color = '#dc3545';
        statusEl.style.background = 'rgba(220, 53, 69, 0.1)';
        break;
      case 'info':
      default:
        statusEl.style.color = '#3866A9';
        statusEl.style.background = 'rgba(56, 102, 169, 0.1)';
        break;
    }
  }
}

// Função principal para carregar e atualizar dados
async function carregarDadosFrequencia() {
  console.log('Carregando dados de frequência cardíaca...');
  atualizarStatusFirebase('Buscando dados do Firebase...', 'info');
  
  // Buscar dados reais do Firebase
  let dados = await buscarDadosFrequencia();
  
  // Se não houver dados reais, usar dados simulados como fallback
  if (dados.length === 0) {
    console.log('Nenhum dado real encontrado, usando dados simulados como fallback');
    atualizarStatusFirebase('Usando dados simulados (sem conexão)', 'erro');
    dados = gerarDadosSimulados();
  } else {
    console.log(`Carregados ${dados.length} dados reais do Firebase`);
    atualizarStatusFirebase(`Dados reais carregados (${dados.length} registros)`, 'sucesso');
    
    // Salvar dados diários no histórico
    await salvarDadosDiarios(dados);
  }

  dadosFrequencia = dados;
  atualizarGrafico(dados);
}

// Função para atualizar dados periodicamente
function iniciarAtualizacaoAutomatica() {
  // Atualizar a cada 2 minutos (120000 ms)
  intervalId = setInterval(async () => {
    console.log('Atualizando dados automaticamente...');
    await carregarDadosFrequencia();
    atualizarIndicadorProximaAtualizacao();
    
    // Verificar se há novos dados para salvar no histórico
    await verificarNovosDados();
  }, 120000); // 2 minutos
  
  // Atualizar indicador inicial
  atualizarIndicadorProximaAtualizacao();
}

// Função para verificar se há novos dados no Firebase
async function verificarNovosDados() {
  if (!userId) return;

  try {
    const firebaseUrl = `https://senz-bae74-default-rtdb.firebaseio.com/users/${userId}/batimentos.json?auth=${firebaseSecret}`;
    const response = await fetch(firebaseUrl);
    const data = await response.json();

    if (!data || Object.keys(data).length === 0) {
      return;
    }

    // Converter dados para array e ordenar por timestamp
    const dadosArray = Object.values(data).filter(item => item && item.bpm && item.timestamp);
    dadosArray.sort((a, b) => a.timestamp - b.timestamp);

    // Verificar se há dados novos (mais recentes que o último verificado)
    const ultimoTimestamp = dadosFrequencia.length > 0 ? Math.max(...dadosFrequencia.map(d => d.timestamp)) : 0;
    const dadosNovos = dadosArray.filter(item => item.timestamp > ultimoTimestamp);

    if (dadosNovos.length > 0) {
      console.log(`Encontrados ${dadosNovos.length} novos registros`);
      atualizarStatusFirebase(`${dadosNovos.length} novos dados encontrados`, 'sucesso');
      
      // Atualizar dadosFrequencia com os novos dados
      const novosDadosFormatados = dadosNovos.map(item => ({
        bpm: item.bpm,
        timestamp: item.timestamp,
        data: new Date(item.timestamp).toLocaleDateString('pt-BR'),
        hora: new Date(item.timestamp).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));
      
      dadosFrequencia = [...dadosFrequencia, ...novosDadosFormatados].slice(-20); // Manter apenas os últimos 20
      
      // Salvar dados diários atualizados
      await salvarDadosDiarios(dadosFrequencia);
      
      // Atualizar gráfico
      atualizarGrafico(dadosFrequencia);
    } else {
      atualizarStatusFirebase('Nenhum novo dado encontrado', 'info');
    }

  } catch (error) {
    console.error('Erro ao verificar novos dados:', error);
  }
}

// Função para atualizar o indicador de próxima atualização
function atualizarIndicadorProximaAtualizacao() {
  const proximaAtualizacaoEl = document.getElementById('proximaAtualizacao');
  if (proximaAtualizacaoEl) {
    const agora = new Date();
    const proxima = new Date(agora.getTime() + 120000); // 2 minutos
    const horaProxima = proxima.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    proximaAtualizacaoEl.textContent = `Próxima atualização: ${horaProxima}`;
  }
}

// Função para parar atualização automática
function pararAtualizacaoAutomatica() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Página de frequência cardíaca carregada');
  
  // Carregar dados iniciais
  await carregarDadosFrequencia();
  
  // Iniciar atualização automática
  iniciarAtualizacaoAutomatica();
  
  // Parar atualização quando a página for fechada
  window.addEventListener('beforeunload', pararAtualizacaoAutomatica);
});

// Verificar autenticação do usuário
if (typeof firebase !== 'undefined') {
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      console.log('Usuário não autenticado, redirecionando...');
      window.location.href = "login.html";
    }
  });
}

// Função para forçar atualização manual
async function forcarAtualizacao() {
  const btn = document.getElementById('btnAtualizar');
  btn.textContent = 'Atualizando...';
  btn.disabled = true;
  
  try {
    await carregarDadosFrequencia();
    await verificarNovosDados();
    atualizarIndicadorProximaAtualizacao();
    console.log('Atualização forçada concluída');
  } catch (error) {
    console.error('Erro na atualização forçada:', error);
  } finally {
    btn.textContent = 'Atualizar';
    btn.disabled = false;
  }
}