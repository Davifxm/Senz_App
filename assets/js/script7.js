    function setActive(el) {
      document.querySelectorAll('.dock-icon').forEach(icon => {
        icon.classList.remove('active');
      });
      el.classList.add('active');
    }