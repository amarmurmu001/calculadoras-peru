/* ==========================================================================
   config.js — Parámetros legales y tributarios del Perú
   --------------------------------------------------------------------------
   ⚠️  IMPORTANTE PARA EL ADMINISTRADOR DEL SITIO
   Estos valores cambian cada año. Actualízalos aquí UNA sola vez y se
   reflejarán en todas las calculadoras del sitio.

   Fuentes oficiales para verificar:
   - UIT:            SUNAT (https://www.sunat.gob.pe)
   - RMV:            MTPE  (https://www.gob.pe/mtpe)
   - AFP (comisiones, prima de seguro): SBS (https://www.sbs.gob.pe)
   - EsSalud:        EsSalud (https://www.essalud.gob.pe)
   Los visitantes también pueden editar estos valores desde el panel
   "Ajustar parámetros" de cada calculadora (se guardan en su navegador).
   ========================================================================== */

window.PE_CONFIG = {
  anio: 2026,

  /* --- Valores vigentes referenciales --------------------------------- */
  uit: 5350,              // Valor de la UIT (Impuesto a la Renta)
  rmv: 1130,              // Remuneración Mínima Vital
  asignacionFamiliar: 0.10, // 10% de la RMV por hijo (Ley 25129)

  /* --- Aportes y descuentos ------------------------------------------- */
  onp: 0.13,              // Aporte obligatorio ONP (13% de la remuneración)
  essalud: 0.09,          // Aporte del EMPLEADOR a EsSalud (no se descuenta al trabajador)
  bonifExtraordinaria: 0.09,      // Bonificación extraordinaria por gratificación (EsSalud)
  bonifExtraordinariaEps: 0.0675, // Bonificación extraordinaria (afiliados a EPS)
  maxRemAsegurableUit: 10, // Tope máximo de remuneración asegurable en pensiones (10 UIT)

  /* --- AFP: comisiones y prima de seguro (referenciales) -------------- */
  afp: {
    prima:      { nombre: 'Prima AFP',     flujo: 1.60, seguro: 1.35 },
    habitat:    { nombre: 'AFP Habitat',   flujo: 1.47, seguro: 1.35 },
    integra:    { nombre: 'AFP Integra',   flujo: 1.55, seguro: 1.35 },
    profuturo:  { nombre: 'AFP Profuturo', flujo: 1.69, seguro: 1.35 },
    personalizado: { nombre: 'Otra AFP / comisión personalizada', flujo: 1.60, seguro: 1.35 }
  },
  aporteObligatorioAfp: 0.10, // 10% de la remuneración va al fondo de pensiones

  /* --- Impuesto a la Renta 5ta categoría (progresivo acumulativo) ----- */
  renta5ta: [
    { hastaUit: 5,           tasa: 0.08 },  // hasta 5 UIT  -> 8%
    { hastaUit: 20,          tasa: 0.14 },  // +5 a 20 UIT  -> 14%
    { hastaUit: 35,          tasa: 0.17 },  // +20 a 35 UIT -> 17%
    { hastaUit: 45,          tasa: 0.20 },  // +35 a 45 UIT -> 20%
    { hastaUit: Infinity,    tasa: 0.30 }   // más de 45 UIT -> 30%
  ],
  deduccionUit: 7,        // Deducción fija de 7 UIT sobre la renta anual

  /* --- Utilidades (participación en las utilidades, D.Leg. 892) ------- */
  utilidadesTasas: {
    pesquera:        { nombre: 'Empresa pesquera',              tasa: 0.05 },
    telecom:         { nombre: 'Telecomunicaciones',            tasa: 0.10 },
    industrial:      { nombre: 'Industrial / manufacturera',    tasa: 0.08 },
    minera:          { nombre: 'Minera',                        tasa: 0.08 },
    comercio:        { nombre: 'Comercio y restaurantes',       tasa: 0.08 },
    otras:           { nombre: 'Otras actividades',             tasa: 0.05 }
  },
  utilidadesTopeSueldos: 18,   // Tope de 18 remuneraciones mensuales
  utilidadesMaxDias: 180,      // Máximo de días computables por trabajador

  /* --- Reglas laborales ----------------------------------------------- */
  indemnizacionSueldosPorAnio: 1.5, // 1.5 sueldos por año (despido arbitrario)
  indemnizacionTopeSueldos: 12,     // Tope de 12 sueldos
  vacacionesDiasPorAnio: 30,
  jornadaHorasDiarias: 8,
  horasExtraPrimeras: 0.25,   // +25% las 2 primeras horas del día
  horasExtraSiguientes: 0.35  // +35% a partir de la tercera hora
};

/* Permite que el visitante ajuste los parámetros en su navegador */
(function () {
  try {
    var raw = localStorage.getItem('pe_user_config');
    if (raw) {
      var u = JSON.parse(raw);
      if (u && typeof u === 'object') {
        Object.keys(u).forEach(function (k) {
          if (k === 'afp' || k === 'utilidadesTasas') return;
          window.PE_CONFIG[k] = u[k];
        });
      }
    }
  } catch (e) { /* almacenamiento no disponible: se usan los valores por defecto */ }
})();

window.PE_SAVE_CONFIG = function (partial) {
  try {
    var current = JSON.parse(localStorage.getItem('pe_user_config') || '{}');
    Object.assign(current, partial);
    localStorage.setItem('pe_user_config', JSON.stringify(current));
  } catch (e) {}
};

window.PE_RESET_CONFIG = function () {
  try { localStorage.removeItem('pe_user_config'); } catch (e) {}
};
