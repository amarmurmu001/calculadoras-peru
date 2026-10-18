# Calculadoras Laborales Perú

Sitio web **estático** (HTML + CSS + JavaScript, sin build) con las principales calculadoras laborales del Perú: sueldo neto, CTS, AFP, gratificación, renta de 5.ª categoría, liquidación, horas extras, vacaciones, utilidades, ONP, indemnización, costo laboral y proyección de aportes AFP.

Está pensado para:
- **Posicionar en Google** (una URL por palabra clave, contenido de blog, FAQ, datos estructurados JSON-LD y sitemap).
- **Monetizarse con Google AdSense** (espacios publicitarios ya integrados y `ads.txt` listo).
- **Publicarse gratis** en Cloudflare Pages, Netlify o GitHub Pages.

> ⚠️ **Los valores legales (UIT, RMV, comisiones AFP, tasas) son referenciales** y cambian cada año. Actualízalos antes de publicar (ver [Actualización anual de parámetros](#-actualización-anual-de-parámetros)).

---

## 🔗 Enlaces en vivo

- **Repositorio GitHub:** https://github.com/amarmurmu001/calculadoras-peru
- **Sitio desplegado en Vercel:** https://calculadoras-peru-murex.vercel.app

> El proyecto de Vercel está conectado al repositorio: cada `git push` a `main` genera un despliegue automático.
> Cuando compres tu dominio propio, agrégalo en **Vercel → Settings → Domains** y reemplaza el dominio de ejemplo `calculadoras-peru.pe` en el código (ver más abajo).

---

## 📁 Estructura del proyecto

```
calculadoras-peru/
├─ index.html                          # Portada + hub de calculadoras
├─ calculadora-sueldo-neto.html
├─ calculadora-cts.html
├─ calculadora-afp.html
├─ calculadora-gratificacion.html
├─ calculadora-renta-quinta-categoria.html
├─ calculadora-liquidacion.html
├─ calculadora-horas-extras.html
├─ calculadora-vacaciones.html
├─ calculadora-utilidades.html
├─ calculadora-onp.html
├─ calculadora-indemnizacion.html
├─ calculadora-costo-laboral.html
├─ calculadora-aportes-anuales-afp.html
├─ preguntas-frecuentes.html
├─ sobre-nosotros.html
├─ politica-de-privacidad.html      # ⚠️ Requiere tus datos de titular
├─ terminos-y-condiciones.html      # ⚠️ Requiere tus datos de titular
├─ contacto.html                    # ⚠️ El formulario es una demo (ver abajo)
├─ favicon.svg
├─ manifest.webmanifest
├─ robots.txt
├─ ads.txt                          # ⚠️ Requiere tu ID de AdSense
├─ sitemap.xml                      # ⚠️ Requiere tu dominio
├─ README.md
├─ assets/
│  ├─ css/styles.css                # Sistema de diseño (sin dependencias)
│  └─ js/
│     ├─ config.js                  # Parámetros legales del Perú (¡editar cada año!)
│     ├─ calculators.js             # Motor de cálculo
│     └─ ui.js                      # Navegación, panel de parámetros, AdSense
└─ blog/
   ├─ index.html
   ├─ como-calcular-la-cts-peru.html
   ├─ cuanto-descuentan-de-afp-a-mi-sueldo.html
   ├─ tabla-renta-quinta-categoria-peru.html
   ├─ gratificacion-julio-diciembre-peru.html
   ├─ onp-o-afp-cual-conviene-peru.html
   └─ como-leer-tu-boleta-de-pago-peru.html
```

---

## 🚀 Ver el sitio en local

No necesita instalación. Como usa rutas relativas, abre directo el archivo:

```powershell
# Opción rápida (Windows)
start .\calculadoras-peru\index.html
```

Para probarlo como se verá en producción (recomendado), levanta un servidor local:

```powershell
# Con Python (si lo tienes instalado)
cd calculadoras-peru
python -m http.server 8080
# Luego abre http://localhost:8080
```

```powershell
# Con Node.js
cd calculadoras-peru
npx serve .
```

---

## 🐙🚀 Desplegar en GitHub + Vercel (recomendado)

> ⚠️ **Sobre "los enlaces del menú no funcionan".** Los enlaces de navegación
> usan rutas **relativas** (`calculadora-cts.html`, `../index.html`). Funcionan
> perfectamente cuando el sitio se **sirve por HTTP** (localhost o un hosting
> real). Si abres un único archivo en el **panel de vista previa del editor**,
> la navegación entre archivos no está disponible: **no es un error del sitio**.
> Para verlo bien en local usa `python -m http.server` (arriba) o
> `http://localhost:8080/`. Ya desplegado en Vercel, todo funciona en línea.

### Requisitos
- Cuenta en [GitHub](https://github.com/) (gratis).
- Cuenta en [Vercel](https://vercel.com/) (gratis) — **regístrate con GitHub** para simplificar.
- Opcional: [Git](https://git-scm.com/download/win) instalado (solo para el método con línea de comandos).

### Paso 1 — Subir el código a GitHub

**Opción A — Sin instalar nada (arrastrar y soltar):**
1. Entra a [github.com/new](https://github.com/new).
2. **Repository name:** `calculadoras-peru`. Visibilidad: **Public**. No marques *Add a README*.
3. **Create repository**.
4. En la página del repo, clic en **uploading an existing file**.
5. Arrastra **todo el contenido** de la carpeta `calculadoras-peru` (no la carpeta, su contenido: `index.html`, `assets/`, `blog/`, `vercel.json`, etc.).
6. **Commit changes**.

**Opción B — Con Git (línea de comandos):**
```powershell
cd "C:\Users\amrone\Documents\Default Project\calculadoras-peru"
git init
git add .
git commit -m "Sitio de calculadoras laborales del Peru"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/calculadoras-peru.git
git push -u origin main
```

### Paso 2 — Desplegar en Vercel

1. Entra a [vercel.com/new](https://vercel.com/new).
2. **Import Git Repository** → autoriza GitHub → elige `calculadoras-peru`.
3. Configuración del proyecto (Vercel detecta que es estático):
   - **Framework Preset:** `Other`
   - **Build Command:** *(vacío)*
   - **Output Directory:** *(vacío / `.`)*
   - **Root Directory:** `./` (déjalo así **si subiste el contenido** de la carpeta; cámbialo a `calculadoras-peru` solo si subiste la carpeta como subnivel).
4. **Deploy**. En ~20 segundos tendrás una URL tipo `https://calculadoras-peru.vercel.app`.
5. (Opcional) **Settings → Domains** → agrega tu dominio propio (p. ej. `calculadoras-peru.pe`).

`vercel.json` ya incluye encabezados de caché/seguridad, redirecciones de `index.html` y usa `404.html` como página de error personalizada.

### Paso 3 — Después de desplegar
1. Reemplaza el dominio de ejemplo (ver más abajo).
2. Verifica que `https://TU-DOMINIO/ads.txt` y `/sitemap.xml` carguen.
3. Envía el sitemap en **Google Search Console**.

---

## 🌐 Otras opciones de hosting (alternativas)

Puedes subir la carpeta `calculadoras-peru/` completa. No hay proceso de compilación.

### Cloudflare Pages

1. Crea una cuenta en [Cloudflare Pages](https://pages.cloudflare.com/).
2. Conecta tu repositorio de GitHub **o** sube la carpeta manualmente (*Direct Upload*).
3. Configuración: **Framework preset:** `None` · **Build command:** *(vacío)* · **Build output directory:** `/`.
4. *Custom domain* → agrega tu dominio.

### Netlify

1. Entra a [Netlify](https://app.netlify.com/) → **Add new site → Import an existing project** (o arrastra la carpeta en *Deploy manually*).
2. **Build command:** *(vacío)* · **Publish directory:** `.` (o `calculadoras-peru` si la carpeta es un subnivel).
3. *Domain settings* → *Add custom domain*.

### GitHub Pages

1. Sube el proyecto a un repositorio de GitHub.
2. **Settings → Pages → Source: Deploy from a branch** → rama `main` / carpeta `/`.
3. Añade tu dominio en **Custom domain**.

> 💡 **Consejo SEO:** elige una sola versión del dominio (con `https://` y sin `www`) y redirige la otra. Usa el **dominio raíz** en los canónicos.


---

## ✏️ Paso obligatorio: reemplazar el dominio de ejemplo

Todo el sitio usa el dominio de ejemplo **`https://calculadoras-peru.pe`**. Debes cambiarlo por el tuyo real en:

- Etiquetas `<link rel="canonical">`, `og:url`, `twitter:*` y datos estructurados JSON-LD (en **todas** las páginas HTML).
- `sitemap.xml` (campo `<loc>`).
- `robots.txt` (línea `Sitemap:`).

**Reemplazo masivo** (desde la carpeta `calculadoras-peru`):

```powershell
# Previsualizar qué archivos cambiarían
Get-ChildItem -Recurse -Include *.html,*.xml,*.txt |
  Select-String -Pattern "calculadoras-peru\.pe" -List | Select-Object Path

# Reemplazar en todos los archivos (ajusta TU-DOMINIO.pe)
Get-ChildItem -Recurse -Include *.html,*.xml,*.txt | ForEach-Object {
  (Get-Content $_.FullName -Raw) -replace "calculadoras-peru\.pe", "TU-DOMINIO.pe" |
    Set-Content $_.FullName -NoNewline -Encoding utf8
}
```

---

## 💰 Activar Google AdSense

### 1. Configura tu ID de editor y los bloques

Edita `assets/js/ui.js` y reemplaza el objeto `window.PE_ADS` (arriba del archivo):

```js
window.PE_ADS = {
  client: 'ca-pub-0000000000000000',   // ← tu ID de editor real
  slots: {
    header:    '0000000001',           // ← ID de bloque "cabecera"
    inArticle: '0000000002',           // ← ID de bloque "en artículo"
    sidebar:   '0000000003',           // ← ID de bloque "barra lateral"
    footer:    '0000000004'            // ← ID de bloque "pie"
  }
};
```

> Mientras `client` siga conteniendo `0000000000`, el sitio muestra un **espacio etiquetado** ("Espacio publicitario") en lugar de anuncios. Así puedes publicar y revisar el diseño sin violar políticas.

### 2. Autoriza tus anunciantes en `ads.txt`

Edita `ads.txt` y reemplaza `pub-0000000000000000` por tu ID de editor **sin** el prefijo `ca-`:

```
google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0
```

Publica `ads.txt` en la **raíz del dominio** (ya está ahí). Verifícalo luego en `https://TU-DOMINIO.pe/ads.txt`.

### 3. Solicita la aprobación

1. Crea la cuenta en [Google AdSense](https://adsense.google.com/) e ingresa tu dominio.
2. Espera la revisión (suele tardar de días a 2 semanas).
3. Requisitos que este sitio ya cubre: **privacidad**, **términos**, **sobre nosotros**, **contacto** y contenido original suficiente.
4. Una vez aprobado, pega tu `client` real y los `slot` IDs.

### 4. Consentimiento de cookies (según tu tráfico)

Si recibes visitas de la UE/Reino Unido, activa un **mensaje de consentimiento** (CMP) en AdSense: *Privacidad y mensajes → GDPR/CCPA*. El sitio incluye un banner de cookies básico; para cumplimiento completo usa la CMP de Google.

---

## 🔍 Checklist SEO (Google, primera página)

1. **Google Search Console** → agrega tu dominio → verifica la propiedad.
2. Envía el sitemap: `https://TU-DOMINIO.pe/sitemap.xml`.
3. Revisa *Cobertura* hasta que todas las URLs estén "Válidas".
4. **Bing Webmaster Tools** (opcional pero gratis) → mismo sitemap.
5. **Google Analytics 4** (opcional): añade la etiqueta `<script>` antes de `</head>` en todas las páginas.
6. Verifica títulos y descripciones con la vista previa de resultados de Search Console.
7. Crea tu ficha en **Google Business Profile** si ofreces servicios.

**Buenas prácticas ya implementadas:**
- Una URL por palabra clave + `<title>` y `<meta name="description">` únicos.
- Datos estructurados JSON-LD (`WebSite`, `Organization`, `BreadcrumbList`, `FAQPage`, `WebApplication`, `Article`).
- `sitemap.xml`, `robots.txt`, canónicos, Open Graph y Twitter Cards.
- HTML semántico, `lang="es-PE"`, diseño móvil, sin dependencias externas (rápido).

**Pendiente recomendado:**
- Añade `og-image.png` (1200×630 px) en la raíz para previsualizaciones al compartir.
- Consigue algunos enlaces entrantes (directorios, foros, prensa) para ganar autoridad.

---

## 📬 Formulario de contacto

`contacto.html` incluye un formulario **de demostración** (validación en el navegador y mensaje de éxito simulado). Para recibir mensajes reales, conecta un servicio sin backend:

- [Formspree](https://formspree.io/) · [Getform](https://getform.io/) · [Web3Forms](https://web3forms.com/) · Google Forms.

Busca el comentario `TODO` en `contacto.html`, agrega el `action`/endpoint del servicio y ajusta el `method` a `POST`.

---

## 🔄 Actualización anual de parámetros

Los valores vigentes están en **`assets/js/config.js`**. Revísalos cada año (y cuando haya cambios normativos):

| Parámetro | Variable en `config.js` | Fuente oficial |
|---|---|---|
| Valor de la UIT | `uit` | [sunat.gob.pe](https://www.sunat.gob.pe/) |
| Remuneración Mínima Vital (RMV) | `rmv` | [gob.pe (MTPE)](https://www.gob.pe/mtpe) |
| Comisiones y prima AFP | `afp.*` | [sbs.gob.pe](https://www.sbs.gob.pe/) |
| Tasa ONP (13%) | `onp` | [onp.gob.pe](https://www.onp.gob.pe/) |
| EsSalud, tasas de utilidades, etc. | varias | [elperuano.pe](https://elperuano.pe/) |

> Los usuarios también pueden **ajustar UIT y RMV** desde el panel *"Ajustar parámetros vigentes"* presente en cada página (se guarda en `localStorage`).

Recuerda actualizar el **año en los títulos** (`... 2026`) cuando cambie.

---

## 📄 Licencia y responsabilidad

- El **código** de este proyecto puedes usarlo y modificarlo libremente.
- Los **cálculos son referenciales** y no constituyen asesoría legal, contable ni tributaria. Verifica siempre con las fuentes oficiales (SUNAFIL, SUNAT, SBS, ONP, MTPE) o con un profesional.

---

## ✅ Puesta en marcha (resumen)

1. [ ] Reemplazar `calculadoras-peru.pe` por tu dominio real.
2. [ ] Completar tus datos en `politica-de-privacidad.html`, `terminos-y-condiciones.html` y `sobre-nosotros.html`.
3. [ ] Añadir `og-image.png` (1200×630) en la raíz.
4. [ ] Publicar en Cloudflare Pages / Netlify / GitHub Pages.
5. [ ] Verificar parámetros legales en `config.js`.
6. [ ] Registrar el dominio en Google Search Console y enviar `sitemap.xml`.
7. [ ] Configurar `ads.txt` y `PE_ADS` con tu ID de AdSense.
8. [ ] Conectar el formulario de contacto.
