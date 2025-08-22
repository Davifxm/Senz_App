    // ====== Config YouTube ======
    const YT_VIDEO_ID = "UxhDlsH0cGU";

    // Capítulos (ajuste os tempos conforme o vídeo real)
    let segments = [
      { title:"Chuva Suave",         start:  0, end: 120 },
      { title:"Floresta & Pássaros", start:120, end: 300 },
      { title:"Mar Calmo",           start:300, end: 480 },
      { title:"Riacho com Pedras",   start:480, end: 660 },
      { title:"Vento nas Árvores",   start:660, end: 900 }
    ];

    // ====== Refs ======
    const titleEl = document.getElementById("trackTitle");
    const playBtn = document.getElementById("playBtn");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const uiPrev = document.getElementById("uiPrev");
    const uiNext = document.getElementById("uiNext");
    const progressBar  = document.getElementById("progressBar");
    const progressFill = document.getElementById("progressFill");
    const progressKnob = document.getElementById("progressKnob");
    const currTimeEl = document.getElementById("currTime");
    const totalTimeEl = document.getElementById("totalTime");
    const playlistEl = document.getElementById("playlistEl");
    const sheet = document.getElementById("sheet");
    const openPicker = document.getElementById("openPicker");
    const closePicker = document.getElementById("closePicker");
    const goOther = document.getElementById("goOther");

    // ====== Estado ======
    let player, playerReady = false;
    let index = 0;           // faixa atual
    let isPlaying = false;
    let pollId = null;

    // Player
    window.onYouTubeIframeAPIReady = function(){
      player = new YT.Player('player', {
        videoId: YT_VIDEO_ID,
        playerVars: { autoplay:0, controls:0, disablekb:1, fs:0, modestbranding:1, rel:0, playsinline:1 },
        events: { onReady:onPlayerReady }
      });
    };
    function onPlayerReady(){
      playerReady = true;
      renderPlaylist();
      loadTrack(0);                 // deixa uma faixa pronta
      updateButtons();
    }

    // ====== UI ======
    function formatTime(s){ if(!Number.isFinite(s)) return "0:00"; const m=Math.floor(s/60), r=Math.floor(s%60); return `${m}:${r.toString().padStart(2,"0")}`; }
    function segDur(seg){ return Math.max(0,(seg.end - seg.start) || 0); }

    function renderPlaylist(){
      playlistEl.innerHTML = "";

      /* PRIMEIRO ITEM: atalho para outras músicas (redireciona) */
      const link = document.createElement("div");
      link.className = "track";
      link.innerHTML = `
        <div class="tcover"><img src="assets/img/onda.jpg" alt=""></div>
        <div class="tmain"><div class="tname">🌊 Ir para Sons do Mar</div><div class="tartist">Abrir sonmar.html</div></div>
        <div class="tdur">→</div>`;
      link.addEventListener("click", ()=> window.location.href='sonmar.html');
      playlistEl.appendChild(link);

      /* Demais faixas do vídeo atual */
      segments.forEach((t,i)=>{
        const el = document.createElement("div");
        el.className = "track";
        el.innerHTML = `
          <div class="tcover"><img src="assets/img/arvores SONATU.png" alt=""></div>
          <div class="tmain"><div class="tname">${t.title}</div><div class="tartist">YouTube</div></div>
          <div class="tdur">${formatTime(segDur(t))}</div>`;
        el.addEventListener("click", ()=>{ loadTrack(i); play(); hideSheet(); });
        playlistEl.appendChild(el);
      });
      highlightActive();
    }
    function highlightActive(){ [...playlistEl.children].forEach((el,i)=> el.classList.toggle("active", i===index+1)); } // +1 por causa do item de atalho
    function updateButtons(){ playBtn.textContent = isPlaying ? "⏸ Pausar" : "▶ Tocar"; }

    // ====== Fluxo das faixas ======
    function loadTrack(i){
      if(!playerReady) return;
      index = (i + segments.length) % segments.length;
      const seg = segments[index];
      titleEl.textContent = seg.title;
      totalTimeEl.textContent = formatTime(segDur(seg));
      highlightActive();
      player.seekTo(seg.start, true);
      if(isPlaying){ startPoll(); }
      updateProgressUI(seg.start);
    }

    function play(){
      if(!playerReady) return;
      try{ player.unMute && player.unMute(); }catch{}
      player.playVideo();
      isPlaying = true;
      updateButtons();
      startPoll();
    }

    function pause(){
      if(!playerReady) return;
      player.pauseVideo();
      isPlaying = false;
      updateButtons();
      stopPoll();
    }

    // Botões
    playBtn.addEventListener("click", ()=> isPlaying ? pause() : play());
    prevBtn.addEventListener("click", ()=>{ loadTrack(index-1); play(); });
    nextBtn.addEventListener("click", ()=>{ loadTrack(index+1); play(); });
    uiPrev.addEventListener("click", ()=>{ loadTrack(index-1); play(); });
    uiNext.addEventListener("click", ()=>{ loadTrack(index+1); play(); });

    // Progresso / auto-next
    function startPoll(){
      stopPoll();
      pollId = setInterval(()=>{
        const seg = segments[index];
        const t = player.getCurrentTime ? player.getCurrentTime() : 0;
        if(!Number.isFinite(t)) return;
        if(t >= seg.end - 0.1){
          loadTrack(index+1);
          player.seekTo(segments[index].start, true);
          player.playVideo();
          return;
        }
        updateProgressUI(t);
      }, 200);
    }
    function stopPoll(){ if(pollId){ clearInterval(pollId); pollId=null; } }

    function updateProgressUI(absTime){
      const seg = segments[index];
      const rel = Math.max(0, Math.min((absTime - seg.start)/segDur(seg), 1));
      progressFill.style.width = `${rel*100}%`;
      progressKnob.style.left = `${rel*100}%`;
      currTimeEl.textContent = formatTime(rel * segDur(seg));
    }

    // Seek dentro do segmento
    progressBar.addEventListener("click", (e)=>{
      if(!playerReady) return;
      const rect = progressBar.getBoundingClientRect();
      const ratio = Math.min(Math.max((e.clientX - rect.left)/rect.width, 0), 1);
      const seg = segments[index];
      const target = seg.start + ratio * segDur(seg);
      player.seekTo(target, true);
      if(isPlaying) startPoll();
    });

    // Picker (folha)
    function showSheet(){ sheet.style.display = "flex"; }
    function hideSheet(){ sheet.style.display = "none"; }
    openPicker.addEventListener("click", showSheet);
    closePicker.addEventListener("click", hideSheet);
    sheet.addEventListener("click", (e)=>{ if(e.target===sheet) hideSheet(); });

    // NOVO: botão “Outras músicas (Sons do Mar)”
    goOther.addEventListener("click", ()=> window.location.href='sonmar.html');

    // Dock
    function setActive(el){ document.querySelectorAll('.dock-icon').forEach(i=>i.classList.remove('active')); el.classList.add('active'); }
    window.setActive = setActive;