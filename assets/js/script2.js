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
let dadosFrequencia = [];
let dadosEDA = [];

// Controle visual do ativo ao clicar
function setActive(el) {
  document.querySelectorAll('.dock-icon').forEach(icon => icon.classList.remove('active'));
  el.classList.add('active');
}

// Função para buscar dados de frequência cardíaca do Firebase
async function buscarDadosFrequencia() {
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
        if (dia && dia.data) {
          dadosCompletos.push({
            data: dia.data,
            media: dia.media,
            maximo: dia.maximo,
            minimo: dia.minimo,
            totalRegistros: dia.totalRegistros,
            timestamp: dia.timestamp
          });
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
        // Agrupar dados por dia
        const dadosPorDia = {};
        
        Object.values(dataBatimentos).forEach(item => {
          if (item && item.bpm && item.timestamp) {
            const data = new Date(item.timestamp).toLocaleDateString('pt-BR');
            if (!dadosPorDia[data]) {
              dadosPorDia[data] = [];
            }
            dadosPorDia[data].push(item.bpm);
          }
        });

        // Calcular estatísticas por dia
        Object.keys(dadosPorDia).forEach(data => {
          const valores = dadosPorDia[data];
          dadosCompletos.push({
            data: data,
            media: Math.round(valores.reduce((a, b) => a + b, 0) / valores.length),
            maximo: Math.max(...valores),
            minimo: Math.min(...valores),
            totalRegistros: valores.length,
            timestamp: new Date(data.split('/').reverse().join('-')).getTime()
          });
        });
      }
    }

    // Ordenar por data (mais recente primeiro)
    dadosCompletos.sort((a, b) => b.timestamp - a.timestamp);
    
    console.log(`Total de ${dadosCompletos.length} dias de dados de frequência cardíaca`);
    return dadosCompletos;

  } catch (error) {
    console.error('Erro ao buscar dados de frequência:', error);
    return [];
  }
}

// Função para gerar dados EDA baseados na frequência cardíaca
function gerarDadosEDA(dadosFrequencia) {
  return dadosFrequencia.map(dia => {
    // Converter BPM para EDA (microsiemens)
    // Quanto maior o BPM, maior o EDA
    const baseEDA = 0.2; // EDA base
    const multiplicador = (dia.media - 60) / 40; // Normalizar entre 60-100 BPM
    const eda = baseEDA + (multiplicador * 0.8); // EDA entre 0.2 e 1.0 μS
    
    return {
      data: dia.data,
      eda: Math.round(eda * 100) / 100, // Arredondar para 2 casas decimais
      status: eda < 0.4 ? 'normal' : eda < 0.7 ? 'elevado' : 'alto',
      timestamp: dia.timestamp
    };
  });
}

// Função para determinar status da frequência cardíaca
function determinarStatusFrequencia(media) {
  if (media < 60) return { status: 'baixo', classe: 'status-normal' };
  if (media <= 80) return { status: 'normal', classe: 'status-normal' };
  if (media <= 100) return { status: 'elevado', classe: 'status-elevado' };
  return { status: 'alto', classe: 'status-alto' };
}

