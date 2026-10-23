/* Cotización institucional: mismo cálculo del simulador, presentación lista para PDF. */
(() => {
  const el = id => document.getElementById(id);
  const dialog = el('quote-dialog');
  const form = el('quote-form');
  const mode = el('quote-mode');
  const levelsContainer = el('quote-levels');
  const error = el('quote-error');
  const download = el('quote-download');
  const modality = {BUY: 'INTEGRA', RENT: 'FLEX', EVO8: 'EVOLUCIONA 8', EVO16: 'EVOLUCIONA 16'};
  const money = value => `Q ${Number(value).toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  const countText = (value, singular, plural) => `${value} ${value === 1 ? singular : plural}`;
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
  const gradeGroups = [
    {label: 'Preprimaria', grades: [
      {id: 'pk', label: 'Pre-Kínder'}, {id: 'k', label: 'Kínder'}, {id: 'prep', label: 'Preparatoria'}
    ]},
    {label: 'Primaria', grades: [1, 2, 3, 4, 5, 6].map(n => ({id: `p${n}`, label: `${n}.º primaria`}))},
    {label: 'Básicos', grades: [1, 2, 3].map(n => ({id: `b${n}`, label: `${n}.º básico`}))},
    {label: 'Bachillerato', grades: [4, 5].map(n => ({id: `h${n}`, label: `${n}.º bachillerato`}))}
  ];
  const allGrades = gradeGroups.flatMap(group => group.grades);
  const gradeById = new Map(allGrades.map(grade => [grade.id, grade]));
  const defaultGradeIds = tech => tech === 'TaleBot' ? ['pk', 'k', 'prep'] : tech === 'Robot Master' ? ['p1', 'p2', 'p3'] : ['p4', 'p5', 'p6'];
  const techGuidance = {
    Spike: 'Spike Prime: recomendado desde 4.º primaria; el mismo kit puede servir a básicos y bachillerato con retos más avanzados.',
    'Robot Master': 'Robot Master: punto de partida sugerido para 1.º a 3.º primaria. Ajusta los grados según el proyecto.',
    TaleBot: 'TaleBot: punto de partida sugerido para preprimaria. Ajusta los grados según el proyecto.',
    Snap: 'Electrónica: selecciona los grados que participarán en los retos de circuitos.',
    Meta: 'Realidad virtual: selecciona los grados que compartirán los visores.',
    Drones: 'Drones: selecciona los grados que compartirán los equipos de vuelo.'
  };
  const gradeLabel = details => details.map(grade => grade.label).join(' · ');
  function renderGrades(container, selected = {}) {
    container.replaceChildren();
    const heading = document.createElement('div');
    heading.className = 'quote-grade-heading';
    heading.innerHTML = '<strong>Grados y estudiantes que compartirán el kit</strong><small>Selecciona los grados que la institución atenderá. Cada grupo de equipos se cotiza una sola vez.</small>';
    container.append(heading);
    gradeGroups.forEach(group => {
      const section = document.createElement('div');
      section.className = 'quote-grade-group';
      const title = document.createElement('strong');
      title.className = 'quote-grade-group-title';
      title.textContent = group.label;
      section.append(title);
      group.grades.forEach(grade => {
        const row = document.createElement('div');
        row.className = 'quote-grade-row';
        row.dataset.grade = grade.id;
        const label = document.createElement('label');
        label.className = 'quote-grade-chip';
        const check = document.createElement('input');
        check.type = 'checkbox';
        check.className = 'quote-grade-check';
        check.value = grade.id;
        check.checked = Object.hasOwn(selected, grade.id);
        label.append(check, document.createTextNode(grade.label));
        const studentLabel = document.createElement('label');
        studentLabel.className = 'quote-grade-students-label';
        studentLabel.textContent = 'Estudiantes';
        const count = document.createElement('input');
        count.type = 'number'; count.min = '1'; count.max = '100000'; count.step = '1';
        count.className = 'quote-grade-students';
        count.value = selected[grade.id] ?? '';
        count.placeholder = 'Cantidad';
        count.setAttribute('aria-label', `Estudiantes de ${grade.label}`);
        count.disabled = !check.checked;
        studentLabel.append(count);
        row.append(label, studentLabel);
        section.append(row);
      });
      container.append(section);
    });
  }
  const readGrades = picker => [...picker.querySelectorAll('.quote-grade-row')].filter(row => row.querySelector('.quote-grade-check').checked).map(row => ({
    ...gradeById.get(row.dataset.grade), students: Number(row.querySelector('.quote-grade-students').value),
    valid: positiveInteger(row.querySelector('.quote-grade-students').value.trim())
  }));
  const defaultGradeCounts = (tech, students) => {
    const ids = defaultGradeIds(tech);
    const total = Math.max(ids.length, Number(students) || 60);
    return Object.fromEntries(ids.map((id, index) => [id, Math.floor(total / ids.length) + (index < total % ids.length ? 1 : 0)]));
  };
  const technologyOptions = Object.entries(techs).map(([key, item]) => `<option value="${key}">${item.name}</option>`).join('');
  levelsContainer.innerHTML = `<p class="quote-levels-intro">Cada ficha representa un grupo de equipos. Puedes asignarlo a varios grados sin repetir el costo; agrega otra ficha solo si necesitas otro grupo de equipos.</p><div id="quote-level-list" class="quote-level-list"></div><button id="quote-add-level" class="quote-add-level" type="button">+ Agregar otro grupo de equipos</button>`;
  const levelList = el('quote-level-list');
  let nextLevelId = 0;
  const draftKey = 'guategeeks-quote-draft-v2';
  let initialized = false;
  function saveDraft() {
    if (!initialized) return;
    const fields = ['school', 'contact', 'email', 'location', 'validity', 'note', 'projection'];
    const values = Object.fromEntries(fields.map(name => [name, el(`quote-${name}`).type === 'checkbox' ? el(`quote-${name}`).checked : el(`quote-${name}`).value]));
    const levels = [...levelList.children].map(row => ({
      tech: row.querySelector('.quote-level-tech').value,
      qty: row.querySelector('.quote-level-qty').value,
      grades: Object.fromEntries([...row.querySelectorAll('.quote-grade-row')]
        .filter(item => item.querySelector('.quote-grade-check').checked)
        .map(item => [item.dataset.grade, item.querySelector('.quote-grade-students').value])),
      gradeCustomized: row.dataset.gradeCustomized === 'true',
      expanded: row.querySelector('.quote-grade-details').open
    }));
    try { localStorage.setItem(draftKey, JSON.stringify({...values, mode: mode.value, bims: el('quote-bims').value, down: el('quote-down').value, levels})); }
    catch (_) { /* El cotizador sigue funcionando si el navegador bloquea almacenamiento. */ }
  }
  function resetDraft(saved = null) {
    initialized = false;
    const selected = el('mode').value;
    mode.value = saved && modality[saved.mode] ? saved.mode : selected === 'ALL' ? 'EVO16' : selected;
    levelList.replaceChildren();
    nextLevelId = 0;
    el('quote-bims').value = saved?.bims ?? el('bims').value;
    el('quote-down').value = saved?.down ?? `.${Math.round(Number(el('down').value) * 10)}`;
    for (const field of ['school', 'contact', 'email', 'location', 'validity', 'note', 'projection']) {
      const input = el(`quote-${field}`);
      if (saved && Object.hasOwn(saved, field)) {
        if (input.type === 'checkbox') input.checked = Boolean(saved[field]);
        else input.value = saved[field];
      } else if (input.type === 'checkbox') input.checked = false;
      else input.value = field === 'validity' ? '30' : '';
    }
    const levels = saved?.levels?.length ? saved.levels : [{tech: el('tech').value, qty: el('qty').value, students: el('students').value, expanded: true}];
    levels.forEach(level => addLevel(level));
    initialized = true;
    refreshSnapshot();
  }
  function syncLevelControls() {
    [...levelList.children].forEach((row, index) => {
      row.querySelector('.quote-level-title').textContent = `Grupo de equipos ${index + 1}`;
      row.querySelector('.quote-level-remove').disabled = levelList.children.length === 1;
    });
  }
  function addLevel(values = {}) {
    const tech = values.tech || 'Spike';
    const row = document.createElement('section');
    row.className = 'quote-level';
    row.dataset.line = String(++nextLevelId);
    row.dataset.gradeCustomized = String(Boolean(values.gradeCustomized));
    row.innerHTML = `<div class="quote-level-head"><strong class="quote-level-title">Grupo de equipos ${levelList.children.length + 1}</strong><button class="quote-level-remove" type="button" aria-label="Quitar grupo de equipos">Quitar</button></div>
      <div class="quote-level-fields">
        <label class="quote-field">Tecnología <select class="quote-level-tech">${technologyOptions}</select></label>
        <label class="quote-field">Cantidad de equipos <input class="quote-level-qty" type="number" min="1" max="1000" step="1" value="${values.qty ?? 5}"></label>
      </div>
      <p class="quote-tech-note"></p>
      <details class="quote-grade-details" ${values.expanded ? 'open' : ''}><summary><span>Grados incluidos <small class="quote-grade-selection"></small></span><span class="quote-grade-edit">Editar grados</span></summary><div class="quote-grade-picker"></div></details>
      <div class="quote-level-summary"><span class="quote-level-reach"></span><strong class="quote-level-suggested"></strong></div>`;
    levelList.append(row);
    row.querySelector('.quote-level-tech').value = tech;
    row.querySelector('.quote-tech-note').textContent = techGuidance[tech];
    renderGrades(row.querySelector('.quote-grade-picker'), values.grades || defaultGradeCounts(tech, values.students));
    syncLevelControls();
    refreshSnapshot();
    return row;
  }

  function showError(message) {
    error.textContent = message;
    error.hidden = !message;
  }

  const positiveInteger = value => value !== '' && Number.isSafeInteger(Number(value)) && Number(value) > 0;
  const scenarioFor = (tech, qty, students) => calculateScenario({
    tech, qty, students, bims: el('quote-bims').value, down: el('quote-down').value,
    sm: el('schoolMargin').value
  });
  function activeLevels() {
    return [...levelList.children].map((row, index) => {
      const tech = row.querySelector('.quote-level-tech').value;
      const qty = row.querySelector('.quote-level-qty').value.trim();
      const gradeDetails = readGrades(row.querySelector('.quote-grade-picker'));
      row.querySelector('.quote-grade-selection').textContent = gradeDetails.length
        ? `${gradeDetails.length} ${gradeDetails.length === 1 ? 'grado' : 'grados'} · ${gradeDetails.reduce((sum, grade) => sum + (Number.isFinite(grade.students) ? grade.students : 0), 0)} estudiantes`
        : 'Sin grados seleccionados';
      if (!positiveInteger(qty) || !gradeDetails.length || gradeDetails.some(grade => !grade.valid)) {
        row.querySelector('.quote-level-reach').textContent = !gradeDetails.length ? 'Selecciona al menos un grado' : 'Revisa los equipos y estudiantes de cada grado';
        row.querySelector('.quote-level-suggested').textContent = '';
        return {invalid: true};
      }
      const students = gradeDetails.reduce((sum, grade) => sum + grade.students, 0);
      const offer = scenarioFor(tech, qty, students)[mode.value];
      row.querySelector('.quote-level-reach').textContent = `${qty} ${Number(qty) === 1 ? 'equipo' : 'equipos'} · ${students} estudiantes · ${gradeDetails.length} ${gradeDetails.length === 1 ? 'grado' : 'grados'}`;
      row.querySelector('.quote-level-suggested').textContent = mode.value === 'BUY' ? '' : `Cobro sugerido: ${money(offer.suggested)} / estudiante / mes`;
      return {id: `group-${index + 1}`, label: `Grupo de equipos ${index + 1}`, grades: gradeDetails.map(grade => grade.id),
        gradeDetails, gradesLabel: gradeLabel(gradeDetails), tech, program: techs[tech].name,
        lineId: row.dataset.line, sharedFrom: 'own', equipmentQuantity: Number(qty), quantity: Number(qty),
        students, offer};
    });
  }

  function refreshSnapshot() {
    el('quote-shared-terms').hidden = mode.value === 'BUY';
    el('quote-bims-field').hidden = mode.value !== 'RENT';
    el('quote-down-field').hidden = !mode.value.startsWith('EVO');
    const projection = el('quote-projection');
    el('quote-projection-field').hidden = mode.value === 'BUY';
    projection.disabled = mode.value === 'BUY';
    const levels = activeLevels();
    if (!levels.length || levels.some(level => level.invalid)) {
      el('quote-snapshot').textContent = levels.length ? 'Revisa equipos y estudiantes de cada grado.' : 'Agrega al menos un grupo de equipos.';
      download.disabled = true;
      return;
    }
    const net = levels.reduce((sum, level) => sum + level.offer.net, 0);
    const gross = levels.reduce((sum, level) => sum + level.offer.gross, 0);
    const quantity = levels.reduce((sum, level) => sum + level.quantity, 0);
    const students = levels.reduce((sum, level) => sum + level.students, 0);
    const rows = levels.map((level, index) => `<div class="quote-snapshot-line"><strong>${index + 1}. ${level.program}</strong><span>${level.quantity} ${level.quantity === 1 ? 'equipo' : 'equipos'} · ${level.students} estudiantes</span><small>${level.gradesLabel}</small></div>`).join('');
    el('quote-snapshot').innerHTML = `<div class="quote-snapshot-total"><span>ALCANCE CONFIGURADO</span><strong>${levels.length} ${levels.length === 1 ? 'grupo' : 'grupos'} · ${quantity} equipos · ${students} estudiantes</strong></div><div class="quote-snapshot-price"><span>INVERSIÓN ${modality[mode.value]} SIN IVA</span><strong>${money(net)}</strong><small>Con IVA: ${money(gross)}</small></div><div class="quote-snapshot-lines">${rows}</div>`;
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
    const levels = activeLevels().map(level => ({...level, offer: visibleOffer(level.offer)}));
    const totals = ['net', 'tax', 'gross', 'initial', 'installment', 'revenue', 'contribution']
      .reduce((result, field) => ({...result, [field]: levels.reduce((sum, level) => sum + level.offer[field], 0)}), {});
    return {...basics, scope: 'multi', program: 'Programa por grados', levels,
      quantity: levels.reduce((sum, level) => sum + level.quantity, 0),
      students: levels.reduce((sum, level) => sum + level.students, 0),
      offer: {...totals, months: levels[0].offer.months}};
  }

  function dataBytes(uri) {
    const data = atob(uri.slice(uri.indexOf(',') + 1));
    return Uint8Array.from(data, char => char.charCodeAt(0));
  }

  async function makePdf(quote) {
    if (!window.QUOTE_MEDIA) throw new Error('Faltan recursos visuales de la cotización.');
    const {PDFDocument, StandardFonts, rgb, pushGraphicsState, popGraphicsState, rectangle, clip, endPath} = PDFLib;
    const doc = await PDFDocument.create();
    doc.setTitle(`Cotización GuateGeeks · ${quote.school}`);
    doc.setAuthor('GuateGeeks');
    doc.setSubject(`${modality[quote.key]} · ${quote.levels.length} grupos de equipos`);
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
    const imageCover = async (page, key, x, top, width, height) => {
      const image = await getImage(key);
      const scale = Math.max(width / image.width, height / image.height);
      const w = image.width * scale, h = image.height * scale;
      page.pushOperators(pushGraphicsState(), rectangle(x, H - top - height, width, height), clip(), endPath());
      page.drawImage(image, {x: x + (width - w) / 2, y: H - top - (height + h) / 2, width: w, height: h});
      page.pushOperators(popGraphicsState());
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
      box(page, 0, 0, W, H, c.white);
      page.drawCircle({x: W + 70, y: H - 80, size: 118, color: c.paleBlue, opacity: .42});
    };
    const header = page => {
      page.drawImage(logo, {x: M, y: H - 94, width: 79, height: 79});
      put(page, 'GUATEGEEKS', 126, 27, 9, c.cyan, bold);
      put(page, 'Imagina, diseña y crea.', 126, 47, 14, c.dark, bold);
      put(page, 'PROPUESTA EDUCATIVA PERSONALIZADA', 126, 68, 8, c.gray, bold);
      page.drawImage(geekEyes, {x: W - 133, y: H - 95, width: 70, height: 39});
      rule(page, M, 103, CW, c.border, 1);
    };
    const saveInOrder = async order => {
      const ordered = await PDFDocument.create();
      ordered.setTitle(`Cotización GuateGeeks · ${quote.school}`);
      ordered.setAuthor('GuateGeeks');
      ordered.setSubject(`${modality[quote.key]} · ${quote.levels.length} grupos de equipos`);
      ordered.setCreator('Simulador GuateGeeks');
      const pages = await ordered.copyPages(doc, order);
      pages.forEach(page => ordered.addPage(page));
      return ordered.save();
    };
    if (quote.scope === 'multi') {
      const p1 = doc.addPage([W, H]);
      background(p1);
      header(p1);
      eyebrow(p1, 'DESGLOSE ECONÓMICO', M, 120);
      put(p1, 'Inversión de la propuesta', M, 141, 23, c.dark, bold);
      putFit(p1, `Para ${quote.school}`, M, 181, CW, 13, 9, c.dark, bold);
      paragraph(p1, 'Cada grupo de equipos se cotiza una sola vez, aunque lo compartan varios grados. Los importes sin IVA son la referencia principal.', M, 207, CW, 10, 14, c.gray, regular, 2);
      box(p1, M, 239, CW, 72, c.paleBlue);
      eyebrow(p1, 'MODALIDAD DE LA PROPUESTA', M + 14, 249);
      putFit(p1, modality[quote.key], M + 14, 267, 190, 17, 13, c.dark, bold);
      const period = quote.key === 'EVO16' ? '2 ciclos · 16 meses' : quote.key === 'EVO8' ? '1 ciclo · 8 meses' : quote.key === 'BUY' ? 'Compra directa' : `${quote.offer.months} meses de programa`;
      putRight(p1, period, M + CW - 15, 266, 10, c.dark, bold);
      putRight(p1, `${quote.levels.length} ${quote.levels.length === 1 ? 'grupo' : 'grupos'}  ·  ${quote.quantity} equipos  ·  ${quote.students} estudiantes`, M + CW - 15, 287, 9, c.gray);
      eyebrow(p1, quote.levels.length > 4 ? 'RESUMEN DE LA PROPUESTA' : 'INVERSIÓN POR GRUPO', M, 328);
      const summaryLevels = quote.levels.length > 4 ? [] : quote.levels;
      if (!summaryLevels.length) paragraph(p1, `Los ${quote.levels.length} grupos de equipos y sus importes individuales se detallan en las páginas anteriores.`, M, 351, CW, 10, 14, c.gray, regular, 2);
      summaryLevels.forEach((level, index) => {
        const top = 351 + index * 58;
        box(p1, M, top, CW, 54, index % 2 ? c.white : c.pale);
        box(p1, M, top, 3, 54, c.cyan);
        putFit(p1, `${index + 1}. ${level.program}`, M + 13, top + 8, 265, 12, 10, c.dark, bold);
        putFit(p1, `${countText(level.gradeDetails.length, 'grado', 'grados')} · ${countText(level.equipmentQuantity, 'equipo', 'equipos')} · ${level.students} estudiantes`, M + 13, top + 29, 310, 8.6, 7.5, c.gray);
        if (quote.projection) putFit(p1, `Cobro mensual sugerido: ${money(level.offer.suggested)} por estudiante`, M + 13, top + 42, 310, 7.8, 7, c.dark);
        putRight(p1, money(level.offer.net), M + CW - 13, top + 8, 13, c.dark, bold);
        putRight(p1, `sin IVA · con IVA ${money(level.offer.gross)}`, M + CW - 13, top + 31, 8, c.gray);
      });
      const totalTop = 365 + summaryLevels.length * 58 + 19;
      box(p1, M, totalTop, CW, 140, c.dark);
      eyebrow(p1, 'INVERSIÓN TOTAL SIN IVA', M + 17, totalTop + 13, c.white);
      putFit(p1, money(quote.offer.net), M + 17, totalTop + 30, CW - 34, 27, 21, c.white, bold);
      rule(p1, M + 17, totalTop + 68, CW - 34, c.paleBlue);
      put(p1, `IVA (12 %): ${money(quote.offer.tax)}`, M + 17, totalTop + 76, 9.3, c.white);
      putRight(p1, `Total con IVA: ${money(quote.offer.gross)}`, M + CW - 17, totalTop + 76, 9.3, c.white, bold);
      if (quote.key === 'BUY') {
        put(p1, 'Pago único por compra directa', M + 17, totalTop + 98, 9, c.white);
        putRight(p1, 'Equipos propios desde la compra', M + CW - 17, totalTop + 98, 9, c.white);
      } else {
        const initialNet = quote.offer.net * quote.offer.initial / quote.offer.gross;
        const installmentNet = (quote.offer.net - initialNet) / quote.offer.months;
        put(p1, `Inicial sin IVA: ${money(initialNet)}`, M + 17, totalTop + 98, 9, c.white);
        putRight(p1, `${quote.offer.months} cuotas sin IVA: ${money(installmentNet)} / mes`, M + CW - 17, totalTop + 98, 9, c.white);
        put(p1, `Con IVA: ${money(quote.offer.initial)}`, M + 17, totalTop + 115, 8.2, c.paleBlue);
        putRight(p1, `Con IVA: ${money(quote.offer.installment)} / mes`, M + CW - 17, totalTop + 115, 8.2, c.paleBlue);
      }
      put(p1, `Emitida: ${dateText(quote.issued)}  ·  Vigente hasta: ${dateText(quote.expires)}`, M, Math.min(800, totalTop + 153), 8.6, c.gray);
      const contact = [quote.contact, quote.email, quote.location].filter(Boolean).join('  ·  ');
      if (contact) paragraph(p1, `Contacto: ${contact}`, M, Math.min(813, totalTop + 170), CW, 8.4, 11, c.gray, regular, 2);
      if (quote.projection && quote.levels.length <= 2) {
        const projectionTop = totalTop + 185;
        box(p1, M, projectionTop, CW, 109, c.paleBlue);
        eyebrow(p1, 'PROYECCIÓN OPCIONAL DE COBRO POR ESTUDIANTE', M + 13, projectionTop + 10);
        put(p1, 'INGRESOS ESTIMADOS', M + 13, projectionTop + 32, 8, c.dark, bold);
        putFit(p1, money(quote.offer.revenue), M + 13, projectionTop + 46, 222, 16, 13, c.dark, bold);
        put(p1, 'DIFERENCIA ESTIMADA SIN IVA', M + 266, projectionTop + 32, 8, c.dark, bold);
        putFit(p1, money(quote.offer.revenue - quote.offer.net), M + 266, projectionTop + 46, 237, 16, 13, c.dark, bold);
        paragraph(p1, `Antes de gastos propios; no representa utilidad neta. Si corresponde IVA, la diferencia sería ${money(quote.offer.revenue - quote.offer.gross)}.`, M + 13, projectionTop + 77, CW - 26, 8.2, 11, c.gray, regular, 2);
      }
      if (quote.levels.length > 4) {
        eyebrow(p1, 'ALCANCE CONSOLIDADO', M, 589);
        putFit(p1, `${quote.levels.length} grupos de equipos · ${quote.levels.reduce((sum, item) => sum + item.gradeDetails.length, 0)} asignaciones por grado`, M, 612, CW, 11, 9, c.dark, bold);
        paragraph(p1, 'Consulta en las páginas anteriores los grados y estudiantes correspondientes a cada grupo de equipos.', M, 638, CW, 9.5, 14, c.gray, regular, 2);
      }

      const cover = doc.addPage([W, H]);
      background(cover);
      header(cover);
      eyebrow(cover, 'PROPUESTA TÉCNICA Y EDUCATIVA', M, 119);
      put(cover, 'Imagina, diseña', M, 139, 29, c.dark, bold);
      put(cover, 'y crea.', M, 175, 30, c.cyan, bold);
      putFit(cover, `Para ${quote.school}`, M, 220, CW - 10, 14, 10, c.dark, bold);
      paragraph(cover, 'Una propuesta para los grados seleccionados: equipos, experiencia en el aula y servicios según la modalidad elegida.', M, 245, CW, 10, 14, c.gray, regular, 2);
      if (quote.levels.length === 1) {
        const hero = quote.levels[0];
        await imageCover(cover, visual[hero.tech].classroom, M, 291, 330, 159);
        await imageBox(cover, visual[hero.tech].product, M + 339, 291, CW - 339, 159, c.white);
        put(cover, 'EXPERIENCIA EN EL AULA', M, 455, 8, c.cyan, bold);
        put(cover, 'KIT EDUCATIVO', M + 339, 455, 8, c.cyan, bold);
      } else {
        const featured = quote.levels.slice(0, 3);
        const gap = 9, width = (CW - gap * (featured.length - 1)) / featured.length;
        for (const [index, level] of featured.entries()) {
          const x = M + index * (width + gap);
          await imageCover(cover, visual[level.tech].classroom, x, 291, width, 159);
          putFit(cover, level.program, x, 455, width, 8.2, 7, c.cyan, bold);
        }
      }
      eyebrow(cover, 'ALCANCE DE LA COTIZACIÓN', M, 477);
      box(cover, M, 498, CW, 28, c.paleBlue);
      put(cover, 'GRUPO DE EQUIPOS', M + 11, 505, 8, c.dark, bold);
      put(cover, 'EQUIPOS', M + 290, 505, 8, c.dark, bold);
      putRight(cover, 'ESTUDIANTES', M + CW - 12, 505, 8, c.dark, bold);
      quote.levels.slice(0, 4).forEach((level, index) => {
        const top = 526 + index * 34;
        box(cover, M, top, CW, 34, index % 2 ? c.white : c.pale);
        putFit(cover, level.program, M + 11, top + 5, 245, 10.2, 8.7, c.dark, bold);
        putFit(cover, level.gradesLabel, M + 11, top + 20, 260, 7.8, 7, c.gray);
        put(cover, String(level.equipmentQuantity), M + 300, top + 9, 10, c.dark, bold);
        putRight(cover, String(level.students), M + CW - 12, top + 9, 10.2, c.dark, bold);
      });
      if (quote.levels.length > 4) put(cover, `Y ${quote.levels.length - 4} grupos más en las páginas siguientes.`, M, 671, 8.5, c.gray);
      if (quote.levels.length === 1) {
        const totalGrades = quote.levels.reduce((sum, level) => sum + level.gradeDetails.length, 0);
        [['GRADOS', String(totalGrades), 'incluidos'], ['EQUIPOS', String(quote.quantity), 'cotizados una vez'], ['ESTUDIANTES', String(quote.students), 'participantes estimados']]
          .forEach(([label, value, detail], index) => {
            const x = M + index * 176;
            box(cover, x, 591, 169, 71, c.paleBlue);
            eyebrow(cover, label, x + 11, 601);
            put(cover, value, x + 11, 616, 21, c.cyan, bold);
            putFit(cover, detail, x + 50, 630, 109, 8.3, 7.2, c.dark);
          });
      }
      eyebrow(cover, 'HABILIDADES QUE DESARROLLAMOS', M, 684);
      const skills = [
        ['planning', 'Pensamiento computacional'], ['integration', 'Trabajo en equipo'],
        ['launch', 'Solución de problemas'], ['extra', 'Pensamiento crítico'], ['equipment', 'Creatividad']
      ];
      skills.forEach(([symbol, label], index) => {
        const x = M + index * 105;
        box(cover, x, 707, 100, 60, c.pale);
        icon(cover, symbol, x + 33, 712);
        paragraph(cover, label, x + 6, 749, 88, 7.4, 9, c.dark, bold, 2);
      });
      box(cover, M, 782, CW, 28, c.paleBlue);
      putFit(cover, `${modality[quote.key]} · ${quote.quantity} equipos · ${quote.students} estudiantes`, M + 13, 790, CW - 26, 10, 8.5, c.dark, bold);

      for (let start = 0; start < quote.levels.length; start++) {
        const page = doc.addPage([W, H]);
        background(page);
        header(page);
        const level = quote.levels[start];
        box(page, M, 119, CW, 96, c.dark);
        box(page, M, 119, 6, 96, c.cyan);
        eyebrow(page, `EQUIPAMIENTO ${String(start + 1).padStart(2, '0')} / ${String(quote.levels.length).padStart(2, '0')}`, M + 20, 132, c.white);
        putFit(page, level.program, M + 20, 154, CW - 40, 24, 17, c.white, bold);
        putFit(page, `${level.equipmentQuantity} ${level.equipmentQuantity === 1 ? 'equipo' : 'equipos'}  ·  ${level.students} estudiantes  ·  ${level.gradeDetails.length} ${level.gradeDetails.length === 1 ? 'grado' : 'grados'}`, M + 20, 188, CW - 40, 10, 8, c.paleBlue, bold);
        const view = visual[level.tech];
        const imageHeight = level.gradeDetails.length > 9 ? 156 : 208;
        await imageCover(page, view.classroom, M, 235, 324, imageHeight);
        await imageBox(page, view.product, M + 333, 235, CW - 333, imageHeight, c.white);
        put(page, 'EXPERIENCIA EN EL AULA', M, 241 + imageHeight, 8, c.cyan, bold);
        put(page, 'EL KIT EDUCATIVO', M + 333, 241 + imageHeight, 8, c.cyan, bold);
        const tableTop = 274 + imageHeight;
        eyebrow(page, 'GRADOS Y ESTUDIANTES INCLUIDOS', M, tableTop);
        box(page, M, tableTop + 21, CW, 28, c.paleBlue);
        put(page, 'GRADO', M + 13, tableTop + 29, 8.5, c.dark, bold);
        putRight(page, 'ESTUDIANTES', M + CW - 13, tableTop + 29, 8.5, c.dark, bold);
        level.gradeDetails.forEach((grade, index) => {
          const top = tableTop + 49 + index * 22;
          box(page, M, top, CW, 22, index % 2 ? c.white : c.pale);
          putFit(page, grade.label, M + 13, top + 5, CW - 110, 9, 7.8, c.dark, bold);
          putRight(page, String(grade.students), M + CW - 13, top + 5, 9, c.dark, bold);
        });
        const noteTop = tableTop + 49 + level.gradeDetails.length * 22 + 11;
        if (noteTop + 46 < H - 25) {
          box(page, M, noteTop, CW, 46, c.paleBlue);
          eyebrow(page, 'EQUIPOS COMPARTIDOS', M + 12, noteTop + 8);
          putFit(page, `Los ${level.equipmentQuantity} ${level.equipmentQuantity === 1 ? 'equipo se cotiza' : 'equipos se cotizan'} una sola vez para los grados seleccionados.`, M + 12, noteTop + 23, CW - 24, 9, 7.8, c.dark);
        }
      }

      const services = doc.addPage([W, H]);
      background(services);
      header(services);
      eyebrow(services, 'QUÉ RECIBE LA INSTITUCIÓN', M, 119);
      putFit(services, `Qué incluye ${modality[quote.key]}`, M, 142, CW, 24, 20, c.dark, bold);
      putFit(services, `Propuesta para ${quote.school}`, M, 181, CW, 10, 9, c.gray);
      box(services, M, 221, CW, 75, c.paleBlue);
      eyebrow(services, modality[quote.key], M + 14, 233);
      paragraph(services, `${countText(quote.quantity, 'equipo', 'equipos')} en ${countText(quote.levels.length, 'grupo', 'grupos')} para ${quote.students} estudiantes. Cada grupo puede servir a varios grados.`, M + 14, 253, CW - 28, 10, 14, c.dark, regular, 3);
      const included = quote.key === 'BUY' ? [
        ['equipment', 'Equipamiento educativo', 'Kits para los grados detallados en esta propuesta.'],
        ['launch', 'Puesta en marcha', 'Orientación inicial para comenzar a utilizarlos en clase.'],
        ['training', 'Capacitación de uso', 'Una sesión inicial de 1 hora sobre el uso del equipo.']
      ] : [
        ['equipment', 'Equipamiento educativo', 'Kits asignados a los grados de esta propuesta.'],
        ['planning', 'Planificación docente', 'Actividades y guías alineadas con el CNB.'],
        ['training', 'Capacitación docente', 'Formación para utilizar los equipos en clase.'],
        ['integration', 'Integración tecnológica', 'Orientación para incorporarlos en el aula.'],
        ['platform', 'Socrates Aprende', 'Recursos docentes y contenido estudiantil según el grado.'],
        ['support', 'Soporte y seguimiento', `Acompañamiento durante ${quote.offer.months} meses.`]
      ];
      included.forEach(([symbol, title, description], i) => {
        const buy = quote.key === 'BUY';
        const x = M + (buy ? 0 : (i % 2) * 264);
        const top = 321 + (buy ? i : Math.floor(i / 2)) * 77;
        const width = buy ? CW : 257;
        icon(services, symbol, x + 2, top + 6);
        putFit(services, title, x + 49, top + 5, width - 55, 11, 9.5, c.dark, bold);
        paragraph(services, description, x + 49, top + 25, width - 58, 9.2, 12.5, c.gray, regular, 2);
        rule(services, x, top + 67, width, c.border);
      });
      box(services, M, 579, CW, 159, c.paleBlue);
      eyebrow(services, 'DESTINO DEL EQUIPO', M + 13, 591);
      const ownership = quote.key === 'BUY' ? 'En INTEGRA, los equipos son propiedad de la institución desde la compra.' :
        quote.key === 'RENT' ? 'En FLEX, los equipos se devuelven a GuateGeeks al finalizar el programa.' :
        quote.key === 'EVO16' ? 'En EVOLUCIONA 16, los equipos quedan en la institución al completar los dos ciclos de 8 meses.' :
          'En EVOLUCIONA 8, los equipos quedan en la institución al completar el ciclo de 8 meses.';
      paragraph(services, ownership, M + 13, 608, CW - 26, 9.5, 13, c.dark, regular, 3);
      rule(services, M + 13, 652, CW - 26, c.border);
      eyebrow(services, quote.key === 'BUY' ? 'NO INCLUIDO EN LA COMPRA' : 'SOCRATES APRENDE', M + 13, 663);
      const gradeIds = new Set(quote.levels.flatMap(level => level.grades));
      const platformNotes = [];
      if (quote.key === 'BUY') platformNotes.push('Socrates Aprende no forma parte de INTEGRA. Las horas adicionales de capacitación se cotizan por separado.');
      else {
        if (gradeIds.has('p6') || gradeIds.has('p5')) platformNotes.push('Contenido estudiantil disponible hoy para 6.º primaria y gradualmente para 5.º.');
        if (['pk', 'k', 'prep'].some(id => gradeIds.has(id)) || [...gradeIds].some(id => /^p[1-4]$/.test(id))) platformNotes.push('Preprimaria y 1.º a 4.º primaria: recursos docentes.');
        if ([...gradeIds].some(id => /^[bh]/.test(id))) platformNotes.push('Básicos y bachillerato: fases posteriores.');
        platformNotes.push('La vigencia del acceso se acuerda con GuateGeeks.');
      }
      paragraph(services, platformNotes.join(' '), M + 13, 680, CW - 26, 9.1, 12.5, c.dark, regular, 4);
      if (quote.note) paragraph(services, `Nota: ${quote.note}`, M, 755, CW, 8.2, 10, c.gray, regular, 2);

      if (quote.projection && quote.levels.length > 2) {
        for (let start = 0; start < quote.levels.length; start += 4) {
          const projection = doc.addPage([W, H]);
          background(projection);
          header(projection);
          eyebrow(projection, 'PROYECCIÓN INSTITUCIONAL · OPCIONAL', M, 118);
            put(projection, 'Una cuota por estudiante.', M, 139, 24, c.dark, bold);
          paragraph(projection, 'GuateGeeks sugiere una referencia mensual por estudiante; el colegio decide su cobro final. Las diferencias se calculan antes de gastos propios.', M, 181, CW, 10, 15, c.gray, regular, 3);
          const subset = quote.levels.slice(start, start + 4);
          subset.forEach((level, index) => {
            const top = 243 + index * 86;
            box(projection, M, top, CW, 78, index % 2 ? c.white : c.pale, 0, c.border);
            putFit(projection, `${start + index + 1}. ${level.program}`, M + 13, top + 10, CW - 26, 11.5, 9.5, c.dark, bold);
            putFit(projection, `${countText(level.gradeDetails.length, 'grado', 'grados')} · ${level.students} estudiantes · ${countText(level.equipmentQuantity, 'equipo', 'equipos')}`, M + 13, top + 27, CW - 26, 8.4, 7.5, c.gray);
            put(projection, `Sugerido: ${money(level.offer.suggested)} / estudiante / mes`, M + 13, top + 49, 8.8, c.dark);
            putRight(projection, `Ingreso: ${money(level.offer.revenue)}`, M + CW - 13, top + 29, 9.1, c.dark);
            putRight(projection, `Diferencia sin IVA: ${money(level.offer.revenue - level.offer.net)}`, M + CW - 13, top + 49, 9.1, c.dark, bold);
          });
          if (start + subset.length === quote.levels.length) {
            const resultTop = 261 + subset.length * 86;
            box(projection, M, resultTop, CW, 103, c.dark);
            eyebrow(projection, 'DIFERENCIA TOTAL ESTIMADA · SIN IVA', M + 15, resultTop + 13, c.white);
            putFit(projection, money(quote.offer.revenue - quote.offer.net), M + 15, resultTop + 33, CW - 30, 24, 18, c.white, bold);
            put(projection, `Ingresos: ${money(quote.offer.revenue)}  ·  Inversión sin IVA: ${money(quote.offer.net)}`, M + 15, resultTop + 72, 8.8, c.white);
            paragraph(projection, `Si corresponde pagar IVA, la diferencia sería ${money(quote.offer.revenue - quote.offer.gross)}. La proyección no descuenta gastos propios ni representa utilidad neta.`, M, resultTop + 119, CW, 9, 13, c.gray, regular, 4);
          } else put(projection, 'Continúa en la página siguiente.', M, 722, 9, c.gray);
        }
      }
      if (quote.levels.length > 4) {
        for (let start = 0; start < quote.levels.length; start += 8) {
          const finance = doc.addPage([W, H]);
          background(finance);
          header(finance);
          eyebrow(finance, `DESGLOSE DE INVERSIÓN · ${Math.floor(start / 8) + 1}`, M, 120);
          put(finance, 'Importes por grupo.', M, 142, 23, c.dark, bold);
          putFit(finance, `Para ${quote.school} · ${modality[quote.key]}`, M, 180, CW, 10, 8, c.gray);
          quote.levels.slice(start, start + 8).forEach((level, index) => {
            const top = 218 + index * 67;
            box(finance, M, top, CW, 61, index % 2 ? c.white : c.pale);
            box(finance, M, top, 3, 61, c.cyan);
            putFit(finance, `${start + index + 1}. ${level.program}`, M + 13, top + 7, 310, 11.5, 9.5, c.dark, bold);
            putFit(finance, `${countText(level.gradeDetails.length, 'grado', 'grados')} · ${countText(level.equipmentQuantity, 'equipo', 'equipos')} · ${level.students} estudiantes`, M + 13, top + 26, 310, 8.5, 7.2, c.gray);
            if (quote.projection) putFit(finance, `Sugerido: ${money(level.offer.suggested)} / estudiante / mes`, M + 13, top + 43, 310, 8.1, 7, c.dark);
            putRight(finance, money(level.offer.net), M + CW - 13, top + 9, 13, c.dark, bold);
            putRight(finance, `IVA ${money(level.offer.tax)} · con IVA ${money(level.offer.gross)}`, M + CW - 13, top + 34, 8, c.gray);
          });
        }
      }
      const count = doc.getPageCount();
      return saveInOrder([1, ...Array.from({length: count - 2}, (_, i) => i + 2), 0]);
    }
  }

  async function submit(event) {
    event.preventDefault();
    showError('');
    if (!form.reportValidity()) return;
    const selectedLevels = activeLevels();
    if (!selectedLevels.length || selectedLevels.some(level => level.invalid)) {
      showError('Verifica los grupos de equipos y los estudiantes de cada grado.');
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
      anchor.download = `GuateGeeks-cotizacion-${slug(quote.school)}-${slug(modality[quote.key])}.pdf`;
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
    if (!initialized) {
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(draftKey) || 'null'); } catch (_) { /* Se inicia una cotización nueva. */ }
      resetDraft(saved);
    }
    showError('');
    dialog.showModal();
    el('quote-school').focus();
  });
  el('quote-close').addEventListener('click', () => { saveDraft(); dialog.close(); });
  el('quote-cancel').addEventListener('click', () => { saveDraft(); dialog.close(); });
  el('quote-reset').addEventListener('click', () => {
    try { localStorage.removeItem(draftKey); } catch (_) { /* Sin almacenamiento. */ }
    resetDraft();
    el('quote-school').focus();
  });
  mode.addEventListener('change', refreshSnapshot);
  el('quote-bims').addEventListener('change', refreshSnapshot);
  el('quote-down').addEventListener('change', refreshSnapshot);
  el('quote-add-level').addEventListener('click', () => { addLevel({expanded: true}); saveDraft(); });
  levelList.addEventListener('click', event => {
    if (!event.target.closest('.quote-level-remove')) return;
    event.target.closest('.quote-level').remove();
    syncLevelControls();
    refreshSnapshot();
    saveDraft();
  });
  levelList.addEventListener('change', event => {
    if (event.target.matches('.quote-level-tech') && event.target.closest('.quote-level').dataset.gradeCustomized === 'false') {
      const row = event.target.closest('.quote-level');
      const total = readGrades(row.querySelector('.quote-grade-picker')).reduce((sum, grade) => sum + (Number.isFinite(grade.students) ? grade.students : 0), 0);
      renderGrades(row.querySelector('.quote-grade-picker'), defaultGradeCounts(event.target.value, total));
    }
    if (event.target.matches('.quote-level-tech')) event.target.closest('.quote-level').querySelector('.quote-tech-note').textContent = techGuidance[event.target.value];
    if (event.target.matches('.quote-grade-check')) {
      const row = event.target.closest('.quote-level');
      row.dataset.gradeCustomized = 'true';
      const count = event.target.closest('.quote-grade-row').querySelector('.quote-grade-students');
      count.disabled = !event.target.checked;
      if (event.target.checked && !count.value) count.value = '1';
    }
    refreshSnapshot();
  });
  levelsContainer.addEventListener('input', event => {
    if (event.target.matches('.quote-grade-students')) event.target.closest('.quote-level').dataset.gradeCustomized = 'true';
    refreshSnapshot();
  });
  levelsContainer.addEventListener('change', refreshSnapshot);
  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);
  levelsContainer.addEventListener('toggle', saveDraft, true);
  dialog.addEventListener('close', saveDraft);
  form.addEventListener('submit', submit);
})();
