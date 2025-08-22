    // ========= YouTube =========
    const YT_VIDEO_ID = "pWjmpSD-ph0";

    let segments = [
      { title:"Chuva Relax 1",  start:   0, end: 120 },
      { title:"Chuva Relax 2",  start: 120, end: 240 },
      { title:"Chuva Relax 3",  start: 240, end: 360 },
      { title:"Chuva Relax 4",  start: 360, end: 480 },
      { title:"Chuva Relax 5",  start: 480, end: 600 },
      { title:"Chuva Relax 6",  start: 600, end: 720 },
      { title:"Chuva Relax 7",  start: 720, end: 840 },
      { title:"Chuva Relax 8",  start: 840, end: 960 },
      { title:"Chuva Relax 9",  start: 960, end:1080 },
      { title:"Chuva Relax 10", start:1080, end:1200 },
      { title:"Chuva Relax 11", start:1200, end:1320 },
      { title:"Chuva Relax 12", start:1320, end:1440 }
    ];

    // ====== Refs ======
    const titleEl = document.getElementById("trackTitle");
    const playBtn = document.getElementById("playBtn");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const uiPrev  = document.getElementById("uiPrev");
    const uiNext  = document.getElementById("uiNext");
    const progressBar  = document.getElementById("progressBar");
    const progressFill = document.getElementById("progressFill");
    const progressKnob = document.getElementById("progressKnob");
    const currTimeEl = document.getElementById("currTime");
    const totalTimeEl = document.getElementById("totalTime");
    const playlistEl  = document.getElementById("playlistEl");
    const sheet       = document.getElementById("sheet");
    const openPicker  = document.getElementById("openPicker");
    const closePicker = document.getElementById("closePicker");

    // ====== Estado ======
    let player, playerReady=false;
    let index=0, isPlaying=false, pollId=null;

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
      loadTrack(0);
      updateButtons();
    }

    // ====== UI ======
    function formatTime(s){ if(!Number.isFinite(s)) return "0:00"; const m=Math.floor(s/60), r=Math.floor(s%60); return `${m}:${r.toString().padStart(2,"0")}` }
    function segDur(seg){ return Math.max(0,(seg.end - seg.start) || 0) }

    function renderPlaylist(){
      playlistEl.innerHTML = "";
      segments.forEach((t,i)=>{
        const el = document.createElement("div");
        el.className = "track";
        el.innerHTML = `
          <div class="tcover"><img src="./assets/img/chuva_ 1 (1).png" alt=""></div>
          <div class="tmain"><div class="tname">${t.title}</div><div class="tartist">YouTube</div></div>
          <div class="tdur">${formatTime(segDur(t))}</div>`;
        el.addEventListener("click", ()=>{ loadTrack(i); play(); hideSheet(); });
        playlistEl.appendChild(el);
      });
      highlightActive();
    }
    function highlightActive(){ [...playlistEl.children].forEach((el,i)=> el.classList.toggle("active", i===index)); }
    function updateButtons(){ playBtn.textContent = isPlaying ? "⏸ Pausar" : "▶ Tocar"; }

    // ====== Faixa ======
    function loadTrack(i){
      if(!playerReady) return;
      index = (i + segments.length) % segments.length;
      const seg = segments[index];
      titleEl.textContent = seg.title;
      totalTimeEl.textContent = formatTime(segDur(seg));
      highlightActive();
      player.seekTo(seg.start, true);
      if(isPlaying) startPoll();
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
    uiPrev .addEventListener("click", ()=>{ loadTrack(index-1); play(); });
    uiNext .addEventListener("click", ()=>{ loadTrack(index+1); play(); });

    // Progresso / auto next
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
    function stopPoll(){ if(pollId){ clearInterval(pollId); pollId=null } }

    function updateProgressUI(absTime){
      const seg = segments[index];
      const rel = Math.max(0, Math.min((absTime - seg.start)/segDur(seg), 1));
      progressFill.style.width = `${rel*100}%`;
      progressKnob.style.left = `${rel*100}%`;
      currTimeEl.textContent = formatTime(rel * segDur(seg));
    }

    // Seek
    progressBar.addEventListener("click", (e)=>{
      if(!playerReady) return;
      const rect = progressBar.getBoundingClientRect();
      const ratio = Math.min(Math.max((e.clientX - rect.left)/rect.width, 0), 1);
      const seg = segments[index];
      const target = seg.start + ratio * segDur(seg);
      player.seekTo(target, true);
      if(isPlaying) startPoll();
    });

    // Picker
    function showSheet(){ sheet.style.display = "flex"; }
    function hideSheet(){ sheet.style.display = "none"; }
    openPicker.addEventListener("click", showSheet);
    closePicker.addEventListener("click", hideSheet);
    sheet.addEventListener("click", (e)=>{ if(e.target===sheet) hideSheet(); });

    // Dock
    function setActive(el){ document.querySelectorAll('.dock-icon').forEach(i=>i.classList.remove('active')); el.classList.add('active'); }
    window.setActive = setActive;