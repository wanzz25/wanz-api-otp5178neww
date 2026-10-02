(function () {
  if (location.pathname === '/profile') return;

  var st = document.createElement('style');
  st.textContent =
    '#wz-prof{display:inline-flex;align-items:center;gap:.5rem;height:36px;padding:0 .8rem 0 .3rem;border:1px solid #3a3a3c;border-radius:99px;background:#242426;color:#f4f4f5;font:500 13px Outfit,system-ui,sans-serif;text-decoration:none;white-space:nowrap;flex:none}' +
    '#wz-prof:hover{border-color:#9ca3af}#wz-prof:focus-visible{outline:2px solid #e5e5e5;outline-offset:2px}' +
    '#wz-prof .wz-av{width:28px;height:28px;border-radius:50%;background:#3a3a3c;display:grid;place-items:center;font-weight:600;overflow:hidden}' +
    '#wz-prof .wz-av img{width:100%;height:100%;object-fit:cover;display:block}' +
    '#wz-prof.out{padding:0 .9rem}#wz-prof.out .wz-av{display:none}' +
    '@media(max-width:480px){#wz-prof:not(.out) .wz-name{display:none}#wz-prof:not(.out){padding:0 .3rem}}' +
    '#wz-prof-fix{position:fixed;top:12px;right:12px;z-index:60}';
  document.head.appendChild(st);

  var a = document.createElement('a');
  a.id = 'wz-prof';
  a.href = '/profile';
  a.className = 'out';
  a.setAttribute('aria-label', 'Profil');
  a.innerHTML = '<span class="wz-av"></span><span class="wz-name">Masuk</span>';

  var bar = document.querySelector('header > div');
  if (bar && bar.children.length >= 2) {
    var right = bar.lastElementChild, w = document.createElement('div');
    w.style.cssText = 'display:flex;align-items:center;gap:.75rem';
    bar.insertBefore(w, right);
    w.appendChild(right);
    w.appendChild(a);
  } else if (bar) {
    bar.appendChild(a);
  } else {
    var f = document.createElement('div');
    f.id = 'wz-prof-fix';
    f.appendChild(a);
    document.body.appendChild(f);
  }

  fetch('/auth/me', { credentials: 'same-origin' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.user) return;
      a.className = '';
      var name = d.user.name || 'Profil';
      a.querySelector('.wz-name').textContent = name.split(' ')[0];
      var av = a.querySelector('.wz-av');
      if (d.user.picture) {
        var im = new Image();
        im.referrerPolicy = 'no-referrer';
        im.alt = '';
        im.src = d.user.picture;
        av.appendChild(im);
      } else {
        av.textContent = name.charAt(0).toUpperCase();
      }
    })
    .catch(function () {});
})();