// Função para criar card de dados
function criarCardDados(dados, tipo) {
  const container = document.getElementById(`${tipo}-lista`);
  container.innerHTML = '';

  if (dados.length === 0) {
    container.innerHTML = '<div class="no-data">Nenhum dado encontrado</div>';
    return;
  }

  dados.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card-data';
    
    if (tipo === 'frequencia') {
      const status = determinarStatusFrequencia(item.media);
      card.innerHTML = `
        <svg viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="17" rx="4" fill="#bcd8fa"/>
          <rect x="6" y="2" width="12" height="6" rx="2" fill="#d6e8fb"/>
          <rect x="7" y="7.7" width="10" height="7" rx="3" fill="#fff"/>
          <rect x="8" y="10.8" width="8" height="3.2" rx="1.5" fill="#3866A9" opacity="0.15"/>
          <rect x="9.7" y="11.7" width="4.6" height="1.3" rx="0.7" fill="#3866A9" opacity="0.12"/>
        </svg>
        <div class="card-info-data">
          <span class="data-date">${item.data}</span>
          <div class="data-stats">
            <span>Média: ${item.media} bpm</span>
            <span>${item.totalRegistros} registros</span>
          </div>
          <div class="data-status ${status.classe}">${status.status}</div>
        </div>
      `;
    } else {
      card.innerHTML = `
        <svg viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="17" rx="4" fill="#bcd8fa"/>
          <rect x="6" y="2" width="12" height="6" rx="2" fill="#d6e8fb"/>
          <rect x="7" y="7.7" width="10" height="7" rx="3" fill="#fff"/>
          <rect x="8" y="10.8" width="8" height="3.2" rx="1.5" fill="#3866A9" opacity="0.15"/>
          <rect x="9.7" y="11.7" width="4.6" height="1.3" rx="0.7" fill="#3866A9" opacity="0.12"/>
        </svg>
        <div class="card-info-data">
          <span class="data-date">${item.data}</span>
          <div class="data-stats">
            <span>EDA: ${item.eda} μS</span>
          </div>
          <div class="data-status status-${item.status}">${item.status}</div>
        </div>
      `;
    }

    // Adicionar evento de clique para ver detalhes
    card.addEventListener('click', () => {
      if (tipo === 'frequencia') {
        window.location.href = 'freqcard.html';
      } else {
        window.location.href = 'eda.html';
      }
    });

    container.appendChild(card);
  });
}

// Função para filtrar dados por busca
function filtrarDados(termo) {
  const termoLower = termo.toLowerCase();
  
  const frequenciaFiltrada = dadosFrequencia.filter(item => 
    item.data.toLowerCase().includes(termoLower) ||
    item.media.toString().includes(termoLower) ||
    determinarStatusFrequencia(item.media).status.includes(termoLower)
  );
  
  const edaFiltrada = dadosEDA.filter(item => 
    item.data.toLowerCase().includes(termoLower) ||
    item.eda.toString().includes(termoLower) ||
    item.status.includes(termoLower)
  );

  criarCardDados(frequenciaFiltrada, 'frequencia');
  criarCardDados(edaFiltrada, 'eda');
}

// Função para carregar todos os dados
async function carregarDados() {
  console.log('Carregando dados...');
  
  // Buscar dados de frequência cardíaca
  dadosFrequencia = await buscarDadosFrequencia();
  
  // Gerar dados EDA baseados na frequência cardíaca
  dadosEDA = gerarDadosEDA(dadosFrequencia);
  
  // Criar cards
  criarCardDados(dadosFrequencia, 'frequencia');
  criarCardDados(dadosEDA, 'eda');
}

// Configurar busca
function configurarBusca() {
  const inputBusca = document.getElementById('busca');
  if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
      const termo = e.target.value.trim();
      if (termo === '') {
        criarCardDados(dadosFrequencia, 'frequencia');
        criarCardDados(dadosEDA, 'eda');
      } else {
        filtrarDados(termo);
      }
    });

    // Enter na busca
    inputBusca.addEventListener('keydown', e => {
      if (e.key === 'Enter') e.target.blur();
    });
  }
}

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Página de dados carregada');
  
  // Configurar busca
  configurarBusca();
  
  // Verificar autenticação
  if (typeof firebase !== 'undefined') {
    firebase.auth().onAuthStateChanged(user => {
      if (!user) {
        console.log('Usuário não autenticado, redirecionando...');
        window.location.href = "login.html";
      } else {
        // Carregar dados após autenticação
        carregarDados();
      }
    });
  } else {
    // Se Firebase não estiver disponível, carregar dados simulados
    carregarDados();
  }
});

// Detecta a página e ativa o ícone correto
(function () {
  const file = location.pathname.split('/').pop().toLowerCase();
  const dockIcons = document.querySelectorAll('.dock-icon');
  if (!dockIcons.length) return;

  // ordem: home, coração, relógio, barras, perfil
  const indexPorPagina = {
    'telainicial.html': 0,
    'intervencoes.html': 1,
    'historico.html':    2,
    'dados.html':        3,
    'perfil.html':       4,
  };

  const idx = indexPorPagina[file];
  if (idx !== undefined) {
    dockIcons.forEach(i => i.classList.remove('active'));
    dockIcons[idx].classList.add('active');
  }
})();