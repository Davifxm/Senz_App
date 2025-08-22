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
let dadosEDA = [];
let intervalId = null;

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

// Função para converter BPM para EDA
function converterBPMparaEDA(bpm) {
  // Converter BPM para EDA (microsiemens)
  // Quanto maior o BPM, maior o EDA
  const baseEDA = 0.2; // EDA base
  const multiplicador = (bpm - 60) / 40; // Normalizar entre 60-100 BPM
  const eda = baseEDA + (multiplicador * 0.8); // EDA entre 0.2 e 1.0 μS
  
  return Math.round(eda * 100) / 100; // Arredondar para 2 casas decimais
}

// Função para gerar dados EDA simulados (fallback)
function gerarDadosEDASimulados() {
  let dados = [];
  let base = 0.3; // EDA base
  
  for (let i = 0; i < 20; i++) {
    const timestamp = Date.now() - (19 - i) * 2 * 60 * 1000; // 2 minutos de intervalo
    const eda = base + Math.random() * 0.4; // entre 0.3 e 0.7 μS
    dados.push({
      eda: Math.round(eda * 100) / 100,
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

// Função para calcular interpretação do EDA
function calcularInterpretacaoEDA(eda) {
  if (eda < 0.4) return "Baixa ativação emocional";
  if (eda <= 0.7) return "Ativação emocional moderada";
  return "Alta ativação emocional";
}

// Função para obter detalhes do status EDA
function obterDetalhesStatusEDA(eda) {
  if (eda < 0.4) {
    return {
      status: "Baixa Ativação",
      descricao: "Sua atividade galvânica indica baixa ativação emocional. Isso pode sugerir relaxamento ou, em alguns casos, apatia.",
      recomendacoes: [
        "Se você se sente bem, pode ser apenas relaxamento",
        "Se sentir apatia, busque atividades estimulantes",
        "Converse com pessoas próximas",
        "Pratique atividades que te dão prazer"
      ]
    };
  } else if (eda <= 0.7) {
    return {
      status: "Ativação Moderada",
      descricao: "Sua atividade galvânica está em níveis normais. Indica equilíbrio emocional saudável.",
      recomendacoes: [
        "Mantenha seus hábitos saudáveis",
        "Continue com atividades equilibradas",
        "Pratique técnicas de relaxamento quando necessário",
        "Mantenha conexões sociais"
      ]
    };
  } else {
    return {
      status: "Alta Ativação",
      descricao: "Sua atividade galvânica está elevada, indicando alta ativação emocional ou estresse.",
      recomendacoes: [
        "Pratique técnicas de respiração",
        "Faça pausas para relaxar",
        "Evite estímulos excessivos",
        "Considere buscar apoio se necessário"
      ]
    };
  }
}

// Função para atualizar o gráfico
function atualizarGrafico(dados) {
  const ctx = document.getElementById("graficoEDA").getContext("2d");
  
  // Destruir gráfico anterior se existir
  if (chart) {
    chart.destroy();
  }

  // Preparar dados para o gráfico
  const labels = dados.map((item, index) => `${item.hora}`);
  const valores = dados.map(item => item.eda);
  
  // Pegar o último valor para exibição
  const edaAtual = valores[valores.length - 1] || 0;

  // Atualizar display de EDA
  document.getElementById("edaDisplay").textContent = edaAtual + " μS";
  document.getElementById("interpretacaoEDA").textContent = `${edaAtual} μS indica ${calcularInterpretacaoEDA(edaAtual).toLowerCase()}.`;
  
  // Atualizar detalhes do status
  const detalhes = obterDetalhesStatusEDA(edaAtual);
  document.getElementById("statusDetalhadoEDA").innerHTML = `
    <strong>${detalhes.status}</strong><br>
    ${detalhes.descricao}
  `;
  
  document.getElementById("recomendacoesEDA").innerHTML = `
    <strong>Recomendações:</strong><br>
    • ${detalhes.recomendacoes.join('<br>• ')}
  `;

  // Criar novo gráfico
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Atividade Galvânica (EDA)',
        data: valores,
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.2)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#28a745',
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
          suggestedMin: 0, 
          suggestedMax: 1.2,
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
              return `EDA: ${context.parsed.y} μS`;
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
async function carregarDadosEDA() {
  console.log('Carregando dados de EDA...');
  atualizarStatusFirebase('Buscando dados do Firebase...', 'info');
  
  // Buscar dados reais do Firebase
  let dadosFrequencia = await buscarDadosFrequencia();
  
  // Se não houver dados reais, usar dados simulados como fallback
  if (dadosFrequencia.length === 0) {
    console.log('Nenhum dado real encontrado, usando dados simulados como fallback');
    atualizarStatusFirebase('Usando dados simulados (sem conexão)', 'erro');
    dadosEDA = gerarDadosEDASimulados();
  } else {
    console.log(`Carregados ${dadosFrequencia.length} dados reais do Firebase`);
    atualizarStatusFirebase(`Dados reais carregados (${dadosFrequencia.length} registros)`, 'sucesso');
    
    // Converter dados de frequência cardíaca para EDA
    dadosEDA = dadosFrequencia.map(item => ({
      eda: converterBPMparaEDA(item.bpm),
      timestamp: item.timestamp,
      data: item.data,
      hora: item.hora
    }));
  }

  atualizarGrafico(dadosEDA);
}

// Função para atualizar dados periodicamente
function iniciarAtualizacaoAutomatica() {
  // Atualizar a cada 2 minutos (120000 ms)
  intervalId = setInterval(async () => {
    console.log('Atualizando dados EDA automaticamente...');
    await carregarDadosEDA();
    atualizarIndicadorProximaAtualizacao();
  }, 120000); // 2 minutos
  
  // Atualizar indicador inicial
  atualizarIndicadorProximaAtualizacao();
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

// Função para forçar atualização manual
async function forcarAtualizacao() {
  const btn = document.getElementById('btnAtualizar');
  btn.textContent = 'Atualizando...';
  btn.disabled = true;
  
  try {
    await carregarDadosEDA();
    atualizarIndicadorProximaAtualizacao();
    console.log('Atualização forçada concluída');
  } catch (error) {
    console.error('Erro na atualização forçada:', error);
  } finally {
    btn.textContent = 'Atualizar';
    btn.disabled = false;
  }
}

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Página de EDA carregada');
  
  // Carregar dados iniciais
  await carregarDadosEDA();
  
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