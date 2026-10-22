/* Cotización institucional: mismo cálculo del simulador, presentación lista para PDF. */
(() => {
  const el = id => document.getElementById(id);
  const dialog = el('quote-dialog');
  const form = el('quote-form');
  const mode = el('quote-mode');
  const scope = el('quote-scope');
  const levelsContainer = el('quote-levels');
  const error = el('quote-error');
  const download = el('quote-download');
  const modality = {BUY: 'INTEGRA', RENT: 'FLEX', EVO8: 'EVOLUCIONA 8', EVO16: 'EVOLUCIONA 16'};
  const money = value => `Q ${Number(value).toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  const dateText = date => new Intl.DateTimeFormat('es-GT', {day: '2-digit', month: 'long', year: 'numeric'}).format(date);
  const slug = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 45) || 'institucion';
  const visual = {
    Spike: {product: 'spikeProduct', classroom: 'spikeClass', design: 'designClass', programming: 'spikeProgramming', level: '4.º primaria a bachillerato', idea: 'Un robot que interpreta su entorno', verbs: ['Explora', 'Construye', 'Programa']},
    'Robot Master': {product: 'robotMasterProduct', classroom: 'robotMasterClass', design: 'robotMasterDesign', level: '1.º a 3.º primaria', idea: 'Un robot con movimiento y sensores', verbs: ['Explora', 'Ensambla', 'Prueba']},
    Snap: {product: 'snapProduct', classroom: 'snapClass', design: 'snapDesign', level: 'primaria y secundaria', idea: 'Un circuito que cobra vida', verbs: ['Investiga', 'Conecta', 'Comprueba']},
    TaleBot: {product: 'talebotProduct', classroom: 'talebotClass', design: 'talebotDesign', level: 'preprimaria', idea: 'Un recorrido con instrucciones', verbs: ['Imagina', 'Ordena', 'Descubre']},
    Meta: {product: 'vrProduct', classroom: 'vrClass', design: 'vrDesign', level: 'tecnología transversal', idea: 'Una experiencia inmersiva', verbs: ['Observa', 'Diseña', 'Explora']},
    Drones: {product: 'droneProduct', classroom: 'dronesClass', design: 'dronesDesign', level: 'tecnología aplicada', idea: 'Una misión de vuelo segura', verbs: ['Planifica', 'Programa', 'Vuela']}
  };
  const levelDefinitions = [
    {id: 'pre', label: 'Preprimaria', tech: 'TaleBot'},
    {id: 'primary-low', label: 'Primaria · 1.º a 3.º', tech: 'Robot Master'},
    {id: 'primary-high', label: 'Primaria · 4.º a 6.º', tech: 'Spike'},
    {id: 'secondary', label: 'Básicos y bachillerato', tech: 'Spike'}
  ];
  const technologyOptions = Object.entries(techs).map(([key, item]) => `<option value="${key}">${item.name}</option>`).join('');
  levelsContainer.innerHTML = `<p class="quote-levels-intro">Los valores iniciales son de ejemplo. Confirma la tecnología, los equipos y los estudiantes de cada nivel antes de descargar.</p>${levelDefinitions.map(level => `
    <section class="quote-level" data-level="${level.id}">
      <div class="quote-level-head"><label class="quote-level-toggle"><input class="quote-level-enabled" type="checkbox" checked> ${level.label}</label></div>
      <div class="quote-level-fields">
        <label class="quote-field quote-level-tech-field">Tecnología <select class="quote-level-tech">${technologyOptions}</select></label>
        <label class="quote-field">Equipos <input class="quote-level-qty" type="number" min="1" max="1000" step="1" value="5"></label>
        <label class="quote-field">Estudiantes <input class="quote-level-students" type="number" min="1" max="100000" step="1" value="60"></label>
      </div>
      <div class="quote-level-summary"><span>Inversión del nivel · sin IVA<small class="quote-level-gross"></small></span><strong class="quote-level-net"></strong></div>
    </section>`).join('')}`;
  levelDefinitions.forEach(level => {
    levelsContainer.querySelector(`[data-level="${level.id}"] .quote-level-tech`).value = level.tech;
  });

  function showError(message) {
    error.textContent = message;
    error.hidden = !message;
  }

  function validScenario() {
    return ['qty', 'students'].every(id => {
      const value = el(id).value.trim();
      return value && Number.isSafeInteger(Number(value)) && Number(value) > 0;
    });
  }

  const positiveInteger = value => value !== '' && Number.isSafeInteger(Number(value)) && Number(value) > 0;
  const isMulti = () => scope.value === 'multi' && mode.value !== 'BUY';
  const scenarioFor = (tech, qty, students) => calculateScenario({
    tech, qty, students, bims: el('quote-bims').value, down: el('quote-down').value,
    sm: el('schoolMargin').value
  });
  function activeLevels() {
    return levelDefinitions.map(definition => {
      const row = levelsContainer.querySelector(`[data-level="${definition.id}"]`);
      const enabled = row.querySelector('.quote-level-enabled').checked;
      const tech = row.querySelector('.quote-level-tech').value;
      const qty = row.querySelector('.quote-level-qty').value.trim();
      const students = row.querySelector('.quote-level-students').value.trim();
      row.classList.toggle('is-disabled', !enabled);
      row.querySelectorAll('.quote-level-tech,.quote-level-qty,.quote-level-students').forEach(input => { input.disabled = !enabled; });
      if (!enabled) {
        row.querySelector('.quote-level-net').textContent = 'No incluido';
        row.querySelector('.quote-level-gross').textContent = '';
        return null;
      }
      if (!positiveInteger(qty) || !positiveInteger(students)) {
        row.querySelector('.quote-level-net').textContent = 'Revisa las cantidades';
        row.querySelector('.quote-level-gross').textContent = '';
        return {invalid: true};
      }
      const data = scenarioFor(tech, Number(qty), Number(students));
      const offer = data[mode.value];
      row.querySelector('.quote-level-net').textContent = money(offer.net);
      row.querySelector('.quote-level-gross').textContent = `Con IVA: ${money(offer.gross)}`;
      return {id: definition.id, label: definition.label, tech, program: data.t.name,
        quantity: data.qty, students: data.students, offer};
    }).filter(Boolean);
  }

  function refreshSnapshot() {
    scope.disabled = mode.value === 'BUY';
    if (scope.disabled) scope.value = 'single';
    el('quote-scope-help').textContent = scope.disabled
      ? 'INTEGRA es una compra directa y se cotiza por separado.'
      : 'Una sola modalidad para todos los niveles seleccionados; cada nivel conserva su propio precio.';
    levelsContainer.hidden = !isMulti();
    el('quote-shared-terms').hidden = mode.value === 'BUY';
    el('quote-bims-field').hidden = mode.value !== 'RENT';
    el('quote-down-field').hidden = !mode.value.startsWith('EVO');
    const projection = el('quote-projection');
    projection.disabled = mode.value === 'BUY';
    if (projection.disabled) projection.checked = false;
    if (isMulti()) {
      const levels = activeLevels();
      if (!levels.length || levels.some(level => level.invalid)) {
        el('quote-snapshot').textContent = levels.length ? 'Revisa equipos y estudiantes de cada nivel activo.' : 'Selecciona al menos un nivel educativo.';
        download.disabled = true;
        return;
      }
      const net = levels.reduce((sum, level) => sum + level.offer.net, 0);
      const gross = levels.reduce((sum, level) => sum + level.offer.gross, 0);
      const quantity = levels.reduce((sum, level) => sum + level.quantity, 0);
      const students = levels.reduce((sum, level) => sum + level.students, 0);
      el('quote-snapshot').innerHTML = `<div><span>PROPUESTA POR NIVELES</span><strong>${levels.length} niveles · ${quantity} equipos · ${students} estudiantes</strong></div><div><span>TOTAL ${modality[mode.value]} SIN IVA</span><strong>${money(net)}</strong><small>Con IVA: ${money(gross)}</small></div>`;
      download.disabled = false;
      return;
    }
    if (!validScenario()) {
      el('quote-snapshot').textContent = 'Ingresa cantidades válidas de equipos y estudiantes antes de cotizar.';
      download.disabled = true;
      return;
    }
    const data = scenarioFor(el('tech').value, el('qty').value, el('students').value);
    const offer = data[mode.value];
    el('quote-snapshot').innerHTML = `<div><span>PROGRAMA Y ESCENARIO</span><strong>${data.t.name} · ${data.qty} equipos · ${data.students} estudiantes</strong></div><div><span>INVERSIÓN ${modality[mode.value]} SIN IVA</span><strong>${money(offer.net)}</strong><small>Con IVA: ${money(offer.gross)}</small></div>`;
    download.disabled = false;
  }

  function buildQuoteData() {
    const key = mode.value;
    const issued = new Date();
    const expires = new Date(issued);
    expires.setDate(expires.getDate() + Number(el('quote-validity').value));
    const basics = {
      school: el('quote-school').value.trim().replace(/\s+/g, ' '),
      contact: el('quote-contact').value.trim(),
      email: el('quote-email').value.trim(),
      location: el('quote-location').value.trim(),
      note: el('quote-note').value.trim(),
      projection: key !== 'BUY' && el('quote-projection').checked,
      issued, expires, key
    };
    const visibleOffer = offer => ({
      net: offer.net, tax: offer.tax, gross: offer.gross,
      months: offer.months, initial: offer.initial,
      installment: offer.installment, suggested: offer.suggested,
      revenue: offer.revenue, contribution: offer.contribution
    });
    if (isMulti()) {
      const levels = activeLevels().map(level => ({...level, offer: visibleOffer(level.offer)}));
      const totals = ['net', 'tax', 'gross', 'initial', 'installment', 'revenue', 'contribution']
        .reduce((result, field) => ({...result, [field]: levels.reduce((sum, level) => sum + level.offer[field], 0)}), {});
      return {...basics, scope: 'multi', program: 'Programa por niveles', levels,
        quantity: levels.reduce((sum, level) => sum + level.quantity, 0),
        students: levels.reduce((sum, level) => sum + level.students, 0),
        offer: {...totals, months: levels[0].offer.months}};
    }
    const data = scenarioFor(el('tech').value, el('qty').value, el('students').value);
    const offer = data[key];
    return {
      ...basics, scope: 'single', tech: el('tech').value,
      program: data.t.name, level: data.t.level,
      quantity: data.qty, students: data.students,
      offer: visibleOffer(offer)
    };
  }

  function dataBytes(uri) {
    const data = atob(uri.slice(uri.indexOf(',') + 1));
    return Uint8Array.from(data, char => char.charCodeAt(0));
  }

  async function makePdf(quote) {
    if (!window.QUOTE_MEDIA) throw new Error('Faltan recursos visuales de la cotización.');
    const {PDFDocument, StandardFonts, rgb} = PDFLib;
    const doc = await PDFDocument.create();
    doc.setTitle(`Cotización GuateGeeks · ${quote.school}`);
    doc.setAuthor('GuateGeeks');
    doc.setSubject(`${modality[quote.key]} · ${quote.scope === 'multi' ? `${quote.levels.length} niveles` : quote.program}`);
    doc.setCreator('Simulador GuateGeeks');
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const W = 595.28, H = 841.89, M = 37, CW = W - M * 2;
    const rgbHex = hex => rgb(...[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255));
    const c = {
      cyan: rgbHex('#138cb1'), dark: rgbHex('#184455'), ink: rgbHex('#263746'),
      gray: rgbHex('#66717a'), pale: rgbHex('#f2f8fa'), paleBlue: rgbHex('#e3f3f8'),
      border: rgbHex('#d8e5e9'), wash: rgbHex('#fbfdfe'), white: rgb(1, 1, 1)
    };
    const textSafe = value => [...String(value ?? '')].map(ch => {
      if (ch === '\n') return ch;
      try { regular.encodeText(ch); return ch; } catch (_) { return '?'; }
    }).join('');
    const box = (page, x, top, width, height, fill, radius = 0, border = null) => {
      const opts = {x, y: H - top - height, width, height, color: fill, borderRadius: radius};
      if (border) { opts.borderColor = border; opts.borderWidth = 0.8; }
      page.drawRectangle(opts);
    };
    const rule = (page, x, top, width, color = c.border, thickness = 0.8) =>
      page.drawLine({start: {x, y: H - top}, end: {x: x + width, y: H - top}, color, thickness});
    const put = (page, value, x, top, size = 11, fill = c.ink, font = regular) =>
      page.drawText(textSafe(value), {x, y: H - top - size, size, font, color: fill});
    const putRight = (page, value, right, top, size = 11, fill = c.ink, font = regular) => {
      const content = textSafe(value);
      put(page, content, right - font.widthOfTextAtSize(content, size), top, size, fill, font);
    };
    const putFit = (page, value, x, top, width, size = 11, minSize = 7, fill = c.ink, font = regular) => {
      const content = textSafe(value);
      while (size > minSize && font.widthOfTextAtSize(content, size) > width) size -= .25;
      put(page, content, x, top, size, fill, font);
    };
    const wrap = (value, width, size, font = regular) => {
      const rows = [];
      for (const part of textSafe(value).split('\n')) {
        let row = '';
        for (const word of part.split(/\s+/).filter(Boolean)) {
          const candidate = row ? `${row} ${word}` : word;
          if (row && font.widthOfTextAtSize(candidate, size) > width) { rows.push(row); row = word; }
          else row = candidate;
        }
        rows.push(row);
      }
      return rows;
    };
    const paragraph = (page, value, x, top, width, size = 10, leading = 15, fill = c.gray, font = regular, maxLines = 20) => {
      const rows = wrap(value, width, size, font).slice(0, maxLines);
      rows.forEach((row, i) => put(page, row, x, top + i * leading, size, fill, font));
      return rows.length * leading;
    };
    const eyebrow = (page, value, x, top, fill = c.cyan) => put(page, value.toUpperCase(), x, top, 8.5, fill, bold);
    const imageCache = {};
    const getImage = async key => {
      if (imageCache[key]) return imageCache[key];
      const uri = window.QUOTE_MEDIA[key];
      if (!uri) throw new Error(`Falta imagen ${key}`);
      imageCache[key] = uri.startsWith('data:image/png') ? await doc.embedPng(dataBytes(uri)) : await doc.embedJpg(dataBytes(uri));
      return imageCache[key];
    };
    const imageBox = async (page, key, x, top, width, height, fill = c.pale) => {
      box(page, x, top, width, height, fill);
      const image = await getImage(key);
      const scale = Math.min(width / image.width, height / image.height);
      const w = image.width * scale, h = image.height * scale;
      page.drawImage(image, {x: x + (width - w) / 2, y: H - top - (height + h) / 2, width: w, height: h});
    };
    const stroke = (page, x1, top1, x2, top2, thickness = 1.6) =>
      page.drawLine({start: {x: x1, y: H - top1}, end: {x: x2, y: H - top2}, color: c.cyan, thickness});
    const icon = (page, type, x, top) => {
      box(page, x, top, 34, 34, c.paleBlue);
      const line = (a, b, d, e) => stroke(page, x + a, top + b, x + d, top + e);
      const frame = (left, upper, width, height) => page.drawRectangle({
        x: x + left, y: H - top - upper - height, width, height,
        borderColor: c.cyan, borderWidth: 1.6
      });
      const dot = (cx, cy, size = 1.8) => page.drawCircle({x: x + cx, y: H - top - cy, size, color: c.cyan});
      if (type === 'equipment') {
        frame(7, 10, 20, 16); line(17, 7, 17, 10); dot(17, 6, 1.5);
        dot(13, 17); dot(21, 17); line(12, 23, 22, 23);
      } else if (type === 'planning') {
        frame(9, 6, 17, 23); line(13, 12, 22, 12); line(13, 17, 22, 17); line(13, 22, 20, 22);
      } else if (type === 'training') {
        frame(5, 8, 24, 17); line(17, 25, 17, 29); line(12, 29, 22, 29); dot(12, 16, 2); line(17, 16, 24, 16);
      } else if (type === 'integration') {
        frame(5, 8, 10, 10); frame(19, 17, 10, 10); line(15, 13, 20, 21); dot(10, 13, 1.4); dot(24, 22, 1.4);
      } else if (type === 'platform') {
        frame(5, 8, 24, 17); line(17, 25, 17, 29); line(11, 29, 23, 29); line(10, 13, 24, 13); line(10, 18, 19, 18);
      } else if (type === 'support') {
        line(8, 18, 8, 24); line(8, 18, 11, 12); line(11, 12, 17, 9); line(17, 9, 23, 12);
        line(23, 12, 26, 18); line(26, 18, 26, 24); frame(6, 21, 5, 7); frame(23, 21, 5, 7); line(23, 27, 18, 29);
      } else if (type === 'launch') {
        line(8, 25, 25, 8); line(18, 8, 25, 8); line(25, 8, 25, 15); line(8, 15, 8, 25); line(8, 25, 18, 25);
      } else if (type === 'extra') {
        page.drawCircle({x: x + 17, y: H - top - 17, size: 10, borderColor: c.cyan, borderWidth: 1.6});
        line(17, 11, 17, 23); line(11, 17, 23, 17);
      }
    };
    const logo = await getImage('logo');
    const geekEyes = await getImage('geekEyes');
    const background = page => {
      box(page, 0, 0, W, H, c.wash);
      // Velos de color muy tenue: dan profundidad sin competir con los datos.
      for (let i = 0; i < 7; i++) {
        page.drawCircle({x: W + 25, y: H - 365, size: 205 - i * 17, color: c.cyan, opacity: .005});
        page.drawCircle({x: -45, y: 180, size: 225 - i * 17, color: c.paleBlue, opacity: .018});
      }
    };
    const header = page => {
      box(page, 0, 0, W, 101, c.dark);
      box(page, 0, 97, W, 4, c.cyan);
      box(page, M, 18, 66, 66, c.white);
      page.drawImage(logo, {x: M + 5, y: H - 79, width: 56, height: 56});
      put(page, 'GUATEGEEKS', 117, 23, 18, c.white, bold);
      put(page, 'PROPUESTA EDUCATIVA', 118, 49, 9, c.paleBlue, bold);
      put(page, 'Imagina, diseña y crea.', 118, 65, 11, c.white);
      page.drawImage(geekEyes, {x: W - 130, y: H - 76, width: 91, height: 50});
    };
    if (quote.scope === 'multi') {
      const p1 = doc.addPage([W, H]);
      background(p1);
      header(p1);
      eyebrow(p1, 'PROPUESTA INSTITUCIONAL POR NIVELES', M, 120);
      put(p1, 'Un programa para cada etapa.', M, 141, 23, c.dark, bold);
      putFit(p1, `Para ${quote.school}`, M, 181, CW, 13, 9, c.dark, bold);
      paragraph(p1, 'Una misma modalidad con inversión y estudiantes detallados por nivel educativo.', M, 207, CW, 10, 14, c.gray, regular, 2);
      box(p1, M, 239, CW, 72, c.paleBlue);
      eyebrow(p1, 'MODALIDAD COMPARTIDA', M + 14, 249);
      putFit(p1, modality[quote.key], M + 14, 267, 190, 17, 13, c.dark, bold);
      const period = quote.key === 'EVO16' ? '2 ciclos · 16 meses' : quote.key === 'EVO8' ? '1 ciclo · 8 meses' : `${quote.offer.months} meses de programa`;
      putRight(p1, period, M + CW - 15, 266, 10, c.dark, bold);
      putRight(p1, `${quote.levels.length} niveles  ·  ${quote.quantity} equipos  ·  ${quote.students} estudiantes`, M + CW - 15, 287, 9, c.gray);
      eyebrow(p1, 'INVERSIÓN POR NIVEL', M, 328);
      quote.levels.forEach((level, index) => {
        const top = 351 + index * 58;
        box(p1, M, top, CW, 54, index % 2 ? c.white : c.pale);
        box(p1, M, top, 3, 54, c.cyan);
        putFit(p1, level.label, M + 13, top + 8, 265, 12, 10, c.dark, bold);
        putFit(p1, `${level.program} · ${level.quantity} equipos · ${level.students} estudiantes`, M + 13, top + 29, 310, 8.6, 7.5, c.gray);
        putRight(p1, money(level.offer.net), M + CW - 13, top + 9, 13, c.dark, bold);
        putRight(p1, 'sin IVA', M + CW - 13, top + 31, 8, c.gray);
      });
      const totalTop = 365 + quote.levels.length * 58 + 19;
      box(p1, M, totalTop, CW, 140, c.dark);
      eyebrow(p1, 'INVERSIÓN TOTAL SIN IVA', M + 17, totalTop + 13, c.white);
      putFit(p1, money(quote.offer.net), M + 17, totalTop + 30, CW - 34, 27, 21, c.white, bold);
      rule(p1, M + 17, totalTop + 68, CW - 34, c.paleBlue);
      put(p1, `IVA (12 %): ${money(quote.offer.tax)}`, M + 17, totalTop + 76, 9.3, c.white);
      putRight(p1, `Total con IVA: ${money(quote.offer.gross)}`, M + CW - 17, totalTop + 76, 9.3, c.white, bold);
      const initialNet = quote.offer.net * quote.offer.initial / quote.offer.gross;
      const installmentNet = (quote.offer.net - initialNet) / quote.offer.months;
      put(p1, `Inicial sin IVA: ${money(initialNet)}`, M + 17, totalTop + 98, 9, c.white);
      putRight(p1, `${quote.offer.months} cuotas sin IVA: ${money(installmentNet)} / mes`, M + CW - 17, totalTop + 98, 9, c.white);
      put(p1, `Con IVA: ${money(quote.offer.initial)}`, M + 17, totalTop + 115, 8.2, c.paleBlue);
      putRight(p1, `Con IVA: ${money(quote.offer.installment)} / mes`, M + CW - 17, totalTop + 115, 8.2, c.paleBlue);
      put(p1, `Emitida: ${dateText(quote.issued)}  ·  Vigente hasta: ${dateText(quote.expires)}`, M, Math.min(800, totalTop + 153), 8.6, c.gray);
      const contact = [quote.contact, quote.email, quote.location].filter(Boolean).join('  ·  ');
      if (contact) paragraph(p1, `Contacto: ${contact}`, M, Math.min(813, totalTop + 170), CW, 8.4, 11, c.gray, regular, 2);

      for (let start = 0; start < quote.levels.length; start += 2) {
        const page = doc.addPage([W, H]);
        background(page);
        header(page);
        eyebrow(page, `DETALLE POR NIVEL · ${Math.floor(start / 2) + 1}`, M, 118);
        const pageLevels = quote.levels.slice(start, start + 2);
        for (let localIndex = 0; localIndex < pageLevels.length; localIndex++) {
          const level = pageLevels[localIndex];
          const top = 143 + localIndex * 307;
          box(page, M, top, CW, 291, c.white, 0, c.border);
          box(page, M, top, 4, 291, c.cyan);
          eyebrow(page, `NIVEL ${String(start + localIndex + 1).padStart(2, '0')} / ${level.label}`, M + 14, top + 12);
          putFit(page, level.program, M + 14, top + 30, CW - 28, 16, 12, c.dark, bold);
          const view = visual[level.tech];
          await imageBox(page, view.classroom, M + 14, top + 61, 192, 112);
          put(page, `${level.quantity} equipos  ·  ${level.students} estudiantes`, M + 220, top + 61, 9.2, c.gray, bold);
          put(page, `${level.offer.months} meses de programa`, M + 220, top + 80, 9, c.gray);
          eyebrow(page, 'INVERSIÓN SIN IVA', M + 220, top + 102);
          putFit(page, money(level.offer.net), M + 220, top + 118, CW - 234, 20, 15, c.dark, bold);
          putFit(page, `IVA: ${money(level.offer.tax)}  ·  Con IVA: ${money(level.offer.gross)}`, M + 220, top + 151, CW - 234, 8.2, 7.2, c.gray);
          putFit(page, `${money(level.offer.net / level.students / level.offer.months)} por estudiante / mes · sin IVA`, M + 220, top + 169, CW - 234, 8.3, 7.2, c.gray);
          rule(page, M + 14, top + 186, CW - 28);
          const levelInitialNet = level.offer.net * level.offer.initial / level.offer.gross;
          const levelInstallmentNet = (level.offer.net - levelInitialNet) / level.offer.months;
          const twoW = (CW - 37) / 2;
          [[`PAGO INICIAL · SIN IVA`, money(levelInitialNet), `Con IVA: ${money(level.offer.initial)}`],
            [`${level.offer.months} CUOTAS · SIN IVA`, money(levelInstallmentNet), `Con IVA: ${money(level.offer.installment)} / mes`]].forEach(([label, net, gross], i) => {
            const x = M + 14 + i * (twoW + 9);
            box(page, x, top + 199, twoW, 75, c.pale);
            eyebrow(page, label, x + 9, top + 207);
            putFit(page, net, x + 9, top + 223, twoW - 18, 14, 11, c.dark, bold);
            putFit(page, gross, x + 9, top + 251, twoW - 18, 8.7, 7.5, c.gray);
          });
        }
      }

      const services = doc.addPage([W, H]);
      background(services);
      header(services);
      eyebrow(services, 'QUÉ RECIBE LA INSTITUCIÓN', M, 119);
      put(services, 'Una experiencia completa', M, 140, 23, c.dark, bold);
      put(services, 'para cada nivel.', M, 171, 23, c.cyan, bold);
      box(services, M, 221, CW, 75, c.paleBlue);
      eyebrow(services, modality[quote.key], M + 14, 233);
      paragraph(services, `${quote.quantity} equipos distribuidos entre ${quote.levels.length} niveles y ${quote.students} estudiantes. Las condiciones del programa son comunes; la tecnología y la inversión se detallan por nivel.`, M + 14, 253, CW - 28, 10, 14, c.dark, regular, 3);
      const included = [
        ['equipment', 'Equipamiento educativo', 'Equipos para los niveles incluidos en esta propuesta.'],
        ['planning', 'Planificación docente', 'Guías y retos alineados con el CNB.'],
        ['training', 'Capacitación docente', 'Formación para enseñar con cada equipo.'],
        ['integration', 'Integración tecnológica', 'Orientación para incorporarlo en clase.'],
        ['platform', 'Socrates Aprende', 'Recursos docentes y acceso según el grado.'],
        ['support', 'Soporte y seguimiento', `Acompañamiento durante ${quote.offer.months} meses.`]
      ];
      included.forEach(([symbol, title, description], i) => {
        const x = M + (i % 2) * 264, top = 321 + Math.floor(i / 2) * 78;
        box(services, x, top, 257, 71, c.white, 0, c.border);
        icon(services, symbol, x + 11, top + 14);
        putFit(services, title, x + 56, top + 11, 189, 11, 9.5, c.dark, bold);
        paragraph(services, description, x + 56, top + 32, 188, 9.2, 12.5, c.gray, regular, 2);
      });
      box(services, M, 579, CW, 159, c.paleBlue);
      eyebrow(services, 'DESTINO DEL EQUIPO', M + 13, 591);
      const ownership = quote.key === 'RENT' ? 'En FLEX, los equipos se devuelven a GuateGeeks al finalizar el programa.' :
        quote.key === 'EVO16' ? 'En EVOLUCIONA 16, los equipos quedan en la institución al completar los dos ciclos de 8 meses.' :
          'En EVOLUCIONA 8, los equipos quedan en la institución al completar el ciclo de 8 meses.';
      paragraph(services, ownership, M + 13, 608, CW - 26, 9.5, 13, c.dark, regular, 3);
      rule(services, M + 13, 652, CW - 26, c.border);
      eyebrow(services, 'SOCRATES APRENDE', M + 13, 663);
      const levelIds = new Set(quote.levels.map(level => level.id));
      const platformNotes = [];
      if (levelIds.has('primary-high')) platformNotes.push('Contenido estudiantil disponible hoy para 6.º primaria y gradualmente para 5.º.');
      if (levelIds.has('pre') || levelIds.has('primary-low')) platformNotes.push('Preprimaria y 1.º a 3.º: recursos docentes.');
      if (levelIds.has('secondary')) platformNotes.push('Básicos y bachillerato: fases posteriores.');
      platformNotes.push('La vigencia del acceso se acuerda con GuateGeeks.');
      paragraph(services, platformNotes.join(' '), M + 13, 680, CW - 26, 9.1, 12.5, c.dark, regular, 4);
      if (quote.note) paragraph(services, `Nota: ${quote.note}`, M, 755, CW, 8.2, 10, c.gray, regular, 2);

      if (quote.projection) {
        const projection = doc.addPage([W, H]);
        background(projection);
        header(projection);
        eyebrow(projection, 'PROYECCIÓN INSTITUCIONAL · OPCIONAL', M, 118);
        put(projection, 'Una cuota por cada nivel.', M, 139, 24, c.dark, bold);
        paragraph(projection, 'GuateGeeks sugiere una referencia mensual por estudiante; el colegio decide su cobro final. Las diferencias se calculan antes de gastos propios.', M, 181, CW, 10, 15, c.gray, regular, 3);
        quote.levels.forEach((level, index) => {
          const top = 243 + index * 86;
          box(projection, M, top, CW, 78, index % 2 ? c.white : c.pale, 0, c.border);
          putFit(projection, level.label, M + 13, top + 10, CW - 26, 11.5, 9.5, c.dark, bold);
          putFit(projection, `${level.program} · ${level.students} estudiantes`, M + 13, top + 27, CW - 26, 8.4, 7.5, c.gray);
          put(projection, `Sugerido: ${money(level.offer.suggested)} / estudiante / mes`, M + 13, top + 49, 8.8, c.dark);
          putRight(projection, `Ingreso: ${money(level.offer.revenue)}`, M + CW - 13, top + 29, 9.1, c.dark);
          putRight(projection, `Diferencia sin IVA: ${money(level.offer.revenue - level.offer.net)}`, M + CW - 13, top + 49, 9.1, c.dark, bold);
        });
        const resultTop = 261 + quote.levels.length * 86;
        box(projection, M, resultTop, CW, 103, c.dark);
        eyebrow(projection, 'DIFERENCIA TOTAL ESTIMADA · SIN IVA', M + 15, resultTop + 13, c.white);
        putFit(projection, money(quote.offer.revenue - quote.offer.net), M + 15, resultTop + 33, CW - 30, 24, 18, c.white, bold);
        put(projection, `Ingresos: ${money(quote.offer.revenue)}  ·  Inversión sin IVA: ${money(quote.offer.net)}`, M + 15, resultTop + 72, 8.8, c.white);
        paragraph(projection, `Si corresponde pagar IVA, la diferencia sería ${money(quote.offer.revenue - quote.offer.gross)}. La proyección no descuenta docentes, administración, infraestructura ni otros gastos o impuestos propios; no representa utilidad neta.`, M, resultTop + 119, CW, 9, 13, c.gray, regular, 4);
      }
      return doc.save();
    }
    const v = visual[quote.tech];
    if (!v) throw new Error('Tecnología no reconocida para el PDF.');

    const p1 = doc.addPage([W, H]);
    background(p1);
    header(p1);
    eyebrow(p1, 'PROPUESTA PERSONALIZADA', M, 118);
    put(p1, 'Crear es aprender', M, 136, 27, c.dark, bold);
    put(p1, 'haciendo.', M, 169, 27, c.cyan, bold);
    putFit(p1, `Para ${quote.school}`, M, 207, CW, 13, 9, c.dark, bold);
    paragraph(p1, `${quote.program} · ${v.level}. Un programa para imaginar, diseñar y crear con tecnología.`, M, 229, CW, 10.2, 14, c.gray, regular, 2);
    const duration = quote.key === 'EVO16' ? ['2 ciclos', '8 meses cada uno'] :
      quote.key === 'EVO8' ? ['8 meses', '1 ciclo'] :
      quote.key === 'RENT' ? [`${quote.offer.months} meses`, 'programa FLEX'] : ['Compra directa', 'sin cuotas'];
    const scenario = [
      ['MODELO', modality[quote.key], 'programa elegido', 170],
      ['EQUIPOS', String(quote.quantity), 'para el aula', 98],
      ['ESTUDIANTES', String(quote.students), 'participantes', 104],
      ['DURACIÓN', duration[0], duration[1], 131]
    ];
    let scenarioX = M;
    scenario.forEach(([label, value, detail, width], i) => {
      box(p1, scenarioX, 269, width, 57, i === 0 ? c.paleBlue : c.pale);
      if (i === 0) box(p1, scenarioX, 269, 3, 57, c.cyan);
      put(p1, label, scenarioX + 11, 276, 8, c.gray, bold);
      putFit(p1, value, scenarioX + 11, 290, width - 22, 13, 10, c.dark, bold);
      putFit(p1, detail, scenarioX + 11, 310, width - 22, 8.1, 7.2, c.gray);
      scenarioX += width + 6;
    });
    await imageBox(p1, v.classroom, M, 338, 324, 145);
    await imageBox(p1, v.product, M + 334, 338, CW - 334, 145, c.white);

    const financeTop = 500;
    box(p1, M, financeTop, CW, 214, c.white, 0, c.border);
    box(p1, M, financeTop, 5, 214, c.cyan);
    eyebrow(p1, '01 / INVERSIÓN Y FORMA DE PAGO', M + 18, financeTop + 15);
    put(p1, modality[quote.key], M + 18, financeTop + 30, 11, c.dark, bold);
    put(p1, 'Precio total sin IVA', M + 18, financeTop + 51, 10, c.gray);
    putFit(p1, money(quote.offer.net), M + 18, financeTop + 67, CW - 40, 29, 20, c.dark, bold);
    rule(p1, M + 18, financeTop + 108, CW - 36);
    put(p1, 'IVA (12 %)', M + 18, financeTop + 116, 10, c.gray);
    putRight(p1, money(quote.offer.tax), M + 211, financeTop + 116, 10, c.dark, bold);
    put(p1, 'Total con IVA', M + 277, financeTop + 116, 10, c.gray);
    putRight(p1, money(quote.offer.gross), M + CW - 18, financeTop + 116, 10, c.dark, bold);
    rule(p1, M + 18, financeTop + 140, CW - 36);
    const initialPercent = Math.round(quote.offer.initial / quote.offer.gross * 100);
    const initialWithoutTax = quote.offer.net * quote.offer.initial / quote.offer.gross;
    const installmentWithoutTax = quote.key === 'BUY' ? 0 : (quote.offer.net - initialWithoutTax) / quote.offer.months;
    const payment = quote.key === 'BUY'
      ? [['FORMA DE PAGO', 'Compra directa'], ['CUOTAS', 'No aplica'], ['PROPIEDAD', 'Desde la compra']]
      : [[`INICIAL SIN IVA · ${initialPercent} %`, money(initialWithoutTax), `Con IVA: ${money(quote.offer.initial)}`],
        [`${quote.offer.months} CUOTAS SIN IVA`, money(installmentWithoutTax), `Con IVA: ${money(quote.offer.installment)}`],
        ['AL FINALIZAR', quote.key === 'RENT' ? 'Se devuelve' : 'Equipo propio']];
    payment.forEach(([heading, value, grossValue], i) => {
      const x = M + 18 + i * 165;
      box(p1, x, financeTop + 151, 156, 50, i === 2 ? c.paleBlue : c.pale);
      putFit(p1, heading, x + 8, financeTop + 156, 140, 7.8, 7, c.gray, bold);
      paragraph(p1, value, x + 8, financeTop + 168, 140, 10.4, 12.5, c.dark, bold, 2);
      if (grossValue) putFit(p1, grossValue, x + 8, financeTop + 185, 140, 8.3, 7.5, c.gray);
    });
    put(p1, `Emitida: ${dateText(quote.issued)}  ·  Vigente hasta: ${dateText(quote.expires)}`, M, 730, 9, c.gray);
    const contact = [quote.contact, quote.email, quote.location].filter(Boolean).join('  ·  ');
    if (contact) paragraph(p1, `Contacto: ${contact}`, M, 750, CW, 9, 12, c.gray, regular, 2);

    const p2 = doc.addPage([W, H]);
    background(p2);
    header(p2);
    eyebrow(p2, '02 / EXPERIENCIA EDUCATIVA', M, 118);
    put(p2, 'Del primer reto a una', M, 137, 25, c.dark, bold);
    put(p2, 'creación propia.', M, 168, 25, c.cyan, bold);
    paragraph(p2, `${quote.program}: ${v.idea.toLowerCase()}. El grupo explora, construye y comparte lo aprendido.`, M, 210, CW, 10.2, 15, c.gray, regular, 2);
    const gap = 9, cardW = (CW - gap * 2) / 3;
    const cards = [
      {image: v.classroom, title: v.verbs[0]},
      {image: v.design, title: v.verbs[1]},
      {image: v.programming || v.product, title: v.verbs[2]}
    ];
    const isBuy = quote.key === 'BUY';
    const visualHeight = isBuy ? 145 : 107;
    for (let i = 0; i < cards.length; i++) {
      const x = M + i * (cardW + gap);
      box(p2, x, 247, cardW, visualHeight + 31, c.white, 0, c.border);
      await imageBox(p2, cards[i].image, x + 1, 248, cardW - 2, visualHeight, i === 2 ? c.white : c.pale);
      put(p2, `0${i + 1}  ${cards[i].title}`, x + 10, 255 + visualHeight, 11, c.dark, bold);
    }
    const serviceHeadingTop = isBuy ? 437 : 400;
    eyebrow(p2, 'QUÉ RECIBE LA INSTITUCIÓN', M, serviceHeadingTop);
    put(p2, isBuy ? 'Equipamiento y puesta en marcha' : 'Lo que incluye el programa', M, serviceHeadingTop + 17, 18, c.dark, bold);
    box(p2, M + CW - 145, serviceHeadingTop + 18, 145, 28, c.paleBlue);
    putFit(p2, modality[quote.key], M + CW - 134, serviceHeadingTop + 25, 123, 10.3, 8.7, c.dark, bold);
    const included = isBuy ? [
      ['equipment', 'Equipamiento educativo', `${quote.quantity} equipos para crear proyectos en el aula.`],
      ['launch', 'Puesta en marcha', 'Orientación para comenzar a usarlos.'],
      ['training', 'Capacitación de uso', 'Una hora de formación sobre el equipo.'],
      ['extra', 'Formación adicional', 'Horas extra disponibles por cotización.']
    ] : [
      ['equipment', 'Equipamiento educativo', `${quote.quantity} equipos para crear proyectos en el aula.`],
      ['planning', 'Planificación docente', 'Guías y retos alineados con el CNB.'],
      ['training', 'Capacitación docente', 'Formación para enseñar con el equipo.'],
      ['integration', 'Integración tecnológica', 'Orientación para incorporarlo en clase.'],
      ['platform', 'Socrates Aprende', 'Recursos docentes y acceso según el grado.'],
      ['support', 'Soporte y seguimiento', `Acompañamiento durante los ${quote.offer.months} meses.`]
    ];
    const serviceTop = isBuy ? 492 : 455;
    const serviceH = isBuy ? 75 : 70;
    included.forEach(([symbol, title, description], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = M + col * 264, top = serviceTop + row * (serviceH + 7);
      box(p2, x, top, 257, serviceH, c.white, 0, c.border);
      icon(p2, symbol, x + 11, top + 13);
      putFit(p2, title, x + 56, top + 11, 190, 11.5, 9.8, c.dark, bold);
      paragraph(p2, description, x + 56, top + 34, 188, 9.5, 13, c.gray, regular, 2);
    });
    const ownership = quote.key === 'BUY' ? 'El colegio adquiere los equipos desde el inicio.' :
      quote.key === 'RENT' ? 'Los equipos se devuelven a GuateGeeks al finalizar.' :
      quote.key === 'EVO16' ? 'Al completar los 2 ciclos de 8 meses, los equipos quedan en el colegio.' :
      'Al completar el ciclo de 8 meses, los equipos quedan en el colegio.';
    const platform = quote.key === 'BUY' ? 'Socrates Aprende no está incluido. Se puede cotizar por separado.' :
      quote.tech === 'TaleBot' || quote.tech === 'Robot Master'
        ? 'Para esta etapa hay recursos docentes. Contenido estudiantil disponible hoy para 6.º primaria y, gradualmente, 5.º. Vigencia acordada con GuateGeeks.'
        : 'Contenido estudiantil disponible hoy para 6.º primaria y, gradualmente, 5.º. Incluye recursos docentes. Vigencia acordada con GuateGeeks.';
    const closingTop = isBuy ? 662 : 696;
    box(p2, M, closingTop, CW, 79, c.paleBlue);
    eyebrow(p2, 'DESTINO DEL EQUIPO', M + 12, closingTop + 11);
    paragraph(p2, ownership, M + 12, closingTop + 28, 203, 9.3, 12.5, c.dark, regular, 4);
    box(p2, M + 226, closingTop + 12, 1, 55, c.border);
    eyebrow(p2, 'SOCRATES APRENDE', M + 240, closingTop + 11);
    paragraph(p2, platform, M + 240, closingTop + 28, CW - 252, 8.8, 11.5, c.dark, regular, 4);
    if (quote.note) paragraph(p2, `Nota: ${quote.note}`, M, closingTop + 87, CW, 8.2, 10, c.gray, regular, 3);

    if (quote.projection) {
      const p3 = doc.addPage([W, H]);
      background(p3);
      header(p3);
      eyebrow(p3, '03 / PROYECCIÓN INSTITUCIONAL', M, 117);
      put(p3, 'Cuota e ingresos', M, 139, 26, c.dark, bold);
      put(p3, 'del programa.', M, 171, 26, c.cyan, bold);
      paragraph(p3, `Escenario con ${quote.students} estudiantes durante ${quote.offer.months} meses de ${modality[quote.key]}. La institución decide cuánto cobrar a cada familia.`, M, 215, CW, 10.4, 16, c.gray, regular, 3);
      const perStudent = quote.offer.net / quote.students / quote.offer.months;
      const monthlyIncome = quote.offer.suggested * quote.students;
      const differenceWithoutTax = quote.offer.revenue - quote.offer.net;
      const differenceWithTax = quote.offer.revenue - quote.offer.gross;
      const half = (CW - 10) / 2;
      box(p3, M, 275, half, 130, c.paleBlue);
      eyebrow(p3, 'COBRO SUGERIDO', M + 15, 289);
      putFit(p3, money(quote.offer.suggested), M + 15, 315, half - 30, 26, 20, c.dark, bold);
      paragraph(p3, 'Por estudiante cada mes. Es una referencia; el colegio fija su cuota final.', M + 15, 360, half - 30, 9.2, 13, c.gray, regular, 3);
      box(p3, M + half + 10, 275, half, 130, c.pale);
      eyebrow(p3, 'INVERSIÓN EQUIVALENTE', M + half + 25, 289);
      putFit(p3, money(perStudent), M + half + 25, 315, half - 30, 26, 20, c.dark, bold);
      paragraph(p3, 'Inversión sin IVA, distribuida por estudiante y mes.', M + half + 25, 360, half - 30, 9.2, 13, c.gray, regular, 3);

      eyebrow(p3, 'ASÍ SE FORMA EL RESULTADO', M, 428);
      const rows = [
        ['Ingreso mensual estimado', money(monthlyIncome)],
        [`Ingreso total · ${quote.offer.months} meses`, money(quote.offer.revenue)],
        ['Inversión en GuateGeeks · sin IVA', money(quote.offer.net)]
      ];
      rows.forEach(([title, value], index) => {
        const top = 451 + index * 38;
        box(p3, M, top, CW, 38, index % 2 ? c.white : c.pale);
        put(p3, title, M + 15, top + 11, 10.1, c.ink);
        putRight(p3, value, M + CW - 15, top + 9, 12.5, c.dark, bold);
      });
      box(p3, M, 578, CW, 100, c.dark);
      eyebrow(p3, 'DIFERENCIA ESTIMADA · SIN IVA', M + 17, 593, c.white);
      putFit(p3, money(differenceWithoutTax), M + 17, 614, CW - 34, 28, 20, c.white, bold);
      put(p3, 'Ingreso estimado menos inversión sin IVA; antes de gastos propios.', M + 17, 652, 9, c.white);
      paragraph(p3, `Si corresponde pagar IVA, la diferencia sería ${money(differenceWithTax)}. El IVA y el total a pagar se desglosan en la primera página. Esta proyección no descuenta docentes, administración, infraestructura ni otros gastos e impuestos del colegio; no representa utilidad neta.`, M, 700, CW, 9.2, 14, c.gray, regular, 5);
    }
    return doc.save();
  }

  async function submit(event) {
    event.preventDefault();
    showError('');
    if (!form.reportValidity()) return;
    const selectedLevels = isMulti() ? activeLevels() : null;
    if (selectedLevels ? (!selectedLevels.length || selectedLevels.some(level => level.invalid)) : !validScenario()) {
      showError('Verifica los niveles, equipos y estudiantes de la cotización.');
      return;
    }
    if (!el('quote-school').value.trim()) { showError('Escribe el nombre de la institución educativa.'); el('quote-school').focus(); return; }
    const quote = buildQuoteData();
    download.disabled = true;
    download.textContent = 'Preparando PDF…';
    try {
      if (!window.PDFLib) throw new Error('No se pudo cargar el generador de PDF.');
      const bytes = await makePdf(quote);
      const url = URL.createObjectURL(new Blob([bytes], {type: 'application/pdf'}));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `GuateGeeks-cotizacion-${slug(quote.school)}-${slug(modality[quote.key])}${quote.scope === 'multi' ? '-multinivel' : ''}.pdf`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      dialog.close();
    } catch (cause) {
      showError('No se pudo generar el PDF. Inténtalo de nuevo.');
      console.error('Cotización PDF:', cause);
    } finally {
      download.textContent = 'Descargar PDF';
      refreshSnapshot();
    }
  }

  el('quote-open').addEventListener('click', () => {
    const selected = el('mode').value;
    mode.value = selected === 'ALL' ? 'EVO16' : selected;
    scope.value = 'single';
    el('quote-bims').value = el('bims').value;
    el('quote-down').value = `.${Math.round(Number(el('down').value) * 10)}`;
    refreshSnapshot();
    showError('');
    dialog.showModal();
    el('quote-school').focus();
  });
  el('quote-close').addEventListener('click', () => dialog.close());
  el('quote-cancel').addEventListener('click', () => dialog.close());
  mode.addEventListener('change', refreshSnapshot);
  scope.addEventListener('change', refreshSnapshot);
  el('quote-bims').addEventListener('change', refreshSnapshot);
  el('quote-down').addEventListener('change', refreshSnapshot);
  levelsContainer.addEventListener('input', refreshSnapshot);
  levelsContainer.addEventListener('change', refreshSnapshot);
  form.addEventListener('submit', submit);
})();
