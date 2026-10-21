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
    Spike: {product: 'spikeProduct', classroom: 'spikeClass', design: 'designClass', programming: 'spikeProgramming', level: '4.º primaria a bachillerato', idea: 'Un robot que interpreta su entorno', verbs: ['Explora', 'Construye', 'Programa']},
    'Robot Master': {product: 'robotMasterProduct', classroom: 'robotMasterClass', design: 'robotMasterDesign', level: '1.º a 3.º primaria', idea: 'Un robot con movimiento y sensores', verbs: ['Explora', 'Ensambla', 'Prueba']},
    Snap: {product: 'snapProduct', classroom: 'snapClass', design: 'snapDesign', level: 'primaria y secundaria', idea: 'Un circuito que cobra vida', verbs: ['Investiga', 'Conecta', 'Comprueba']},
    TaleBot: {product: 'talebotProduct', classroom: 'talebotClass', design: 'talebotDesign', level: 'preprimaria', idea: 'Un recorrido con instrucciones', verbs: ['Imagina', 'Ordena', 'Descubre']},
    Meta: {product: 'vrProduct', classroom: 'vrClass', design: 'vrDesign', level: 'tecnología transversal', idea: 'Una experiencia inmersiva', verbs: ['Observa', 'Diseña', 'Explora']},
    Drones: {product: 'droneProduct', classroom: 'dronesClass', design: 'dronesDesign', level: 'tecnología aplicada', idea: 'Una misión de vuelo segura', verbs: ['Planifica', 'Programa', 'Vuela']}
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
      border: rgbHex('#d8e5e9'), white: rgb(1, 1, 1)
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
    const illustrativeProduct = ['Spike', 'Snap', 'Meta', 'Drones'].includes(quote.tech);
    const productCaption = illustrativeProduct ? 'Equipo ilustrativo; modelo por confirmar' : 'Referencia visual del equipo';

    const p1 = doc.addPage([W, H]);
    header(p1, 1);
    eyebrow(p1, 'PROPUESTA PERSONALIZADA', M, 113);
    put(p1, 'Crear es aprender', M, 132, 27, c.dark, bold);
    put(p1, 'haciendo.', M, 165, 27, c.cyan, bold);
    putFit(p1, `Para ${quote.school}`, M, 204, CW, 13, 9, c.dark, bold);
    paragraph(p1, `${quote.program} · ${v.level}. Un programa para imaginar, diseñar y crear con tecnología.`, M, 226, CW, 10.2, 14, c.gray, regular, 2);
    const cycle = quote.key === 'EVO16' ? '2 ciclos de 8 meses' : quote.key === 'EVO8' ? '1 ciclo de 8 meses' : quote.key === 'RENT' ? `${quote.offer.months} meses de programa` : 'Compra directa';
    box(p1, M, 263, CW, 27, c.paleBlue);
    putFit(p1, `${modality[quote.key]}   ·   ${quote.quantity} equipos   ·   ${quote.students} estudiantes   ·   ${cycle}`, M + 11, 270, CW - 22, 9.3, 7.5, c.dark, bold);
    await imageBox(p1, v.classroom, M, 300, 324, 151);
    await imageBox(p1, v.product, M + 334, 300, CW - 334, 151, c.white);
    put(p1, 'Imagen conceptual del aprendizaje', M, 455, 8, c.gray);
    putFit(p1, productCaption, M + 334, 455, CW - 334, 8, 7.2, c.gray);

    box(p1, M, 481, CW, 214, c.white, 0, c.border);
    box(p1, M, 481, 5, 214, c.cyan);
    eyebrow(p1, '01 / INVERSIÓN Y FORMA DE PAGO', M + 18, 496);
    put(p1, modality[quote.key], M + 18, 511, 11, c.dark, bold);
    put(p1, 'Precio total sin IVA', M + 18, 532, 10, c.gray);
    putFit(p1, money(quote.offer.net), M + 18, 548, CW - 40, 29, 20, c.dark, bold);
    rule(p1, M + 18, 589, CW - 36);
    put(p1, 'IVA (12 %)', M + 18, 597, 10, c.gray);
    putRight(p1, money(quote.offer.tax), M + 211, 597, 10, c.dark, bold);
    put(p1, 'Total con IVA', M + 277, 597, 10, c.gray);
    putRight(p1, money(quote.offer.gross), M + CW - 18, 597, 10, c.dark, bold);
    rule(p1, M + 18, 621, CW - 36);
    const initialPercent = Math.round(quote.offer.initial / quote.offer.gross * 100);
    const payment = quote.key === 'BUY'
      ? [['FORMA DE PAGO', 'Compra directa'], ['CUOTAS', 'No aplica'], ['PROPIEDAD', 'Desde la compra']]
      : [[`PAGO INICIAL · ${initialPercent} %`, money(quote.offer.initial)],
        [`${quote.offer.months} PAGOS MENSUALES`, money(quote.offer.installment)],
        ['AL FINALIZAR', quote.key === 'RENT' ? 'Se devuelve' : 'Equipo propio']];
    payment.forEach(([heading, value], i) => {
      const x = M + 18 + i * 165;
      box(p1, x, 632, 156, 50, i === 2 ? c.paleBlue : c.pale);
      put(p1, heading, x + 8, 639, 7.8, c.gray, bold);
      paragraph(p1, value, x + 8, 653, 140, 10.4, 12.5, c.dark, bold, 2);
    });
    put(p1, `Emitida: ${dateText(quote.issued)}  ·  Vigente hasta: ${dateText(quote.expires)}`, M, 712, 9, c.gray);
    const contact = [quote.contact, quote.email, quote.location].filter(Boolean).join('  ·  ');
    if (contact) paragraph(p1, `Contacto: ${contact}`, M, 730, CW, 9, 12, c.gray, regular, 2);
    put(p1, 'Alcance y condiciones sujetos a confirmación comercial.', M, 763, 8, c.gray);
    footer(p1, 1);

    const p2 = doc.addPage([W, H]);
    header(p2, 2);
    eyebrow(p2, '02 / EXPERIENCIA EDUCATIVA', M, 113);
    put(p2, 'Del primer reto a una', M, 132, 25, c.dark, bold);
    put(p2, 'creación propia.', M, 163, 25, c.cyan, bold);
    paragraph(p2, `${quote.program}: ${v.idea.toLowerCase()}. El grupo explora, construye y comparte lo aprendido.`, M, 204, CW, 10.2, 15, c.gray, regular, 2);
    const gap = 9, cardW = (CW - gap * 2) / 3;
    const cards = [
      {image: v.classroom, title: v.verbs[0]},
      {image: v.design, title: v.verbs[1]},
      {image: v.programming || v.product, title: v.verbs[2]}
    ];
    const isBuy = quote.key === 'BUY';
    const visualHeight = isBuy ? 148 : 108;
    for (let i = 0; i < cards.length; i++) {
      const x = M + i * (cardW + gap);
      box(p2, x, 244, cardW, visualHeight + 45, c.white, 0, c.border);
      await imageBox(p2, cards[i].image, x + 1, 245, cardW - 2, visualHeight, i === 2 ? c.white : c.pale);
      put(p2, `0${i + 1}  ${cards[i].title}`, x + 10, 252 + visualHeight, 11, c.dark, bold);
      put(p2, i === 2 && !v.programming ? (illustrativeProduct ? 'Equipo ilustrativo' : 'Equipo de referencia') : 'Imagen conceptual', x + 10, 272 + visualHeight, 8, c.gray);
    }
    eyebrow(p2, `QUÉ RECIBE LA INSTITUCIÓN · ${modality[quote.key]}`, M, isBuy ? 455 : 415);
    const included = isBuy ? [
      ['Equipamiento educativo', `${quote.quantity} equipos para el aula.`],
      ['Puesta en marcha', 'Orientación para comenzar a usarlos.'],
      ['Capacitación de uso', 'Una hora de formación sobre el equipo.'],
      ['Formación adicional', 'Las horas extra se cotizan aparte.']
    ] : [
      ['Equipamiento educativo', `${quote.quantity} equipos para desarrollar el programa.`],
      ['Planificación docente', 'Actividades alineadas con el CNB.'],
      ['Capacitación docente', 'Formación para trabajar con los equipos.'],
      ['Integración tecnológica', 'Orientación para llevar la tecnología al aula.'],
      ['Socrates Aprende', 'Recursos docentes y contenido según grado.'],
      ['Soporte y seguimiento', `Acompañamiento durante ${quote.offer.months} meses.`]
    ];
    const serviceH = isBuy ? 68 : 66;
    included.forEach(([title, description], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = M + col * 264, top = (isBuy ? 475 : 435) + row * (serviceH + 6);
      box(p2, x, top, 257, serviceH, c.white, 0, c.border);
      box(p2, x + 10, top + 11, 18, 18, c.paleBlue);
      put(p2, String(i + 1).padStart(2, '0'), x + 14, top + 14, 8, c.cyan, bold);
      putFit(p2, title, x + 37, top + 10, 208, 10.5, 9, c.dark, bold);
      paragraph(p2, description, x + 11, top + 32, 231, 9.2, 12.5, c.gray, regular, 2);
    });
    const ownership = quote.key === 'BUY' ? 'El colegio adquiere los equipos desde el inicio.' :
      quote.key === 'RENT' ? 'Los equipos se devuelven a GuateGeeks al finalizar.' :
      quote.key === 'EVO16' ? 'Al completar los 2 ciclos de 8 meses, los equipos quedan en el colegio.' :
      'Al completar el ciclo de 8 meses, los equipos quedan en el colegio.';
    const platform = quote.key === 'BUY' ? 'Socrates Aprende no está incluido. Se puede cotizar por separado.' :
      quote.tech === 'TaleBot' || quote.tech === 'Robot Master'
        ? 'Para esta etapa hay recursos docentes. Contenido estudiantil disponible hoy para 6.º primaria y, gradualmente, 5.º. Vigencia acordada con GuateGeeks.'
        : 'Contenido estudiantil disponible hoy para 6.º primaria y, gradualmente, 5.º. Incluye recursos docentes. Vigencia acordada con GuateGeeks.';
    const closingTop = isBuy ? 635 : 658;
    box(p2, M, closingTop, CW, 79, c.paleBlue);
    eyebrow(p2, 'DESTINO DEL EQUIPO', M + 12, closingTop + 11);
    paragraph(p2, ownership, M + 12, closingTop + 28, 203, 9.2, 12.5, c.dark, regular, 4);
    box(p2, M + 226, closingTop + 12, 1, 55, c.border);
    eyebrow(p2, 'SOCRATES APRENDE', M + 240, closingTop + 11);
    paragraph(p2, platform, M + 240, closingTop + 28, CW - 252, 8.8, 11.5, c.dark, regular, 4);
    if (quote.note) paragraph(p2, `Nota: ${quote.note}`, M, isBuy ? 725 : 746, CW, 8.2, 9, c.gray, regular, 4);
    footer(p2, 2);

    if (quote.projection) {
      const p3 = doc.addPage([W, H]);
      header(p3, 3);
      eyebrow(p3, '03 / PROYECCIÓN INSTITUCIONAL', M, 117);
      put(p3, 'Cuota e ingresos', M, 139, 26, c.dark, bold);
      put(p3, 'del programa.', M, 171, 26, c.cyan, bold);
      paragraph(p3, `Escenario con ${quote.students} estudiantes durante ${quote.offer.months} meses de ${modality[quote.key]}. La institución decide cuánto cobrar a cada familia.`, M, 215, CW, 10.4, 16, c.gray, regular, 3);
      const perStudent = quote.offer.gross / quote.students / quote.offer.months;
      const monthlyIncome = quote.offer.suggested * quote.students;
      const half = (CW - 10) / 2;
      box(p3, M, 275, half, 130, c.paleBlue);
      eyebrow(p3, 'COBRO SUGERIDO', M + 15, 289);
      putFit(p3, money(quote.offer.suggested), M + 15, 315, half - 30, 26, 20, c.dark, bold);
      paragraph(p3, 'Por estudiante cada mes. Es una referencia; el colegio fija su cuota final.', M + 15, 360, half - 30, 9.2, 13, c.gray, regular, 3);
      box(p3, M + half + 10, 275, half, 130, c.pale);
      eyebrow(p3, 'INVERSIÓN EQUIVALENTE', M + half + 25, 289);
      putFit(p3, money(perStudent), M + half + 25, 315, half - 30, 26, 20, c.dark, bold);
      paragraph(p3, 'Costo total del programa con IVA, distribuido por estudiante y mes.', M + half + 25, 360, half - 30, 9.2, 13, c.gray, regular, 3);

      eyebrow(p3, 'ASÍ SE FORMA EL RESULTADO', M, 428);
      const rows = [
        ['Ingreso mensual estimado', money(monthlyIncome)],
        [`Ingreso total · ${quote.offer.months} meses`, money(quote.offer.revenue)],
        ['Pago total a GuateGeeks · con IVA', money(quote.offer.gross)]
      ];
      rows.forEach(([title, value], index) => {
        const top = 451 + index * 38;
        box(p3, M, top, CW, 38, index % 2 ? c.white : c.pale);
        put(p3, title, M + 15, top + 11, 10.1, c.ink);
        putRight(p3, value, M + CW - 15, top + 9, 12.5, c.dark, bold);
      });
      box(p3, M, 578, CW, 100, c.dark);
      eyebrow(p3, 'DIFERENCIA BRUTA ESTIMADA', M + 17, 593, c.white);
      putFit(p3, money(quote.offer.contribution), M + 17, 614, CW - 34, 28, 20, c.white, bold);
      put(p3, 'Después de pagar a GuateGeeks; antes de los gastos propios del colegio.', M + 17, 652, 9, c.white);
      paragraph(p3, 'Cálculo: cuota sugerida × estudiantes × meses - pago total del programa con IVA. Es una proyección orientativa; no descuenta docentes, administración, infraestructura, cobros ni impuestos propios. No representa utilidad neta.', M, 704, CW, 9.2, 14, c.gray, regular, 4);
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
