/* Cotización institucional: mismo cálculo del simulador, presentación lista para PDF. */
(() => {
  const el = id => document.getElementById(id);
  const dialog = el('quote-dialog');
  const form = el('quote-form');
  const mode = el('quote-mode');
  const error = el('quote-error');
  const download = el('quote-download');
  const modality = {BUY: 'INTEGRA', RENT: 'FLEX', EVO8: 'EVOLUCIONA 8', EVO16: 'EVOLUCIONA 16'};
  const money = value => `Q ${Number(value).toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  const dateText = date => new Intl.DateTimeFormat('es-GT', {day: '2-digit', month: 'long', year: 'numeric'}).format(date);
  const slug = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 45) || 'institucion';
  const visual = {
    Spike: {product: 'spikeProduct', classroom: 'spikeClass', idea: 'Un robot que interpreta su entorno', verbs: ['Explora', 'Construye', 'Programa']},
    'Robot Master': {product: 'robotMasterProduct', classroom: 'robotMasterClass', idea: 'Un robot con movimiento y sensores', verbs: ['Explora', 'Ensambla', 'Prueba']},
    Snap: {product: 'snapProduct', classroom: 'snapClass', idea: 'Un circuito que cobra vida', verbs: ['Investiga', 'Conecta', 'Comprueba']},
    TaleBot: {product: 'talebotProduct', classroom: 'talebotClass', idea: 'Un recorrido con instrucciones', verbs: ['Imagina', 'Ordena', 'Descubre']},
    Meta: {product: 'vrProduct', classroom: 'vrClass', idea: 'Una experiencia inmersiva', verbs: ['Observa', 'Diseña', 'Explora']},
    Drones: {product: 'droneProduct', classroom: 'ideaClass', idea: 'Una misión de vuelo segura', verbs: ['Planifica', 'Programa', 'Vuela']}
  };

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

  function refreshSnapshot() {
    if (!validScenario()) {
      el('quote-snapshot').textContent = 'Ingresa cantidades válidas de equipos y estudiantes antes de cotizar.';
      download.disabled = true;
      return;
    }
    download.disabled = false;
    const data = calc();
    const offer = data[mode.value];
    const projection = el('quote-projection');
    projection.disabled = mode.value === 'BUY';
    if (projection.disabled) projection.checked = false;
    el('quote-snapshot').innerHTML = `<div><span>PROGRAMA Y ESCENARIO</span><strong>${data.t.name} · ${data.qty} equipos · ${data.students} estudiantes</strong></div><div><span>INVERSIÓN ${modality[mode.value]} SIN IVA</span><strong>${money(offer.net)}</strong><small>Con IVA: ${money(offer.gross)}</small></div>`;
  }

  function buildQuoteData() {
    const data = calc();
    const key = mode.value;
    const offer = data[key];
    const issued = new Date();
    const expires = new Date(issued);
    expires.setDate(expires.getDate() + Number(el('quote-validity').value));
    return {
      school: el('quote-school').value.trim().replace(/\s+/g, ' '),
      contact: el('quote-contact').value.trim(),
      email: el('quote-email').value.trim(),
      location: el('quote-location').value.trim(),
      note: el('quote-note').value.trim(),
      projection: key !== 'BUY' && el('quote-projection').checked,
      issued, expires, key, tech: el('tech').value,
      program: data.t.name, level: data.t.level,
      quantity: data.qty, students: data.students,
      offer: {
        net: offer.net, tax: offer.tax, gross: offer.gross,
        months: offer.months, initial: offer.initial,
        installment: offer.installment, suggested: offer.suggested,
        revenue: offer.revenue, contribution: offer.contribution
      }
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
    doc.setSubject(`${modality[quote.key]} · ${quote.program}`);
    doc.setCreator('Simulador GuateGeeks');
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const W = 595.28, H = 841.89, M = 37, CW = W - M * 2;
    const rgbHex = hex => rgb(...[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255));
    const c = {
      cyan: rgbHex('#138cb1'), dark: rgbHex('#184455'), ink: rgbHex('#263746'),
      gray: rgbHex('#66717a'), pale: rgbHex('#f2f8fa'), paleBlue: rgbHex('#e3f3f8'),
      border: rgbHex('#d8e5e9'), white: rgb(1, 1, 1), coral: rgbHex('#ed8660'),
      cream: rgbHex('#fff6ed'), green: rgbHex('#17836e'), paleGreen: rgbHex('#e9f5f1')
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
    const logo = await getImage('logo');
    const pages = quote.projection ? 3 : 2;
    const header = (page, number) => {
      box(page, 0, 0, W * .35, 7, c.gray);
      box(page, W * .35, 0, W * .65, 7, c.cyan);
      page.drawImage(logo, {x: M, y: H - 86, width: 56, height: 56});
      put(page, 'GUATEGEEKS  /  PROPUESTA EDUCATIVA', 106, 40, 9, c.dark, bold);
      put(page, 'Imagina, diseña y crea.', 106, 59, 10, c.cyan, regular);
      put(page, `${String(number).padStart(2, '0')} / ${String(pages).padStart(2, '0')}`, 514, 50, 9, c.gray, bold);
      rule(page, M, 97, CW);
    };
    const footer = (page, number) => {
      rule(page, M, 785, CW);
      put(page, 'GuateGeeks  ·  Cotización sujeta a confirmación comercial', M, 796, 8, c.gray);
      put(page, `${String(number).padStart(2, '0')}  /  ${String(pages).padStart(2, '0')}`, 514, 796, 8, c.cyan, bold);
    };
    const v = visual[quote.tech];
    if (!v) throw new Error('Tecnología no reconocida para el PDF.');
    const productCaption = quote.tech === 'Drones' ? 'Imagen conceptual del dron' :
      quote.tech === 'Spike' ? 'Modelo: RoboRiseIT / I. Khlebnikov' : 'Referencia visual del equipo';

    const p1 = doc.addPage([W, H]);
    header(p1, 1);
    putFit(p1, `PROPUESTA PARA ${quote.school}`.toUpperCase(), M, 113, CW, 8.5, 7, c.cyan, bold);
    put(p1, 'Crear es aprender', M, 134, 27, c.dark, bold);
    put(p1, 'haciendo.', M, 168, 27, c.cyan, bold);
    paragraph(p1, `${quote.program} para ${quote.level}. Una experiencia donde el alumnado imagina, diseña y crea con tecnología.`, M, 210, CW, 10.5, 15, c.gray, regular, 2);
    const cycle = quote.key === 'EVO16' ? '2 ciclos de 8 meses' : quote.key === 'EVO8' ? '1 ciclo de 8 meses' : quote.key === 'RENT' ? `${quote.offer.months} meses de programa` : 'Compra directa';
    box(p1, M, 250, CW, 25, c.paleBlue);
    putFit(p1, `${modality[quote.key]}   ·   ${quote.quantity} equipos   ·   ${quote.students} estudiantes   ·   ${cycle}`, M + 11, 256, CW - 22, 9.1, 7.2, c.dark, bold);
    await imageBox(p1, v.classroom, M, 287, 324, 157);
    await imageBox(p1, v.product, M + 334, 287, CW - 334, 157, c.white);
    box(p1, M, 444, CW, 17, c.white);
    put(p1, 'Imagen conceptual del aprendizaje', M, 448, 7.3, c.gray);
    put(p1, productCaption, M + 334, 448, 7.3, c.gray);

    box(p1, M, 473, CW, 220, c.white, 0, c.border);
    box(p1, M, 473, 5, 220, c.cyan);
    eyebrow(p1, 'INVERSIÓN DEL PROGRAMA', M + 18, 489);
    put(p1, modality[quote.key], M + 18, 504, 12, c.dark, bold);
    put(p1, 'Total sin IVA', M + 18, 527, 9.5, c.gray);
    put(p1, money(quote.offer.net), M + 18, 543, 29, c.dark, bold);
    rule(p1, M + 18, 584, CW - 36);
    put(p1, 'IVA (12 %)', M + 18, 591, 9, c.gray);
    put(p1, money(quote.offer.tax), M + 122, 591, 9, c.gray, bold);
    put(p1, 'Total con IVA', M + 278, 591, 9, c.gray);
    put(p1, money(quote.offer.gross), M + 369, 591, 9, c.dark, bold);
    rule(p1, M + 18, 614, CW - 36);
    const payment = quote.key === 'BUY'
      ? [['PAGO', 'Compra directa'], ['PLAZO', 'Pago de contado'], ['EQUIPO', 'Propiedad inmediata']]
      : [['AL INICIAR · CON IVA', money(quote.offer.initial)],
        [`${quote.offer.months} CUOTAS · CON IVA`, money(quote.offer.installment)],
        ['AL FINALIZAR', quote.key === 'RENT' ? 'Se devuelve' : 'Equipo propio']];
    payment.forEach(([heading, value], i) => {
      const x = M + 18 + i * 165;
      box(p1, x, 627, 156, 51, i === 2 ? c.paleBlue : c.pale);
      put(p1, heading, x + 8, 636, 7.1, c.gray, bold);
      paragraph(p1, value, x + 8, 650, 140, 10.4, 12.5, c.dark, bold, 2);
    });
    put(p1, `Emitida: ${dateText(quote.issued)}  ·  Vigente hasta: ${dateText(quote.expires)}`, M, 711, 8.5, c.gray);
    const contact = [quote.contact, quote.email, quote.location].filter(Boolean).join('  ·  ');
    if (contact) paragraph(p1, `Para: ${contact}`, M, 729, CW, 8.5, 12, c.gray, regular, 2);
    put(p1, 'Importes en quetzales. El alcance y las condiciones finales se confirman con GuateGeeks.', M, 761, 7.8, c.gray);
    footer(p1, 1);

    const p2 = doc.addPage([W, H]);
    header(p2, 2);
    eyebrow(p2, 'EXPERIENCIA EDUCATIVA', M, 113);
    put(p2, 'Del primer reto a una', M, 133, 25, c.dark, bold);
    put(p2, 'creación propia.', M, 164, 25, c.cyan, bold);
    paragraph(p2, `${quote.program}: ${v.idea.toLowerCase()}. Un camino guiado para que cada equipo explore, construya y comparta lo aprendido.`, M, 203, CW, 10.1, 15, c.gray, regular, 2);
    const gap = 9, cardW = (CW - gap * 2) / 3;
    const cards = [
      {image: v.classroom, title: v.verbs[0]},
      {image: 'designClass', title: v.verbs[1]},
      {image: v.product, title: v.verbs[2]}
    ];
    for (let i = 0; i < cards.length; i++) {
      const x = M + i * (cardW + gap);
      box(p2, x, 251, cardW, 169, c.white, 0, c.border);
      await imageBox(p2, cards[i].image, x + 1, 252, cardW - 2, 125, i === 2 ? c.white : c.pale);
      put(p2, `0${i + 1}  ${cards[i].title}`, x + 10, 384, 11, c.dark, bold);
      put(p2, i === 2 ? (quote.tech === 'Drones' ? 'Imagen conceptual' : 'Equipo de referencia') : 'Imagen conceptual', x + 10, 402, 7.5, c.gray);
    }
    eyebrow(p2, `QUÉ INCLUYE ${modality[quote.key]}`, M, 441);
    const included = quote.key === 'BUY' ? [
      ['Equipamiento educativo', 'Propiedad del colegio desde la compra.'],
      ['Puesta en marcha', 'Orientación inicial para usar el equipo en el aula.'],
      ['Capacitación de uso', 'Incluye 1 hora de formación sobre el equipo.'],
      ['Tiempo adicional', 'Las horas extra se cotizan por separado.']
    ] : [
      ['Equipamiento educativo', quote.key === 'RENT' ? 'Uso temporal; se devuelve al finalizar.' : 'Queda en el colegio al completar el programa.'],
      ['Planificación docente', 'Actividades alineadas con el CNB.'],
      ['Capacitación', 'Formación para facilitar actividades con el equipo.'],
      ['Integración tecnológica', 'Orientación para llevar la experiencia al aula.'],
      ['Socrates Aprende', 'Recursos para docentes y contenido según fase.'],
      ['Soporte', 'Acompañamiento durante el programa.']
    ];
    const serviceH = quote.key === 'BUY' ? 83 : 69;
    included.forEach(([title, description], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = M + col * 264, top = 462 + row * (serviceH + 7);
      box(p2, x, top, 257, serviceH, c.white, 0, c.border);
      box(p2, x + 10, top + 13, 18, 18, c.paleBlue);
      put(p2, String(i + 1).padStart(2, '0'), x + 14, top + 16, 8, c.cyan, bold);
      put(p2, title, x + 37, top + 12, 10.2, c.dark, bold);
      paragraph(p2, description, x + 11, top + 35, 231, 8.8, 12.5, c.gray, regular, 3);
    });
    if (quote.key === 'BUY') {
      box(p2, M, 654, CW, 79, c.paleBlue);
      eyebrow(p2, 'ACCESO A SOCRATES APRENDE', M + 12, 666);
      paragraph(p2, 'No está incluido en INTEGRA. Puede conversarse por separado con GuateGeeks.', M + 12, 684, CW - 24, 9.5, 14, c.dark, regular, 2);
    } else {
      box(p2, M, 692, CW, 65, c.paleBlue);
      eyebrow(p2, 'SOCRATES APRENDE', M + 12, 701);
      paragraph(p2, 'Contenido estudiantil disponible hoy para 6.º primaria; se ampliará gradualmente a 5.º. Hay recursos docentes para los programas. El tiempo de acceso se acuerda con GuateGeeks.', M + 12, 717, CW - 24, 8.3, 11.8, c.dark, regular, 3);
    }
    if (quote.note) paragraph(p2, `Nota: ${quote.note}`, M, quote.key === 'BUY' ? 743 : 760, CW, 7.2, 8, c.gray, regular, 3);
    footer(p2, 2);

    if (quote.projection) {
      const p3 = doc.addPage([W, H]);
      header(p3, 3);
      eyebrow(p3, 'PROYECCIÓN PARA LA INSTITUCIÓN', M, 117);
      put(p3, 'Una cuota clara para', M, 140, 26, c.dark, bold);
      put(p3, 'tomar decisiones.', M, 172, 26, c.cyan, bold);
      paragraph(p3, `Referencia para ${quote.students} estudiantes durante ${quote.offer.months} meses con ${modality[quote.key]}. El colegio decide el cobro final a sus familias.`, M, 217, CW, 10.3, 16, c.gray, regular, 3);
      box(p3, M, 278, CW, 112, c.paleBlue);
      eyebrow(p3, 'COBRO MENSUAL SUGERIDO POR ESTUDIANTE', M + 18, 297);
      put(p3, money(quote.offer.suggested), M + 18, 321, 31, c.dark, bold);
      put(p3, 'Cada estudiante  ·  cada mes', M + 18, 366, 9, c.gray);
      box(p3, M, 407, CW, 106, c.pale);
      eyebrow(p3, 'INGRESOS ESTIMADOS DEL PROGRAMA', M + 18, 423);
      put(p3, money(quote.offer.revenue), M + 18, 447, 25, c.dark, bold);
      put(p3, `${quote.students} estudiantes  ×  ${quote.offer.months} meses`, M + 18, 485, 9, c.gray);
      box(p3, M, 529, CW, 114, c.paleGreen);
      eyebrow(p3, 'DIFERENCIA BRUTA ESTIMADA', M + 18, 546, c.green);
      put(p3, money(quote.offer.contribution), M + 18, 571, 28, c.green, bold);
      put(p3, 'Después de pagar el programa a GuateGeeks; antes de gastos propios.', M + 18, 615, 9, c.gray);
      rule(p3, M, 668, CW);
      put(p3, `${money(quote.offer.revenue)}  -  ${money(quote.offer.gross)} con IVA  =  ${money(quote.offer.contribution)}`, M, 681, 12, c.dark, bold);
      paragraph(p3, 'Proyección orientativa. No descuenta docentes, administración, cobros, infraestructura ni otros gastos de la institución; no representa utilidad neta.', M, 718, CW, 9, 13.5, c.gray, regular, 3);
      footer(p3, 3);
    }
    return doc.save();
  }

  async function submit(event) {
    event.preventDefault();
    showError('');
    if (!form.reportValidity()) return;
    if (!validScenario()) { showError('Verifica las cantidades de equipos y estudiantes.'); return; }
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
    const selected = el('mode').value;
    mode.value = selected === 'ALL' ? 'EVO16' : selected;
    refreshSnapshot();
    showError('');
    dialog.showModal();
    el('quote-school').focus();
  });
  el('quote-close').addEventListener('click', () => dialog.close());
  el('quote-cancel').addEventListener('click', () => dialog.close());
  mode.addEventListener('change', refreshSnapshot);
  form.addEventListener('submit', submit);
})();
