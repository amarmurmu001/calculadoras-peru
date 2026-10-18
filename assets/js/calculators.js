/* ==========================================================================
   calculators.js — Motor de cálculo de las calculadoras laborales del Perú
   Todas las fórmulas siguen la normativa laboral peruana:
   D.S. 001-97-TR (CTS), Ley 27735 (gratificaciones), D.Leg. 892 (utilidades),
   D.S. 003-97-TR (despido), D.Leg. 713 (vacaciones), Ley 26582 (horas extras),
   TUO LIR (renta 5ta categoría) y reglas de la SBS para AFP/ONP.
   ========================================================================== */
(function () {
  'use strict';

  var C = function () { return window.PE_CONFIG; };

  /* ------------------------------- Utilidades ------------------------------ */
  var NF = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var NF0 = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });

  function num(id, def) {
    var el = document.getElementById(id);
    if (!el) return typeof def === 'number' ? def : 0;
    var v = parseFloat(String(el.value).replace(/\s/g, '').replace(',', '.'));
    return isNaN(v) ? (typeof def === 'number' ? def : 0) : v;
  }
  function checked(id) { var el = document.getElementById(id); return !!(el && el.checked); }
  function val(id, def) { var el = document.getElementById(id); return el ? el.value : (def || ''); }
  function money(n) { return 'S/ ' + NF.format(round2(n || 0)); }
  function pct(n) { return NF.format(n || 0) + '%'; }
  function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function diffFechas(desde, hasta) {
    var d1 = new Date(desde + 'T12:00:00'), d2 = new Date(hasta + 'T12:00:00');
    if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) return null;
    var y = d2.getFullYear() - d1.getFullYear();
    var m = d2.getMonth() - d1.getMonth();
    var d = d2.getDate() - d1.getDate();
    if (d < 0) { m -= 1; d += 30; }
    if (m < 0) { y -= 1; m += 12; }
    return { anios: y, meses: m, dias: d, totalMeses: y * 12 + m, totalDias: (y * 12 + m) * 30 + d };
  }

  /* ------------------------ Impuesto a la Renta (5ta) ---------------------- */
  function tramosRenta(uit) {
    var prev = 0, out = [];
    C().renta5ta.forEach(function (b) {
      var lim = (b.hastaUit === Infinity) ? Infinity : b.hastaUit * uit;
      out.push({ desde: prev, hasta: lim, tasa: b.tasa, hastaUit: b.hastaUit });
      prev = lim;
    });
    return out;
  }

  /** Impuesto anual sobre una base imponible ya neta de la deducción de 7 UIT */
  function impuestoRentaAnual(base, uit) {
    var res = { total: 0, tramos: [] };
    if (!(base > 0)) return res;
    var restante = base;
    tramosRenta(uit).forEach(function (t) {
      if (restante <= 0) return;
      var ancho = (t.hasta === Infinity) ? restante : (t.hasta - t.desde);
      var gravado = Math.min(restante, ancho);
      if (gravado > 0) {
        var imp = gravado * t.tasa;
        res.total += imp;
        res.tramos.push({ desde: t.desde, hasta: t.hasta, tasa: t.tasa, gravado: gravado, impuesto: imp });
        restante -= gravado;
      }
    });
    return res;
  }

  /**
   * Retención mensual de renta de 5ta categoría.
   * Proyección anual = remuneraciones afectas + gratificaciones, menos 7 UIT.
   */
  function retencion5ta(opts) {
    var uit = C().uit;
    var brutoMensual = opts.brutoMensual || 0;
    var meses = opts.meses || 12;
    var gratificaciones = opts.incluyeGratificacion ? brutoMensual * 2 : 0;
    var otrosAnual = opts.otrosAnual || 0;
    var deduccion = C().deduccionUit * uit;
    var rentaBrutaAnual = brutoMensual * meses + gratificaciones + otrosAnual;
    var base = Math.max(0, rentaBrutaAnual - deduccion);
    var imp = impuestoRentaAnual(base, uit);
    return {
      rentaBrutaAnual: rentaBrutaAnual,
      deduccion: deduccion,
      base: base,
      impuestoAnual: imp.total,
      retencionMensual: imp.total / 12,
      tramos: imp.tramos,
      uit: uit
    };
  }

  /* --------------------------------- AFP ---------------------------------- */
  function afpDescuento(rem, comisionPct, seguroPct) {
    var c = C();
    var tope = c.maxRemAsegurableUit * c.uit;
    var base = Math.min(rem, tope);
    var excedeTope = rem > tope;
    return {
      base: base,
      excedeTope: excedeTope,
      tope: tope,
      fondo: base * c.aporteObligatorioAfp,
      comision: base * (comisionPct / 100),
      seguro: base * (seguroPct / 100),
      total: base * (c.aporteObligatorioAfp + comisionPct / 100 + seguroPct / 100)
    };
  }

  /* ---------------------------- Render de resultados ----------------------- */
  function pintar(html) {
    var out = document.getElementById('resultado');
    if (!out) return;
    out.innerHTML = html;
    out.hidden = false;
    out.setAttribute('tabindex', '-1');
    if (out.scrollIntoView) out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function bloque(titulo, etiqueta, valor, filas, notas, extra) {
    var rows = filas.map(function (f) {
      if (f.sep) return '<tr class="total-row"><td colspan="2"></td></tr>';
      return '<tr' + (f.total ? ' class="total-row"' : '') + '>' +
        '<td>' + f.label + (f.sub ? '<br><span class="small muted">' + f.sub + '</span>' : '') + '</td>' +
        '<td class="' + (f.tipo || '') + '">' + f.valor + '</td></tr>';
    }).join('');
    var nt = (notas && notas.length) ? '<div class="note info">' + notas.map(function (n) { return '<p>' + n + '</p>'; }).join('') + '</div>' : '';
    pintar(
      '<h2>' + titulo + '</h2>' +
      (etiqueta ? '<div class="result-total-label">' + etiqueta + '</div>' : '') +
      (valor != null ? '<div class="result-total">' + valor + '</div>' : '') +
      '<table class="breakdown"><thead><tr><th>Concepto</th><th>Monto</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      (extra || '') + nt
    );
  }

  function err(msg) { pintar('<h2>Revisa los datos</h2><div class="note warn"><p>' + msg + '</p></div>'); }

  /* ==========================================================================
     Rutas registradas
     ========================================================================== */
  var rutas = {};

  /* ------------------------------ 1. SUELDO NETO --------------------------- */
  rutas.sueldo = function () {
    var basico = num('basico');
    var otros = num('otrosIngresos');
    var asignacion = checked('asignacionFamiliar') ? C().rmv * C().asignacionFamiliar : 0;
    var bruto = basico + otros + asignacion;
    if (bruto <= 0) return err('Ingresa un sueldo bruto mayor a cero.');

    var regimen = val('regimen', 'afp');
    var incluyeGrat = checked('incluyeGratificacion');
    var otrosDesc = num('otrosDescuentos');
    var filas = [], descPension = 0, descRenta = 0;

    filas.push({ label: 'Sueldo básico', valor: money(basico) });
    if (asignacion > 0) filas.push({ label: 'Asignación familiar (10% RMV)', valor: money(asignacion) });
    if (otros > 0) filas.push({ label: 'Otros ingresos afectos', valor: money(otros) });
    filas.push({ label: 'Remuneración bruta mensual', valor: money(bruto), total: true });

    if (regimen === 'afp') {
      var key = val('afp', 'prima');
      var com = num('afpComision', C().afp[key] ? C().afp[key].flujo : 1.6);
      var seg = num('afpSeguro', C().afp[key] ? C().afp[key].seguro : 1.35);
      var d = afpDescuento(bruto, com, seg);
      descPension = d.total;
      filas.push({ label: 'Aporte al fondo de pensiones (10%)', sub: 'Afecto a renta, no es descuento perdido: va a tu cuenta', valor: '− ' + money(d.fondo), tipo: 'minus' });
      filas.push({ label: 'Comisión de la AFP (' + pct(com) + ')', valor: '− ' + money(d.comision), tipo: 'minus' });
      filas.push({ label: 'Prima de seguro invalidez/sobrevivencia (' + pct(seg) + ')', valor: '− ' + money(d.seguro), tipo: 'minus' });
      if (d.excedeTope) filas.push({ label: 'Tope de 10 UIT aplicado', sub: 'Base afecta: ' + money(d.tope), valor: money(d.base), tipo: '' });
    } else if (regimen === 'onp') {
      var topeOnp = C().maxRemAsegurableUit * C().uit;
      var baseOnp = Math.min(bruto, topeOnp);
      descPension = baseOnp * C().onp;
      filas.push({ label: 'Aporte ONP (13%)', sub: 'Sistema Nacional de Pensiones', valor: '− ' + money(descPension), tipo: 'minus' });
    }

    var r5 = retencion5ta({ brutoMensual: bruto, incluyeGratificacion: incluyeGrat });
    descRenta = r5.retencionMensual;
    if (descRenta > 0) {
      filas.push({
        label: 'Retención renta 5ta categoría (estimada)',
        sub: 'Renta anual proyectada ' + money(r5.rentaBrutaAnual) + ' − 7 UIT (' + money(r5.deduccion) + ')',
        valor: '− ' + money(descRenta), tipo: 'minus'
      });
    }
    if (otrosDesc > 0) filas.push({ label: 'Otros descuentos (préstamos, adelantos, etc.)', valor: '− ' + money(otrosDesc), tipo: 'minus' });

    var neto = bruto - descPension - descRenta - otrosDesc;
    var aporteEmpleador = bruto * C().essalud;

    var notas = [];
    notas.push('<strong>Aporte del empleador:</strong> además de tu sueldo, tu empleador paga <strong>' + money(aporteEmpleador) + '</strong> a EsSalud (9%), que no se descuenta de tu remuneración.');
    if (regimen === 'afp') notas.push('El 10% de aporte obligatorio <strong>no es un descuento que pierdes</strong>: se abona a tu Cuenta Individual de Capitalización (CIC) en la AFP.');
    notas.push('La retención de renta de 5ta categoría es una <strong>proyección anual</strong>. Tu empleador la recalcula cada mes y la regulariza en julio y diciembre.');

    bloque('Resultado: sueldo neto mensual', 'Te depositan aproximadamente', money(neto), filas, notas,
      '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-k">Bruto mensual</div><div class="stat-v">' + money(bruto) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Total descuentos</div><div class="stat-v">' + money(descPension + descRenta + otrosDesc) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Neto mensual</div><div class="stat-v">' + money(neto) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Costo total empleador</div><div class="stat-v">' + money(bruto + aporteEmpleador) + '</div></div>' +
      '</div>');
  };

  /* --------------------------------- 2. CTS -------------------------------- */
  rutas.cts = function () {
    var basico = num('basico');
    var regulares = num('regulares');
    var asignacion = checked('asignacionFamiliar') ? C().rmv * C().asignacionFamiliar : 0;
    var alimenta = checked('alimentacion') ? C().rmv / 3 : 0;
    var meses = Math.min(6, Math.max(0, num('meses')));
    var dias = Math.min(29, Math.max(0, num('dias')));
    var incluyeGrat = checked('incluyeGratificacion');

    if (basico <= 0) return err('Ingresa el sueldo básico.');
    if (meses === 0 && dias === 0) return err('Ingresa al menos un mes o un día trabajado en el semestre.');

    var rc = basico + regulares + asignacion + alimenta;
    var grat = rc; // la gratificación computable suele equivaler a la remuneración computable
    var cts = (rc / 12) * meses + (rc / 360) * dias;
    if (incluyeGrat) cts += (grat / 6) * (meses / 6) + (grat / 180) * dias;

    var filas = [
      { label: 'Sueldo básico', valor: money(basico) },
      { label: 'Remuneraciones regulares', valor: money(regulares) }
    ];
    if (asignacion > 0) filas.push({ label: 'Asignación familiar (10% RMV)', valor: money(asignacion) });
    if (alimenta > 0) filas.push({ label: 'Alimentación principal en especie (1/3 RMV)', valor: money(alimenta) });
    filas.push({ label: 'Remuneración computable (RC)', valor: money(rc), total: true });
    filas.push({ label: 'CTS por ' + meses + ' mes(es) y ' + dias + ' día(s) — RC/12 × meses + RC/360 × días', valor: money((rc / 12) * meses + (rc / 360) * dias) });
    if (incluyeGrat) filas.push({ label: '1/6 de la última gratificación', sub: 'Incluido cuando el semestre ya generó gratificación', valor: money((grat / 6) * (meses / 6) + (grat / 180) * dias) });
    filas.push({ label: 'Total CTS a depositar', valor: money(cts), total: true });

    var notas = [
      '<strong>Fechas de depósito:</strong> hasta el <strong>15 de mayo</strong> (por el período noviembre–abril) y hasta el <strong>15 de noviembre</strong> (por el período mayo–octubre).',
      'La CTS <strong>no está afecta</strong> a descuentos de AFP, ONP, EsSalud ni renta de 5ta categoría.',
      'Puedes retirar libremente el <strong>100% de tu CTS</strong> mientras se mantenga vigente la disposición legal que lo autoriza. Verifica la vigencia del año en curso.',
      'El empleador debe depositar la CTS en la entidad financiera elegida por el trabajador dentro de los plazos. El incumplimiento genera intereses.'
    ];

    bloque('Resultado: CTS del semestre', 'Total estimado a depositar', money(cts), filas, notas,
      '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-k">Remuneración computable</div><div class="stat-v">' + money(rc) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Período</div><div class="stat-v">' + meses + ' mes(es), ' + dias + ' día(s)</div></div>' +
      '<div class="stat"><div class="stat-k">CTS total</div><div class="stat-v">' + money(cts) + '</div></div>' +
      '</div>');
  };

  /* --------------------------------- 3. AFP -------------------------------- */
  rutas.afp = function () {
    var bruto = num('bruto');
    if (bruto <= 0) return err('Ingresa tu remuneración bruta mensual.');
    var key = val('afp', 'prima');
    var com = num('afpComision', C().afp[key] ? C().afp[key].flujo : 1.6);
    var seg = num('afpSeguro', C().afp[key] ? C().afp[key].seguro : 1.35);
    var d = afpDescuento(bruto, com, seg);
    var neto = bruto - d.total;

    var filas = [
      { label: 'Remuneración bruta', valor: money(bruto) },
      { label: 'Base afecta (tope 10 UIT = ' + money(d.tope) + ')', valor: money(d.base) },
      { label: 'Aporte obligatorio al fondo (10%)', sub: 'Va a tu Cuenta Individual de Capitalización (CIC)', valor: '− ' + money(d.fondo), tipo: 'minus' },
      { label: 'Comisión de la AFP (' + pct(com) + ')', sub: 'Retribución de la AFP por administrar tu fondo', valor: '− ' + money(d.comision), tipo: 'minus' },
      { label: 'Prima de seguro de invalidez y sobrevivencia (' + pct(seg) + ')', valor: '− ' + money(d.seguro), tipo: 'minus' },
      { label: 'Total descontado por AFP', valor: money(d.total), total: true },
      { label: 'Sueldo neto (antes de renta de 5ta)', valor: money(neto), total: true }
    ];

    var anual = (d.fondo + d.comision + d.seguro) * 12;
    var comAnual = d.comision * 12, segAnual = d.seguro * 12;

    var notas = [
      '<strong>Solo la comisión y la prima de seguro son costo real</strong> para ti (' + money(d.comision + d.seguro) + ' al mes). El 10% de aporte obligatorio es tu dinero y forma tu fondo de pensiones.',
      'La <strong>remuneración máxima asegurable</strong> es de 10 UIT (' + money(d.tope) + '). Sobre el exceso no se calculan aportes ni comisiones.',
      'Las AFPs cobran una <strong>comisión por flujo</strong> (sobre tu remuneración) o una <strong>comisión mixta</strong> (parte sobre remuneración y parte sobre el saldo del fondo). Esta calculadora usa la comisión por flujo; si tienes comisión mixta, edita el porcentaje en "Ajustar parámetros".',
      'El aporte de AFP <strong>no está gravado</strong> por renta de 5ta categoría: se descuenta de la base imponible.'
    ];

    bloque('Resultado: descuento AFP', 'Descuento total de AFP al mes', money(d.total), filas, notas,
      '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-k">A tu fondo cada mes</div><div class="stat-v">' + money(d.fondo) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Costo AFP (comisión+seguro)</div><div class="stat-v">' + money(d.comision + d.seguro) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Costo AFP al año</div><div class="stat-v">' + money(comAnual + segAnual) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Aportado al fondo al año</div><div class="stat-v">' + money(d.fondo * 12) + '</div></div>' +
      '</div>');
  };

  /* --------------------------------- 4. ONP -------------------------------- */
  rutas.onp = function () {
    var bruto = num('bruto');
    if (bruto <= 0) return err('Ingresa tu remuneración bruta mensual.');
    var tope = C().maxRemAsegurableUit * C().uit;
    var base = Math.min(bruto, tope);
    var desc = base * C().onp;
    var neto = bruto - desc;
    var filas = [
      { label: 'Remuneración bruta', valor: money(bruto) },
      { label: 'Base afecta (tope 10 UIT = ' + money(tope) + ')', valor: money(base) },
      { label: 'Aporte ONP (13%)', valor: '− ' + money(desc), tipo: 'minus' },
      { label: 'Sueldo neto (antes de renta de 5ta)', valor: money(neto), total: true }
    ];
    bloque('Resultado: descuento ONP', 'Descuento mensual ONP', money(desc), filas, [
      'El aporte al Sistema Nacional de Pensiones (ONP) es del <strong>13% de la remuneración asegurable</strong>, con un tope de 10 UIT.',
      'A diferencia de la AFP, el aporte ONP <strong>no forma una cuenta individual</strong>: financia el sistema de reparto.',
      'El aporte ONP <strong>no está afecto</strong> a la renta de 5ta categoría.'
    ], '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-k">Descuento mensual</div><div class="stat-v">' + money(desc) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Al año</div><div class="stat-v">' + money(desc * 12) + '</div></div>' +
      '</div>');
  };

  /* ---------------------------- 5. GRATIFICACIÓN --------------------------- */
  rutas.gratificacion = function () {
    var rc = num('remComputable');
    var meses = Math.min(6, Math.max(0, num('meses')));
    var dias = Math.min(29, Math.max(0, num('dias')));
    var eps = val('seguro', 'essalud') === 'eps';
    if (rc <= 0) return err('Ingresa tu remuneración computable.');

    var grat = (rc / 6) * meses + (rc / 180) * dias;
    var tasaBonif = eps ? C().bonifExtraordinariaEps : C().bonifExtraordinaria;
    var bonif = grat * tasaBonif;
    var total = grat + bonif;

    var filas = [
      { label: 'Remuneración computable', valor: money(rc) },
      { label: 'Gratificación (' + meses + ' mes(es) y ' + dias + ' día(s))', sub: 'Equivalente a una remuneración por semestre completo', valor: money(grat) },
      { label: 'Bonificación extraordinaria (' + pct(tasaBonif * 100) + ')', sub: eps ? 'Afiliado a EPS (6.75%)' : 'Afiliado a EsSalud (9%)', valor: money(bonif) },
      { label: 'Total a recibir (bruto)', valor: money(total), total: true }
    ];

    bloque('Resultado: gratificación', 'Total bruto de la gratificación', money(total), filas, [
      'Se paga en <strong>julio</strong> (Fiestas Patrias) y en <strong>diciembre</strong> (Navidad), dentro de los primeros 15 días del mes.',
      'La <strong>bonificación extraordinaria del 9%</strong> equivale al aporte que el empleador habría pagado a EsSalud. Para afiliados a una <strong>EPS es 6.75%</strong>.',
      'La gratificación está <strong>afecta a renta de 5ta categoría</strong>, pero <strong>no</strong> a AFP, ONP ni EsSalud (los aportes previsionales ya se descontaron en el mes).',
      'La bonificación extraordinaria <strong>no está afecta</strong> a ningún descuento: se recibe íntegra.',
      'Afecta al cálculo de la CTS (1/6) y a la renta anual proyectada.'
    ], '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-k">Gratificación</div><div class="stat-v">' + money(grat) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Bonificación</div><div class="stat-v">' + money(bonif) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Total en el año (2 pagos)</div><div class="stat-v">' + money(total * 2) + '</div></div>' +
      '</div>');
  };

  /* ---------------------- 6. RENTA 5TA CATEGORÍA (anual) ------------------- */
  rutas.renta = function () {
    var brutoMensual = num('brutoMensual');
    var meses = num('meses', 12);
    var otrasRem = num('otrasRemuneraciones');
    var retenciones = num('retenciones');
    var incluyeGrat = checked('incluyeGratificacion');
    if (brutoMensual <= 0 && otrasRem <= 0) return err('Ingresa tus ingresos afectos.');

    var r = retencion5ta({ brutoMensual: brutoMensual, meses: meses, incluyeGratificacion: incluyeGrat, otrosAnual: otrasRem });
    var saldo = r.impuestoAnual - retenciones;

    var filas = [
      { label: 'Remuneraciones del año (' + money(brutoMensual) + ' × ' + meses + ')', valor: money(brutoMensual * meses) },
      { label: 'Gratificaciones (2 por año)', valor: money(incluyeGrat ? brutoMensual * 2 : 0) },
      { label: 'Otras rentas de 5ta afectas', valor: money(otrasRem) },
      { label: 'Renta bruta anual', valor: money(r.rentaBrutaAnual), total: true },
      { label: 'Deducción de 7 UIT (' + money(r.uit) + ' × 7)', valor: '− ' + money(r.deduccion), tipo: 'minus' },
      { label: 'Renta neta imponible', valor: money(r.base), total: true }
    ];

    r.tramos.forEach(function (t) {
      var etiqueta = t.hasta === Infinity ? 'Más de ' + NF0.format(t.desde / r.uit) + ' UIT' : NF0.format(t.desde / r.uit) + ' a ' + NF0.format(t.hasta / r.uit) + ' UIT';
      filas.push({ label: etiqueta + ' × ' + pct(t.tasa * 100), sub: 'Base gravada: ' + money(t.gravado), valor: money(t.impuesto) });
    });

    filas.push({ label: 'Impuesto a la renta anual', valor: money(r.impuestoAnual), total: true });
    filas.push({ label: 'Retenciones ya efectuadas', valor: '− ' + money(retenciones), tipo: 'minus' });
    filas.push({ label: saldo >= 0 ? 'Saldo por pagar / a retener' : 'Saldo a favor del trabajador', valor: money(Math.abs(saldo)), total: true });

    bloque('Resultado: Impuesto a la Renta 5ta categoría', 'Impuesto anual calculado', money(r.impuestoAnual), filas, [
      'Los tramos se aplican <strong>de forma acumulativa</strong>: cada porcentaje aplica solo sobre la parte de la renta que cae dentro del tramo.',
      'La <strong>deducción de 7 UIT</strong> equivale a ' + money(r.deduccion) + ' con la UIT de ' + money(r.uit) + '.',
      'La retención mensual aproximada es de <strong>' + money(r.retencionMensual) + '</strong> (' + money(r.impuestoAnual) + ' ÷ 12).',
      'La <strong>declaración anual</strong> se presenta en la SUNAT dentro del mes de abril del año siguiente (según el último dígito del RUC). Si el empleador retuvo de menos, pagas la diferencia; si retuvo de más, solicitas devolución.',
      'No olvides: si además trabajaste de forma independiente (recibos por honorarios) con retención del 8%, puedes <strong>pedir la devolución</strong> en tu declaración anual.'
    ], '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-k">Renta bruta anual</div><div class="stat-v">' + money(r.rentaBrutaAnual) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Deducción 7 UIT</div><div class="stat-v">' + money(r.deduccion) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Impuesto anual</div><div class="stat-v">' + money(r.impuestoAnual) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Retención mensual</div><div class="stat-v">' + money(r.retencionMensual) + '</div></div>' +
      '</div>');
  };

  /* ----------------------------- 7. HORAS EXTRAS --------------------------- */
  rutas.horasExtras = function () {
    var sueldo = num('sueldo');
    var horasDia = num('horasPorDia', C().jornadaHorasDiarias);
    var cant = num('cantidadHoras');
    var conDescuentos = checked('aplicaDescuentos');
    if (sueldo <= 0) return err('Ingresa tu sueldo mensual.');
    if (cant <= 0) return err('Ingresa la cantidad de horas extra.');

    var valorHora = sueldo / 30 / horasDia;
    // Las 2 primeras horas del día al 25%; a partir de la 3ra, 35%.
    var primeras = Math.min(cant, 2);
    var siguientes = Math.max(0, cant - 2);
    var pagoPrimeras = primeras * valorHora * (1 + C().horasExtraPrimeras);
    var pagoSiguientes = siguientes * valorHora * (1 + C().horasExtraSiguientes);
    var totalExtra = pagoPrimeras + pagoSiguientes;
    var factorPromedio = totalExtra / cant / valorHora;

    var filas = [
      { label: 'Sueldo mensual', valor: money(sueldo) },
      { label: 'Valor hora ordinaria (sueldo ÷ 30 ÷ ' + horasDia + ')', valor: money(valorHora) },
      { label: 'Primeras 2 horas al +25% (' + primeras + ' h)', valor: money(pagoPrimeras) },
      { label: 'Horas adicionales al +35% (' + siguientes + ' h)', valor: money(pagoSiguientes) },
      { label: 'Pago total de horas extra', valor: money(totalExtra), total: true }
    ];

    var notas = [
      'La jornada ordinaria es de <strong>8 horas diarias o 48 semanales</strong> (Ley 26582). El sobretiempo se paga con recargo.',
      '<strong>Sobretasa:</strong> +25% por las dos primeras horas adicionales del día y +35% a partir de la tercera.',
      'Las horas extra <strong>sí son remuneración afecta</strong> a AFP/ONP, EsSalud y renta de 5ta categoría.',
      'El trabajo en <strong>día de descanso semanal o feriado</strong> se paga con sobretasa del 100% (equivale a una jornada adicional completa), no con este recargo.'
    ];

    if (conDescuentos) {
      var brutoTotal = sueldo + totalExtra;
      var regimen = val('regimenHE', 'afp');
      var desc = 0, detalle = '';
      if (regimen === 'afp') {
        var d = afpDescuento(brutoTotal, num('afpComisionHE', 1.6), num('afpSeguroHE', 1.35));
        desc = d.total; detalle = 'AFP';
      } else if (regimen === 'onp') {
        desc = Math.min(brutoTotal, C().maxRemAsegurableUit * C().uit) * C().onp; detalle = 'ONP';
      }
      var ret = retencion5ta({ brutoMensual: brutoTotal, incluyeGratificacion: true }).retencionMensual;
      filas.push({ label: 'Descuento previsional sobre el total (' + detalle + ')', valor: '− ' + money(desc), tipo: 'minus' });
      filas.push({ label: 'Retención renta 5ta sobre el total', valor: '− ' + money(ret), tipo: 'minus' });
      filas.push({ label: 'Neto con horas extra', valor: money(brutoTotal - desc - ret), total: true });
    }

    bloque('Resultado: horas extras', 'Pago bruto por horas extra', money(totalExtra), filas, notas,
      '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-k">Valor hora ordinaria</div><div class="stat-v">' + money(valorHora) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Factor promedio aplicado</div><div class="stat-v">×' + NF.format(factorPromedio) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Total horas extra</div><div class="stat-v">' + money(totalExtra) + '</div></div>' +
      '</div>');
  };

  /* ------------------------------ 8. VACACIONES ---------------------------- */
  rutas.vacaciones = function () {
    var rc = num('remComputable');
    var meses = Math.max(0, num('meses'));
    var dias = Math.max(0, num('dias'));
    var noGozadas = num('noGozadas');
    if (rc <= 0) return err('Ingresa tu remuneración computable.');

    var truncas = (rc / 12) * meses + (rc / 360) * dias;
    var noGoz = (rc / 30) * noGozadas;
    var total = truncas + noGoz;

    var filas = [
      { label: 'Remuneración computable', valor: money(rc) },
      { label: 'Vacaciones truncas (' + meses + ' mes(es) y ' + dias + ' día(s))', sub: 'RC/12 × meses + RC/360 × días', valor: money(truncas) },
      { label: 'Vacaciones no gozadas (' + noGozadas + ' día(s))', sub: 'RC/30 × días pendientes', valor: money(noGoz) },
      { label: 'Total por vacaciones', valor: money(total), total: true }
    ];

    bloque('Resultado: vacaciones truncas y no gozadas', 'Total a pagar', money(total), filas, [
      'El trabajador tiene derecho a <strong>30 días calendario de vacaciones</strong> por cada año completo de servicios (D.Leg. 713).',
      'Con <strong>6 meses de trabajo</strong> (record vacacional) ya se genera el derecho a vacaciones, que se pueden tomar de forma fraccionada.',
      'Las <strong>vacaciones truncas</strong> se pagan al cese por el tiempo no completado: RC/12 por mes y RC/360 por día.',
      'Las <strong>vacaciones no gozadas</strong> (vencidas o pendientes) se pagan de forma <strong>triple</strong> si el empleador incumplió el otorgamiento: la remuneración vacacional, la indemnización por no goce y una indemnización adicional.',
      'Las vacaciones están afectas a renta de 5ta categoría, pero <strong>no a AFP/ONP/EsSalud</strong> cuando corresponden a descanso efectivo.'
    ], '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-k">Truncas</div><div class="stat-v">' + money(truncas) + '</div></div>' +
      '<div class="stat"><div class="stat-k">No gozadas</div><div class="stat-v">' + money(noGoz) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Total</div><div class="stat-v">' + money(total) + '</div></div>' +
      '</div>');
  };

  /* ----------------------------- 9. LIQUIDACIÓN ---------------------------- */
  rutas.liquidacion = function () {
    var rc = num('remComputable');
    var ingreso = val('ingreso');
    var cese = val('cese');
    var vacNoGozadas = num('vacNoGozadas');
    var ctsDepositada = num('ctsDepositada');
    var motivo = val('motivo', 'renuncia');

    if (rc <= 0) return err('Ingresa tu remuneración computable.');
    if (!ingreso || !cese) return err('Selecciona las fechas de ingreso y de cese.');
    var dif = diffFechas(ingreso, cese);
    if (!dif) return err('La fecha de cese debe ser posterior a la fecha de ingreso.');

    // CTS trunca: desde el último depósito (último 15 de mayo/noviembre) o desde el ingreso
    var mesesCts = dif.totalMeses % 6;
    var diasCts = dif.dias;
    var ctsTrunca = (rc / 12) * mesesCts + (rc / 360) * diasCts + (rc / 6) * (mesesCts / 6) + (rc / 180) * diasCts;

    // Gratificación trunca: meses completos del semestre en curso
    var mesCese = new Date(cese + 'T12:00:00').getMonth() + 1;
    var semInicio = mesCese >= 7 ? 7 : 1;
    var mesesGrat = ((mesCese - semInicio) % 6) + (new Date(cese + 'T12:00:00').getDate() > 15 ? 0 : 0);
    mesesGrat = Math.max(0, mesCese - semInicio);
    var gratTrunca = (rc / 6) * mesesGrat + (rc / 180) * diasCts;
    var bonifGrat = gratTrunca * C().bonifExtraordinaria;

    // Vacaciones truncas
    var vacTruncas = (rc / 12) * dif.meses + (rc / 360) * dif.dias;
    var vacNoGoz = (rc / 30) * vacNoGozadas;

    // Indemnización por despido arbitrario
    var indemnizacion = 0;
    if (motivo === 'despido') {
      var anios = dif.anios + dif.meses / 12 + dif.dias / 360;
      indemnizacion = Math.min(rc * C().indemnizacionSueldosPorAnio * anios, rc * C().indemnizacionTopeSueldos);
    }

    var total = ctsTrunca + gratTrunca + bonifGrat + vacTruncas + vacNoGoz + indemnizacion;

    var filas = [
      { label: 'Remuneración computable', valor: money(rc) },
      { label: 'Tiempo de servicios', sub: dif.anios + ' año(s), ' + dif.meses + ' mes(es), ' + dif.dias + ' día(s)', valor: money(rc * (dif.totalMeses / 12)) },
      { label: 'CTS trunca del período', sub: 'Últimos ' + mesesCts + ' mes(es) y ' + diasCts + ' día(s)', valor: money(ctsTrunca) },
      { label: 'Gratificación trunca', valor: money(gratTrunca) },
      { label: 'Bonificación extraordinaria de grat. trunca (9%)', valor: money(bonifGrat) },
      { label: 'Vacaciones truncas', valor: money(vacTruncas) },
      { label: 'Vacaciones no gozadas (' + vacNoGozadas + ' días)', valor: money(vacNoGoz) }
    ];
    if (ctsDepositada > 0) filas.push({ label: 'CTS ya depositada (informativo)', valor: money(ctsDepositada) });
    if (indemnizacion > 0) filas.push({ label: 'Indemnización por despido arbitrario', sub: '1.5 sueldos por año, tope 12 sueldos', valor: money(indemnizacion) });
    filas.push({ label: 'Total de beneficios sociales a pagar al cese', valor: money(total), total: true });

    bloque('Resultado: liquidación de beneficios sociales', 'Total a recibir al cese', money(total), filas, [
      'La liquidación debe pagarse <strong>dentro de las 48 horas</strong> siguientes al cese.',
      'La <strong>CTS acumulada</strong> en el banco es independiente: retírala directamente de tu entidad financiera presentando tu DNI y la carta de cese.',
      motivo === 'despido'
        ? 'La <strong>indemnización por despido arbitrario</strong> es de 1.5 sueldos por año (tope 12 sueldos) para contratos a plazo indeterminado.'
        : 'Esta liquidación <strong>no incluye indemnización</strong> porque el cese fue por renuncia. Verifica si te corresponden beneficios adicionales por convenio colectivo.',
      'Los beneficios sociales <strong>no están afectos</strong> a AFP/ONP, salvo la renta de 5ta categoría que se calcula por separado.',
      'Al firmar la liquidación puedes dejar constancia de que <strong>te reservas el derecho</strong> de reclamar montos que consideres pendientes.'
    ], '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-k">Beneficios sociales</div><div class="stat-v">' + money(ctsTrunca + gratTrunca + bonifGrat + vacTruncas + vacNoGoz) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Indemnización</div><div class="stat-v">' + money(indemnizacion) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Total al cese</div><div class="stat-v">' + money(total) + '</div></div>' +
      '</div>');
  };

  /* ----------------------------- 10. UTILIDADES ---------------------------- */
  rutas.utilidades = function () {
    var actividad = val('actividad', 'industrial');
    var tasa = (C().utilidadesTasas[actividad] || C().utilidadesTasas.otras).tasa;
    var rentaAnual = num('rentaAnual');
    var diasTrabajador = Math.min(C().utilidadesMaxDias, Math.max(0, num('diasTrabajador')));
    var diasTotales = num('diasTotales');
    var remTrabajador = num('remTrabajador');
    var remTotales = num('remTotales');
    var sueldoMensual = num('sueldoMensual');

    if (rentaAnual <= 0) return err('Ingresa la renta anual antes de impuestos de la empresa.');
    if (diasTotales <= 0 || remTotales <= 0) return err('Ingresa los días y remuneraciones totales de todos los trabajadores.');
    if (diasTrabajador <= 0 && remTrabajador <= 0) return err('Ingresa tus días laborados o tu remuneración anual.');

    var repartoTotal = rentaAnual * tasa;
    var porDias = 0.5 * repartoTotal * (diasTrabajador / diasTotales);
    var porRem = 0.5 * repartoTotal * (remTrabajador / remTotales);
    var bruto = porDias + porRem;
    var tope = sueldoMensual > 0 ? sueldoMensual * C().utilidadesTopeSueldos : Infinity;
    var utilidad = Math.min(bruto, tope);
    var topeAplicado = bruto > tope;

    var filas = [
      { label: 'Renta anual antes de impuestos', valor: money(rentaAnual) },
      { label: 'Tasa de reparto — ' + (C().utilidadesTasas[actividad] || {}).nombre + ' (' + pct(tasa * 100) + ')', valor: money(repartoTotal) },
      { label: '50% por días laborados', sub: diasTrabajador + ' de ' + NF0.format(diasTotales) + ' días', valor: money(porDias) },
      { label: '50% proporcional a las remuneraciones', sub: money(remTrabajador) + ' de ' + money(remTotales), valor: money(porRem) },
      { label: 'Utilidad calculada', valor: money(bruto) }
    ];
    if (sueldoMensual > 0) {
      filas.push({ label: 'Tope legal (18 remuneraciones mensuales)', valor: money(tope) });
      if (topeAplicado) filas.push({ label: 'Utilidad a repartir (con tope aplicado)', valor: money(utilidad), total: true });
    }
    filas.push({ label: 'Utilidad a repartir', valor: money(utilidad), total: true });

    bloque('Resultado: participación en las utilidades', 'Te corresponde aproximadamente', money(utilidad), filas, [
      'La participación en las utilidades corresponde a los trabajadores de empresas que generan <strong>renta de tercera categoría</strong> y tienen más de 20 trabajadores.',
      '<strong>Tasas:</strong> 10% telecomunicaciones; 8% empresas industriales, mineras y de comercio/restaurantes; 5% pesqueras y otras actividades.',
      'El reparto es <strong>50% en proporción a los días laborados</strong> (máximo 180 días por trabajador) y <strong>50% en proporción a las remuneraciones</strong> percibidas.',
      'El <strong>tope por trabajador es de 18 remuneraciones mensuales</strong> promedio.',
      'El pago se realiza dentro de los <strong>30 días siguientes</strong> a la presentación de la Declaración Jurada Anual del Impuesto a la Renta (habitualmente hasta mediados de mayo).',
      'La utilidad está <strong>afecta a renta de 5ta categoría</strong> y no goza de inafectación previsional.'
    ], '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-k">Reparto total empresa</div><div class="stat-v">' + money(repartoTotal) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Por días</div><div class="stat-v">' + money(porDias) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Por remuneración</div><div class="stat-v">' + money(porRem) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Te corresponde</div><div class="stat-v">' + money(utilidad) + '</div></div>' +
      '</div>');
  };

  /* --------------------------- 11. INDEMNIZACIÓN --------------------------- */
  rutas.indemnizacion = function () {
    var sueldo = num('sueldo');
    var ingreso = val('ingreso');
    var cese = val('cese');
    var tipo = val('tipo', 'indeterminado');
    var mesesRestantes = num('mesesRestantes');
    if (sueldo <= 0) return err('Ingresa tu remuneración mensual.');
    if (!ingreso || !cese) return err('Selecciona las fechas de ingreso y cese.');
    var dif = diffFechas(ingreso, cese);
    if (!dif) return err('La fecha de cese debe ser posterior a la de ingreso.');

    var filas = [
      { label: 'Remuneración mensual', valor: money(sueldo) },
      { label: 'Tiempo de servicios', sub: dif.anios + ' año(s), ' + dif.meses + ' mes(es), ' + dif.dias + ' día(s)', valor: dif.anios + ' año(s) y ' + dif.meses + ' mes(es)' }
    ];

    var indemnizacion, detalle;
    if (tipo === 'indeterminado') {
      var anios = dif.anios + dif.meses / 12 + dif.dias / 360;
      var bruto = sueldo * C().indemnizacionSueldosPorAnio * anios;
      var tope = sueldo * C().indemnizacionTopeSueldos;
      indemnizacion = Math.min(bruto, tope);
      detalle = '1.5 sueldos por cada año completo; las fracciones se pagan en doceavos (tope 12 sueldos).';
      filas.push({ label: 'Cálculo proporcional', sub: '1.5 × ' + NF.format(anios) + ' año(s) × ' + money(sueldo), valor: money(bruto) });
      filas.push({ label: 'Tope legal (12 sueldos)', valor: money(tope) });
    } else {
      indemnizacion = sueldo * Math.max(1, mesesRestantes) * 1.5;
      detalle = 'Contrato a plazo fijo: 1.5 sueldos por cada mes que faltaba para el vencimiento del contrato.';
      filas.push({ label: 'Meses dejados de trabajar', valor: monthsText(mesesRestantes) });
      filas.push({ label: '1.5 × ' + money(sueldo) + ' × ' + NF.format(mesesRestantes) + ' mes(es)', valor: money(indemnizacion) });
    }
    filas.push({ label: 'Indemnización por despido arbitrario', valor: money(indemnizacion), total: true });

    bloque('Resultado: indemnización por despido', 'Monto estimado de la indemnización', money(indemnizacion), filas, [
      detalle,
      'La indemnización <strong>no está afecta</strong> a aportes previsionales ni a renta de 5ta categoría.',
      'Si el despido fue <strong>nulo</strong> (por discriminación, embarazo, libertad sindical, etc.) corresponde la <strong>reincorporación</strong> además de las remuneraciones devengadas.',
      'El plazo para reclamar judicialmente una indemnización es de <strong>30 días desde el cese</strong> si el despido fue nulo; en otros casos aplican plazos de prescripción de 4 años.',
      'Además de la indemnización, al cese te corresponden tus <strong>beneficios sociales</strong> (CTS trunca, gratificación trunca y vacaciones).'
    ], '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-k">Sueldo</div><div class="stat-v">' + money(sueldo) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Indemnización</div><div class="stat-v">' + money(indemnizacion) + '</div></div>' +
      '</div>');
  };

  function monthsText(n) {
    var entero = Math.floor(n), dec = n - entero;
    var dias = Math.round(dec * 30);
    return entero + ' mes(es)' + (dias > 0 ? ' y ' + dias + ' día(s)' : '');
  }

  /* --------------------------- 12. COSTO EMPLEADOR ------------------------- */
  rutas.costoLaboral = function () {
    var bruto = num('bruto');
    if (bruto <= 0) return err('Ingresa la remuneración bruta mensual.');
    var essalud = bruto * C().essalud;
    var cts = bruto / 12;
    var grat = bruto / 6;
    var bonif = grat * C().bonifExtraordinaria;
    var vacaciones = bruto / 12;
    var totalMensual = bruto + essalud + cts + grat + bonif + vacaciones;

    var filas = [
      { label: 'Remuneración bruta', valor: money(bruto) },
      { label: 'EsSalud (9%)', valor: money(essalud) },
      { label: 'Provisión CTS (1/12 mensual)', valor: money(cts) },
      { label: 'Provisión gratificación (1/6 mensual)', valor: money(grat) },
      { label: 'Bonificación extraordinaria (9% de la gratificación)', valor: money(bonif) },
      { label: 'Provisión vacaciones (1/12 mensual)', valor: money(vacaciones) },
      { label: 'Costo mensual real del trabajador', valor: money(totalMensual), total: true },
      { label: 'Costo anual', valor: money(totalMensual * 12), total: true }
    ];

    bloque('Resultado: costo real para el empleador', 'Costo mensual total', money(totalMensual), filas, [
      'El costo real es superior al sueldo bruto: incluye EsSalud y las provisiones de CTS, gratificaciones y vacaciones.',
      'La <strong>Asignación Familiar</strong> (10% de la RMV por hijo) también la paga el empleador, no se descuenta del trabajador.',
      'Encontramos el costo en <strong>' + NF.format(totalMensual / bruto) + ' veces</strong> el sueldo bruto.'
    ], '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-k">Bruto</div><div class="stat-v">' + money(bruto) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Costo mensual</div><div class="stat-v">' + money(totalMensual) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Costo anual</div><div class="stat-v">' + money(totalMensual * 12) + '</div></div>' +
      '</div>');
  };

  /* ---------------------- 13. CTS vs AFP (retiro de fondo) ----------------- */
  rutas.aportesAnuales = function () {
    var bruto = num('bruto');
    var años = num('anios', 1);
    var com = num('comision', 1.6);
    var seg = num('seguro', 1.35);
    var rentabilidad = num('rentabilidad', 5);
    if (bruto <= 0) return err('Ingresa tu remuneración bruta mensual.');
    var d = afpDescuento(bruto, com, seg);
    var meses = años * 12;
    var aporteTotal = d.fondo * meses;
    var costoTotal = (d.comision + d.seguro) * meses;
    var saldo = 0, r = rentabilidad / 100 / 12;
    for (var i = 0; i < meses; i++) { saldo = (saldo + d.fondo) * (1 + r); }
    var ganancia = saldo - aporteTotal;

    var filas = [
      { label: 'Remuneración bruta', valor: money(bruto) },
      { label: 'Aporte mensual al fondo (10%)', valor: money(d.fondo) },
      { label: 'Meses de aporte', valor: NF0.format(meses) },
      { label: 'Total aportado al fondo', valor: money(aporteTotal), total: true },
      { label: 'Comisiones y seguros pagados', valor: money(costoTotal), tipo: 'minus' },
      { label: 'Rentabilidad estimada (' + pct(rentabilidad) + ' anual)', valor: money(ganancia) },
      { label: 'Saldo estimado del fondo', valor: money(saldo), total: true }
    ];

    bloque('Resultado: proyección de tu fondo AFP', 'Saldo estimado al final del período', money(saldo), filas, [
      'Esta proyección es <strong>referencial</strong>: la rentabilidad real de los fondos administrados por las AFP varía cada año y puede ser negativa.',
      'El cálculo asume una rentabilidad constante y no considera el <strong>aporte adicional voluntario</strong> ni los cambios de remuneración.',
      'Los afiliados pueden elegir <strong>entre 4 tipos de fondos</strong> (0, 1, 2 y 3) según su horizonte de inversión y tolerancia al riesgo.',
      'Recuerda: las comisiones se cobran sobre tu remuneración, así que <strong>reducen tu sueldo neto hoy</strong>, mientras el aporte del 10% construye tu pensión futura.'
    ], '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-k">Aportado</div><div class="stat-v">' + money(aporteTotal) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Costo AFP</div><div class="stat-v">' + money(costoTotal) + '</div></div>' +
      '<div class="stat"><div class="stat-k">Saldo estimado</div><div class="stat-v">' + money(saldo) + '</div></div>' +
      '</div>');
  };

  /* ------------------------------- 14. AUTOCOMPLETAR AFP ------------------- */
  window.PE_onAfpChange = function (selectId, comId, segId) {
    var el = document.getElementById(selectId);
    if (!el) return;
    var cfg = C().afp[el.value];
    if (!cfg) return;
    var c = document.getElementById(comId), s = document.getElementById(segId);
    if (c) c.value = cfg.flujo;
    if (s) s.value = cfg.seguro;
  };

  /* ---------------------------------- API ---------------------------------- */
  window.PE = {
    calcular: function (nombre, ev) {
      if (ev && ev.preventDefault) ev.preventDefault();
      if (typeof rutas[nombre] === 'function') rutas[nombre]();
    },
    money: money,
    num: num,
    config: C,
    renta5ta: retencion5ta,
    impuestoRentaAnual: impuestoRentaAnual,
    utiles: { round2: round2, esc: esc, pct: pct, diffFechas: diffFechas }
  };

  /* Aplica comisiones AFP por defecto al cargar y engancha formularios */
  document.addEventListener('DOMContentLoaded', function () {
    var sel = document.querySelectorAll('[data-afp-select]');
    for (var i = 0; i < sel.length; i++) {
      (function (el) {
        var comId = el.getAttribute('data-afp-select');
        var segId = el.getAttribute('data-afp-seguro');
        el.addEventListener('change', function () { window.PE_onAfpChange(el.id, comId, segId); });
      })(sel[i]);
    }
    var forms = document.querySelectorAll('form[data-calc]');
    for (var j = 0; j < forms.length; j++) {
      (function (f) {
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          window.PE.calcular(f.getAttribute('data-calc'));
        });
        // recalcula en vivo al cambiar cualquier campo
        f.addEventListener('input', function () {
          if (f.getAttribute('data-live') === 'true' || f.getAttribute('data-live') === '') {
            window.PE.calcular(f.getAttribute('data-calc'));
          }
        });
      })(forms[j]);
    }
  });
})();
