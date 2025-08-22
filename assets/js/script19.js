    function goBack() { window.history.back(); }
    function setActive(el, page) {
      document.querySelectorAll('.dock-icon').forEach(icon => icon.classList.remove('active'));
      el.classList.add('active');
      if(page) window.location.href = page;
    }