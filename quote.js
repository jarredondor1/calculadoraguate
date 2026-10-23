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

  async function makePdf(quote) {
    return window.GuateGeeksQuotePdf.generate(quote, {visual, modality});
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
