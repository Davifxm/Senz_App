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
let dadosHistoricos = [];
let graficosAtivos = new Map();
let periodoAtual = 7; // dias

// Função para buscar dados históricos do Firebase
async function buscarDadosHistoricos() {
  if (!userId) {
    console.log('Usuário não autenticado');
    return [];
  }

  try {
    // Primeiro, tentar buscar dados do histórico diário
    const historicoUrl = `https://senz-bae74-default-rtdb.firebaseio.com/users/${userId}/historico_diario.json?auth=${firebaseSecret}`;
    const responseHistorico = await fetch(historicoUrl);
    const dataHistorico = await responseHistorico.json();

    let dadosCompletos = [];

    // Se há dados no histórico diário, processá-los
    if (dataHistorico && Object.keys(dataHistorico).length > 0) {
      console.log('Encontrados dados no histórico diário');
      
      Object.values(dataHistorico).forEach(dia => {
        if (dia && dia.dados && Array.isArray(dia.dados)) {
          dadosCompletos.push(...dia.dados.map(item => ({
            ...item,
            dataCompleta: new Date(item.timestamp)
          })));
        }
      });
    }

    // Se não há dados suficientes no histórico diário, buscar dados de batimentos em tempo real
    if (dadosCompletos.length === 0) {
      console.log('Buscando dados de batimentos em tempo real...');
      
      const batimentosUrl = `https://senz-bae74-default-rtdb.firebaseio.com/users/${userId}/batimentos.json?auth=${firebaseSecret}`;
      const responseBatimentos = await fetch(batimentosUrl);
      const dataBatimentos = await responseBatimentos.json();

      if (dataBatimentos && Object.keys(dataBatimentos).length > 0) {
        // Converter dados para array e ordenar por timestamp
        const dadosArray = Object.values(dataBatimentos).filter(item => item && item.bpm && item.timestamp);
        dadosArray.sort((a, b) => a.timestamp - b.timestamp);

        dadosCompletos = dadosArray.map(item => ({
          bpm: item.bpm,
          timestamp: item.timestamp,
          data: new Date(item.timestamp).toLocaleDateString('pt-BR'),
          hora: new Date(item.timestamp).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          dataCompleta: new Date(item.timestamp)
        }));
      }
    }

    if (dadosCompletos.length === 0) {
      console.log('Nenhum dado histórico encontrado');
      return [];
    }

    // Ordenar todos os dados por timestamp
    dadosCompletos.sort((a, b) => a.timestamp - b.timestamp);
    
    console.log(`Total de ${dadosCompletos.length} registros históricos carregados`);
    return dadosCompletos;

  } catch (error) {
    console.error('Erro ao buscar dados históricos:', error);
    return [];
  }
}

// Função para agrupar dados por dia
function agruparDadosPorDia(dados) {
  const dadosPorDia = {};
  
  dados.forEach(item => {
    const data = item.dataCompleta.toDateString();
    if (!dadosPorDia[data]) {
      dadosPorDia[data] = [];
    }
    dadosPorDia[data].push(item);
  });

  return dadosPorDia;
}

// Função para filtrar dados por período
function filtrarDadosPorPeriodo(dados, dias) {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - dias);
  
  return dados.filter(item => item.dataCompleta >= dataLimite);
}

// Função para calcular estatísticas do dia
function calcularEstatisticasDia(dadosDia) {
  if (dadosDia.length === 0) return null;
  
  const valores = dadosDia.map(item => item.bpm);
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const maximo = Math.max(...valores);
  const minimo = Math.min(...valores);
  
  return {
    media: Math.round(media),
    maximo,
    minimo,
    totalRegistros: dadosDia.length
  };
}

