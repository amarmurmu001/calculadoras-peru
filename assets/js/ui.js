/* ==========================================================================
   ui.js — Navegación, panel de parámetros, anuncios y mejoras de interfaz
   ========================================================================== */
(function () {
  'use strict';

  /* ==========================================================================
     ⚙️  CONFIGURACIÓN DE GOOGLE ADSENSE
     --------------------------------------------------------------------------
     1) Reemplaza 'ca-pub-0000000000000000' por tu ID de editor real.
     2) Reemplaza cada número de slot por el ID de bloque que crees en AdSense.
     3) Deja client vacío ('') mientras tu cuenta no esté aprobada: el sitio
        mostrará un espacio etiquetado en lugar de anuncios.
     ========================================================================== */
  window.PE_ADS = {
    client: 'ca-pub-0000000000000000',
    slots: {
      header: '0000000001',
      inArticle: '0000000002',
      sidebar: '0000000003',
      footer: '0000000004'
    }
  };

  var ADS_READY = false;

  function cargarAdSense() {
    if (ADS_READY) return;
    var cfg = window.PE_ADS || {};
    if (!cfg.client || /0000000000/.test(cfg.client)) return;
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + cfg.client;
    document.head.appendChild(s);
    ADS_READY = true;
  }

  function pintarAnuncios() {
    var slots = document.querySelectorAll('.ad-slot');
    if (!slots.length) return;
    var cfg = window.PE_ADS || {};
    var activo = cfg.client && !/0000000000/.test(cfg.client);
    Array.prototype.forEach.call(slots, function (slot, i) {
      if (slot.getAttribute('data-ad-ready') === '1') return;
      var nombre = slot.getAttribute('data-ad') || 'header';
      slot.setAttribute('data-ad-ready', '1');
      var slotId = (cfg.slots && cfg.slots[nombre]) || cfg.slots.header;
      if (activo && slotId) {
        slot.innerHTML = '<ins class="adsbygoogle" style="display:block;width:100%" ' +
          'data-ad-client="' + cfg.client + '" data-ad-slot="' + slotId + '" ' +
          'data-ad-format="auto" data-full-width-responsive="true"></ins>' +
          '<span class="ad-label">Publicidad</span>';
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
      } else {
        slot.innerHTML = '<span class="ad-label">Espacio publicitario</span>';
      }
    });
  }

  /* ------------------------------- Navegación ------------------------------ */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('main-nav') || document.querySelector('.main-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  /* --------------------------- Panel de parámetros ------------------------- */
  function initPanel() {
    var cont = document.getElementById('panel-parametros');
    if (!cont) return;
    var c = window.PE_CONFIG;
    cont.innerHTML =
      '<details class="acc">' +
      '<summary>Ajustar parámetros vigentes (UIT, RMV, comisiones AFP)</summary>' +
      '<div class="acc-body">' +
      '<p class="small">Estos valores cambian cada año. Si conoces los del año en curso, actualízalos aquí: se guardarán en tu navegador y se aplicarán a todas las calculadoras.</p>' +
      '<div class="grid cols-2">' +
      '<div class="field"><label for="cfgUit">Valor de la UIT (S/)</label><input type="number" id="cfgUit" step="50" min="0" value="' + c.uit + '"></div>' +
      '<div class="field"><label for="cfgRmv">Remuneración Mínima Vital (S/)</label><input type="number" id="cfgRmv" step="10" min="0" value="' + c.rmv + '"></div>' +
      '</div>' +
      '<div class="btn-row">' +
      '<button type="button" class="btn" id="cfgGuardar">Guardar parámetros</button>' +
      '<button type="button" class="btn secondary" id="cfgReiniciar">Restaurar valores por defecto</button>' +
      '</div>' +
      '<p class="small muted mb-0" id="cfgMsg" style="margin-top:10px"></p>' +
      '</div></details>';

    cont.querySelector('#cfgGuardar').addEventListener('click', function () {
      var uit = parseFloat(cont.querySelector('#cfgUit').value);
      var rmv = parseFloat(cont.querySelector('#cfgRmv').value);
      var p = {};
      if (uit > 0) p.uit = uit;
      if (rmv > 0) p.rmv = rmv;
      window.PE_SAVE_CONFIG(p);
      if (p.uit) window.PE_CONFIG.uit = p.uit;
      if (p.rmv) window.PE_CONFIG.rmv = p.rmv;
      cont.querySelector('#cfgMsg').textContent = '✅ Parámetros guardados. Vuelve a calcular para ver los nuevos resultados.';
      document.querySelectorAll('form[data-calc]').forEach(function (f) {
        if (window.PE) window.PE.calcular(f.getAttribute('data-calc'));
      });
    });
    cont.querySelector('#cfgReiniciar').addEventListener('click', function () {
      window.PE_RESET_CONFIG();
      location.reload();
    });
  }

  /* --------------------------- Año dinámico / lugar ------------------------ */
  function initAnio() {
    var anio = new Date().getFullYear();
    document.querySelectorAll('[data-anio]').forEach(function (el) { el.textContent = el.getAttribute('data-anio') || anio; });
  }

  /* ------------------------------ Compartir ------------------------------- */
  function initShare() {
    var btn = document.getElementById('btnCompartir');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var data = { title: document.title, url: location.href };
      if (navigator.share) { navigator.share(data).catch(function () {}); return; }
      navigator.clipboard.writeText(location.href).then(function () {
        var t = btn.textContent;
        btn.textContent = '¡Enlace copiado!';
        setTimeout(function () { btn.textContent = t; }, 1800);
      }).catch(function () {});
    });
  }

  /* ---------------------------- Año en el footer -------------------------- */
  function initFooterAnio() {
    var el = document.getElementById('anioActual');
    if (el) el.textContent = new Date().getFullYear();
  }

  function init() {
    initNav();
    initPanel();
    initAnio();
    initShare();
    initFooterAnio();
    cargarAdSense();
    pintarAnuncios();
    // Reintenta por si algún ad-slot se añade después
    setTimeout(pintarAnuncios, 600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
