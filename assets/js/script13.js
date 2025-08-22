    function setActive(el) {
      document.querySelectorAll('.dock-icon').forEach(icon => {
        icon.classList.remove('active');
      });
      el.classList.add('active');
    }
    function goBack() {
      window.history.back();
    }
    // Hover e click highlight nos cards (opcional)
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.card-pausa').forEach(card => {
        card.addEventListener('click', function() {
          document.querySelectorAll('.card-pausa').forEach(c => c.classList.remove('active'));
          this.classList.add('active');
        });
      });
    });
        // Navegação de cada item
    document.querySelectorAll('.history-item').forEach(item=>{
      item.addEventListener('click',()=>{
        const d=item.dataset.date;
        window.location.href=`historico-detalhe.html?d=${d}`;
      });
    });

    // Busca por texto (data visível)
    const inputBusca=document.getElementById('busca');
    inputBusca.addEventListener('input',()=>{
      const termo=inputBusca.value.trim().toLowerCase();
      document.querySelectorAll('.history-item .date').forEach(el=>{
        const box=el.closest('.history-item');
        box.style.display=el.textContent.toLowerCase().includes(termo)?'flex':'none';
      });
    });

    // Active visual + rotas do dock
    function setActive(el){
      document.querySelectorAll('.dock-icon').forEach(i=>i.classList.remove('active'));
      el.classList.add('active');
    }
    const dockIcons=document.querySelectorAll('.dock-icon');
    if(dockIcons.length>=5){
      dockIcons[0].addEventListener('click',()=>{window.location.href='telainicial.html';});
      dockIcons[1].addEventListener('click',()=>{window.location.href='intervencoes.html';});
      dockIcons[2].addEventListener('click',()=>{window.location.href='historico.html';});
      dockIcons[3].addEventListener('click',()=>{window.location.href='dados.html';});
      dockIcons[4].addEventListener('click',()=>{window.location.href='perfil.html';});
    }