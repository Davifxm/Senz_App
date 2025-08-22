    function setActive(el) {
      document.querySelectorAll('.dock-icon').forEach(icon => icon.classList.remove('active'));
      el.classList.add('active');
    }
    function goBack() {
      window.history.back();
    }
    // Adiciona rotas no dock
    const dockIcons = document.querySelectorAll('.dock-icon');
    if(dockIcons.length >= 5){
      dockIcons[0].addEventListener('click', ()=>{window.location.href='telainicial.html';});
      dockIcons[1].addEventListener('click', ()=>{window.location.href='intervencoes.html';});
      dockIcons[2].addEventListener('click', ()=>{window.location.href='historico.html';});
      dockIcons[3].addEventListener('click', ()=>{window.location.href='dados.html';});
      dockIcons[4].addEventListener('click', ()=>{window.location.href='perfil.html';});
    }