// Função para criar gráfico de um dia
function criarGraficoDia(data, dadosDia, container) {
  const dataFormatada = new Date(data).toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const estatisticas = calcularEstatisticasDia(dadosDia);
  if (!estatisticas) return;

  // Criar elemento do gráfico
  const graficoDiv = document.createElement('div');
  graficoDiv.className = 'grafico-dia';
  graficoDiv.style.cssText = `
    background: white;
    border-radius: 15px;
    padding: 20px;
    margin: 15px 0;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    border: 1px solid #e0e0e0;
  `;

  graficoDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h3 style="margin: 0; color: #333; font-size: 18px;">${dataFormatada}</h3>
      <div style="text-align: right; font-size: 12px; color: #666;">
        <div>Média: <strong>${estatisticas.media} bpm</strong></div>
        <div>Máx: ${estatisticas.maximo} | Mín: ${estatisticas.minimo}</div>
        <div>${estatisticas.totalRegistros} registros</div>
      </div>
    </div>
    <div style="position: relative; height: 200px;">
      <canvas id="grafico-${data.replace(/\s/g, '-')}"></canvas>
    </div>
  `;

  container.appendChild(graficoDiv);

  // Criar gráfico
  const ctx = graficoDiv.querySelector('canvas').getContext('2d');
  const labels = dadosDia.map(item => item.hora);
  const valores = dadosDia.map(item => item.bpm);

  const chart = new Chart(ctx, {
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
        pointRadius: 3
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

  // Armazenar referência do gráfico
  graficosAtivos.set(data, chart);
}

// Função para limpar gráficos existentes
function limparGraficos() {
  graficosAtivos.forEach(chart => {
    chart.destroy();
  });
  graficosAtivos.clear();
  
  const container = document.getElementById('graficosContainer');
  container.innerHTML = '';
}

// Função para carregar e exibir dados históricos
async function carregarDadosHistoricos() {
  console.log('Carregando dados históricos...');
  
  // Buscar dados do Firebase
  const dados = await buscarDadosHistoricos();
  
  if (dados.length === 0) {
    // Se não há dados reais, gerar dados simulados para demonstração
    console.log('Gerando dados simulados para demonstração...');
    dados.push(...gerarDadosSimulados());
  }

  // Filtrar por período
  const dadosFiltrados = filtrarDadosPorPeriodo(dados, periodoAtual);
  
  // Agrupar por dia
  const dadosPorDia = agruparDadosPorDia(dadosFiltrados);
  
  // Limpar gráficos existentes
  limparGraficos();
  
  // Criar gráficos para cada dia
  const container = document.getElementById('graficosContainer');
  const diasOrdenados = Object.keys(dadosPorDia).sort((a, b) => new Date(b) - new Date(a));
  
  diasOrdenados.forEach(data => {
    criarGraficoDia(data, dadosPorDia[data], container);
  });

  // Atualizar lista de datas (para compatibilidade)
  atualizarListaDatas(diasOrdenados);
  
  console.log(`Carregados ${diasOrdenados.length} dias de dados históricos`);
}

// Função para gerar dados simulados (para demonstração)
function gerarDadosSimulados() {
  const dados = [];
  const hoje = new Date();
  
  // Gerar dados para os últimos 7 dias
  for (let dia = 6; dia >= 0; dia--) {
    const data = new Date(hoje);
    data.setDate(data.getDate() - dia);
    
    // Gerar entre 5-15 registros por dia
    const registrosPorDia = Math.floor(Math.random() * 11) + 5;
    const baseBpm = Math.floor(Math.random() * 20) + 60; // entre 60 e 80 bpm
    
    for (let i = 0; i < registrosPorDia; i++) {
      const hora = new Date(data);
      hora.setHours(8 + Math.floor(Math.random() * 14)); // entre 8h e 22h
      hora.setMinutes(Math.floor(Math.random() * 60));
      
      dados.push({
        bpm: baseBpm + Math.floor(Math.random() * 10 - 5),
        timestamp: hora.getTime(),
        data: hora.toLocaleDateString('pt-BR'),
        hora: hora.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        dataCompleta: hora
      });
    }
  }
  
  return dados;
}

// Função para atualizar lista de datas
function atualizarListaDatas(dias) {
  const listaContainer = document.getElementById('lista-datas');
  listaContainer.innerHTML = '';
  
  dias.forEach(data => {
    const dataFormatada = new Date(data).toLocaleDateString('pt-BR');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'history-item';
    itemDiv.dataset.date = data;
    
    itemDiv.innerHTML = `
      <div class="icon">
        <svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z"/></svg>
      </div>
      <div class="date">${dataFormatada}</div>
    `;
    
    listaContainer.appendChild(itemDiv);
  });
}

// Função para buscar por texto
function configurarBusca() {
  const inputBusca = document.getElementById('busca');
  inputBusca.addEventListener('input', () => {
    const termo = inputBusca.value.trim().toLowerCase();
    document.querySelectorAll('.grafico-dia').forEach(el => {
      const titulo = el.querySelector('h3').textContent.toLowerCase();
      el.style.display = titulo.includes(termo) ? 'block' : 'none';
    });
  });
}

// Função para configurar seletor de período
function configurarSeletorPeriodo() {
  const select = document.getElementById('periodoSelect');
  select.addEventListener('change', (e) => {
    periodoAtual = parseInt(e.target.value);
    carregarDadosHistoricos();
  });
}

// Função para configurar botão "ver mais"
function configurarBotaoVerMais() {
  const btn = document.getElementById('btnCarregarMais');
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    periodoAtual += 7; // Adicionar mais 7 dias
    carregarDadosHistoricos();
  });
}

// Active visual + rotas do dock
function setActive(el) {
  document.querySelectorAll('.dock-icon').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
}

function configurarDock() {
  const dockIcons = document.querySelectorAll('.dock-icon');
  if (dockIcons.length >= 5) {
    dockIcons[0].addEventListener('click', () => { window.location.href = 'telainicial.html'; });
    dockIcons[1].addEventListener('click', () => { window.location.href = 'intervencoes.html'; });
    dockIcons[2].addEventListener('click', () => { window.location.href = 'historico.html'; });
    dockIcons[3].addEventListener('click', () => { window.location.href = 'dados.html'; });
    dockIcons[4].addEventListener('click', () => { window.location.href = 'perfil.html'; });
  }
}

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Página de histórico carregada');
  
  // Configurar funcionalidades
  configurarBusca();
  configurarSeletorPeriodo();
  configurarBotaoVerMais();
  configurarDock();
  
  // Verificar autenticação
  if (typeof firebase !== 'undefined') {
    firebase.auth().onAuthStateChanged(user => {
      if (!user) {
        console.log('Usuário não autenticado, redirecionando...');
        window.location.href = "login.html";
      } else {
        // Carregar dados após autenticação
        carregarDadosHistoricos();
      }
    });
  } else {
    // Se Firebase não estiver disponível, carregar dados simulados
    carregarDadosHistoricos();
  }
});

// Limpar gráficos quando a página for fechada
window.addEventListener('beforeunload', () => {
  limparGraficos();
});