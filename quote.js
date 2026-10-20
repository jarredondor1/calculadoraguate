/* Cotizaciones institucionales: únicamente datos comerciales del escenario. */
(() => {
  const $q = id => document.getElementById(id);
  const dialog = $q('quote-dialog');
  const form = $q('quote-form');
  const mode = $q('quote-mode');
  const error = $q('quote-error');
  const download = $q('quote-download');
  const money = value => `Q ${Number(value).toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  const modality = {BUY: 'INTEGRA', RENT: 'FLEX', EVO8: 'EVOLUCIONA 8', EVO16: 'EVOLUCIONA 16'};
  const palette = {
    plum: [69, 51, 95], purple: [104, 85, 153], coral: [239, 133, 86],
    sky: [95, 186, 214], ink: [48, 43, 61], muted: [98, 91, 107],
    soft: [248, 245, 250], paper: [255, 255, 255], paleSky: [232, 247, 250]
  };

  function showError(message) {
    error.textContent = message;
    error.hidden = !message;
  }

  function validScenario() {
    return ['qty', 'students'].every(id => {
      const value = $q(id).value.trim();
      return value && Number.isSafeInteger(Number(value)) && Number(value) > 0;
    });
  }

  function refreshSnapshot() {
    if (!validScenario()) {
      $q('quote-snapshot').textContent = 'Ingresa cantidades válidas de equipos y estudiantes antes de cotizar.';
      download.disabled = true;
      return;
    }
    download.disabled = false;
    const data = calc();
    const offer = data[mode.value];
    const projection = $q('quote-projection');
    projection.disabled = mode.value === 'BUY';
    if (projection.disabled) projection.checked = false;
    $q('quote-snapshot').innerHTML = `<div><span>PROGRAMA Y ESCENARIO</span><strong>${data.t.name} · ${data.qty} equipos · ${data.students} estudiantes</strong></div><div><span>INVERSIÓN ${modality[mode.value]} SIN IVA</span><strong>${money(offer.net)}</strong><small>Con IVA: ${money(offer.gross)}</small></div>`;
  }

  function openQuote() {
    const selected = $q('mode').value;
    mode.value = selected === 'ALL' ? 'EVO16' : selected;
    refreshSnapshot();
    showError('');
    dialog.showModal();
    $q('quote-school').focus();
  }

  const pdfDate = date => new Intl.DateTimeFormat('es-GT', {day: '2-digit', month: 'long', year: 'numeric'}).format(date);
  const slug = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 45) || 'institucion';

  function buildQuoteData() {
    const data = calc();
    const key = mode.value;
    const offer = data[key];
    const school = $q('quote-school').value.trim().replace(/\s+/g, ' ');
    const issued = new Date();
    const expires = new Date(issued);
    expires.setDate(expires.getDate() + Number($q('quote-validity').value));
    const project = clientProjects[$q('tech').value];
    return {
      school,
      contact: $q('quote-contact').value.trim(),
      email: $q('quote-email').value.trim(),
      location: $q('quote-location').value.trim(),
      note: $q('quote-note').value.trim(),
      projection: key !== 'BUY' && $q('quote-projection').checked,
      issued, expires, key,
      program: data.t.name,
      level: data.t.level,
      quantity: data.qty,
      students: data.students,
      project: {title: project.title, program: project.program, image: project.image, description: project.description, learning: project.learning, status: project.status},
      offer: {
        net: offer.net, tax: offer.tax, gross: offer.gross, months: offer.months,
        initial: offer.initial, installment: offer.installment,
        perGross: offer.perGross, suggested: offer.suggested,
        revenue: offer.revenue, contribution: offer.contribution
      }
    };
  }

  function scopeFor(quote) {
    if (quote.key === 'BUY') return [
      'Equipos en propiedad del colegio desde la compra.',
      'Orientación para la puesta en marcha en el aula.',
      'Una hora de capacitación para uso del equipo; horas adicionales se cotizan aparte.'
    ];
    const items = [
      `Uso del equipamiento durante ${quote.offer.months} meses.`,
      'Capacitación docente e integración tecnológica.',
      'Seguimiento y soporte durante el programa.'
    ];
    items.push(quote.key === 'RENT'
      ? 'El equipo se devuelve a GuateGeeks al finalizar el período.'
      : 'El equipo queda en propiedad del colegio al completar el programa.');
    return items;
  }

  function platformText(quote) {
    if (quote.key === 'BUY') return 'Socrates Aprende no está incluido en INTEGRA.';
    return 'Socrates Aprende: recursos docentes incluidos. Contenido para estudiantes en fase actual: 4.º a 6.º primaria. De preprimaria a 3.º primaria, acceso docente. Básico y bachillerato se incorporarán en fases posteriores. El tiempo de acceso se acuerda con GuateGeeks.';
  }

  async function fetchImage(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
    return response.arrayBuffer();
  }

  function logoBytes() {
    const source = document.querySelector('.logo img').src;
    const bytes = atob(source.split(',')[1]);
    return Uint8Array.from(bytes, char => char.charCodeAt(0));
  }

  async function makePdf(quote) {
    const {PDFDocument, StandardFonts, rgb} = PDFLib;
    const doc = await PDFDocument.create();
    doc.setTitle(`Cotización GuateGeeks · ${quote.school}`);
    doc.setAuthor('GuateGeeks');
    doc.setSubject(`${modality[quote.key]} · ${quote.program}`);
    doc.setCreator('Simulador GuateGeeks');
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const W = 595.28, H = 841.89;
    const color = key => rgb(...palette[key].map(component => component / 255));
    const safe = (value, font = regular) => [...String(value || '')].map(char => {
      if (char === '\n') return char;
      try { font.encodeText(char); return char; } catch (_) { return '?'; }
    }).join('');
    const rect = (page, x, top, width, height, fill, opacity = 1) => page.drawRectangle({x, y: H - top - height, width, height, color: color(fill), opacity});
    const line = (page, x1, top1, x2, top2, fill = 'soft', width = 1) => page.drawLine({start: {x: x1, y: H - top1}, end: {x: x2, y: H - top2}, thickness: width, color: color(fill)});
    const put = (page, value, x, top, size = 11, fill = 'ink', font = regular) => {
      const text = safe(value, font);
      page.drawText(text, {x, y: H - top - size, size, font, color: color(fill)});
    };
    const wrap = (value, font, size, maxWidth) => {
      const result = [];
      for (const paragraph of safe(value, font).split('\n')) {
        let row = '';
        for (const word of paragraph.split(/\s+/).filter(Boolean)) {
          if (font.widthOfTextAtSize(word, size) > maxWidth) {
            if (row) { result.push(row); row = ''; }
            let chunk = '';
            for (const char of word) {
              if (font.widthOfTextAtSize(chunk + char, size) > maxWidth && chunk) { result.push(chunk); chunk = ''; }
              chunk += char;
            }
            row = chunk;
            continue;
          }
          const candidate = row ? `${row} ${word}` : word;
          if (font.widthOfTextAtSize(candidate, size) > maxWidth && row) { result.push(row); row = word; }
          else row = candidate;
        }
        result.push(row);
      }
      return result;
    };
    const paragraph = (page, value, x, top, width, size = 10, leading = 15, fill = 'muted', font = regular, maxLines = 20) => {
      const rows = wrap(value, font, size, width).slice(0, maxLines);
      rows.forEach((row, index) => put(page, row, x, top + index * leading, size, fill, font));
      return rows.length * leading;
    };
    const label = (page, value, x, top, fill = 'coral') => put(page, value.toUpperCase(), x, top, 9, fill, bold);
    const totalPages = quote.projection ? 3 : 2;
    const footer = (page, number) => {
      line(page, 38, 782, 557, 782, 'soft');
      put(page, 'GuateGeeks · Aprender creando, crecer con propósito.', 38, 794, 9, 'muted');
      put(page, `${number} / ${totalPages}`, 530, 794, 9, 'purple', bold);
    };

    const first = doc.addPage([W, H]);
    rect(first, 0, 0, W, 226, 'plum');
    rect(first, 38, 29, 109, 57, 'paper');
    try {
      const logo = await doc.embedPng(logoBytes());
      first.drawImage(logo, {x: 42, y: H - 84, width: 101, height: 52});
    } catch (_) { put(first, 'GuateGeeks', 49, 48, 17, 'plum', bold); }
    label(first, 'Cotización educativa', 164, 34, 'sky');
    put(first, modality[quote.key], 164, 54, 19, 'paper', bold);
    line(first, 38, 104, 557, 104, 'purple', 1.5);
    const schoolSize = quote.school.length > 65 ? 18 : 24;
    paragraph(first, quote.school, 38, 122, 515, schoolSize, schoolSize + 5, 'paper', bold, 2);
    paragraph(first, `${quote.program}  ·  ${quote.level}`, 38, 184, 510, 11, 15, 'paper', regular, 2);
    rect(first, 38, 246, 519, 49, 'soft');
    label(first, 'Preparado para', 52, 255, 'purple');
    paragraph(first, [quote.contact, quote.email, quote.location].filter(Boolean).join(' · ') || 'Equipo directivo de la institución', 52, 272, 294, 9, 12, 'ink', regular, 2);
    label(first, 'Emisión / vigencia', 382, 255, 'purple');
    put(first, `${pdfDate(quote.issued)} · ${pdfDate(quote.expires)}`, 382, 272, 8.5, 'ink');

    rect(first, 38, 312, 519, 206, 'soft');
    rect(first, 38, 312, 519, 5, 'coral');
    label(first, 'Inversión del programa sin IVA', 57, 334, 'purple');
    put(first, money(quote.offer.net), 57, 352, 29, 'plum', bold);
    put(first, `${quote.quantity} equipos  ·  ${quote.students} estudiantes`, 57, 397, 11, 'muted');
    put(first, quote.key === 'BUY' ? 'Adquisición directa' : `${quote.offer.months} meses de programa`, 57, 416, 11, 'muted');
    line(first, 337, 337, 337, 492, 'paper', 1.5);
    put(first, 'IVA (12 %)', 355, 342, 10, 'muted');
    put(first, money(quote.offer.tax), 355, 361, 13, 'ink', bold);
    put(first, 'Total con IVA', 355, 397, 10, 'muted');
    put(first, money(quote.offer.gross), 355, 416, 17, 'plum', bold);
    line(first, 57, 454, 538, 454, 'paper', 1.5);
    if (quote.key === 'BUY') {
      put(first, 'Forma de pago: compra del equipamiento.', 57, 469, 11, 'ink', bold);
    } else {
      put(first, `Pago inicial con IVA: ${money(quote.offer.initial)}`, 57, 466, 10, 'ink', bold);
      put(first, `${quote.offer.months} cuotas mensuales con IVA: ${money(quote.offer.installment)}`, 57, 486, 10, 'ink', bold);
    }

    label(first, 'Una propuesta que se puede llevar al aula', 38, 544);
    put(first, quote.project.program, 38, 563, 20, 'plum', bold);
    paragraph(first, quote.project.description, 38, 595, 485, 11, 17, 'muted', regular, 4);
    rect(first, 38, 694, 519, 65, 'paleSky');
    label(first, 'Importante', 52, 705, 'purple');
    paragraph(first, 'Estimación comercial sujeta a disponibilidad, alcance acordado y confirmación de GuateGeeks. Los valores se presentan en quetzales; el IVA se muestra por separado.', 52, 722, 490, 9, 13, 'ink', regular, 3);
    footer(first, 1);

    const second = doc.addPage([W, H]);
    rect(second, 0, 0, W, 89, 'plum');
    label(second, 'La experiencia educativa', 38, 27, 'sky');
    put(second, quote.project.title, 38, 47, 22, 'paper', bold);
    label(second, quote.program, 38, 108);
    rect(second, 38, 135, 250, 175, 'soft');
    try {
      const projectBytes = await fetchImage(quote.project.image);
      const image = await doc.embedPng(projectBytes);
      const scale = Math.min(238 / image.width, 163 / image.height);
      const width = image.width * scale, height = image.height * scale;
      second.drawImage(image, {x: 38 + (250 - width) / 2, y: H - 135 - (175 + height) / 2, width, height});
    } catch (_) {
      paragraph(second, quote.project.title, 58, 194, 205, 15, 20, 'plum', bold, 3);
    }
    label(second, 'Así aprenden', 310, 145, 'purple');
    paragraph(second, quote.project.description, 310, 168, 245, 10, 15, 'ink', regular, 7);
    label(second, 'Habilidades', 310, 260, 'purple');
    paragraph(second, quote.project.learning.replaceAll(' · ', ' / '), 310, 280, 245, 9.5, 14, 'muted', regular, 2);
    put(second, quote.project.status, 310, 313, 8, 'muted');

    line(second, 38, 333, 557, 333, 'soft');
    label(second, `Qué incluye ${modality[quote.key]}`, 38, 349);
    let y = 375;
    for (const item of scopeFor(quote)) {
      rect(second, 38, y + 4, 6, 6, 'coral');
      y += paragraph(second, item, 55, y, 495, 10, 15, 'ink', regular, 3) + 8;
    }
    const platformTop = Math.max(496, y + 4);
    rect(second, 38, platformTop, 519, quote.key === 'BUY' ? 55 : 107, 'paleSky');
    label(second, 'Socrates Aprende', 52, platformTop + 12, 'purple');
    paragraph(second, platformText(quote), 52, platformTop + 30, 488, 9, 13, 'ink', regular, quote.key === 'BUY' ? 2 : 6);

    const bottomTop = platformTop + (quote.key === 'BUY' ? 72 : 121);
    if (quote.note) {
      label(second, 'Nota para la institución', 38, bottomTop);
      paragraph(second, quote.note, 38, bottomTop + 19, 512, 9, 13, 'ink', regular, 4);
    }
    footer(second, 2);
    if (quote.projection) {
      const third = doc.addPage([W, H]);
      rect(third, 0, 0, W, 125, 'plum');
      label(third, 'Escenario opcional', 38, 33, 'sky');
      put(third, 'Proyección para la institución', 38, 55, 23, 'paper', bold);
      paragraph(third, `Con ${quote.students} estudiantes durante ${quote.offer.months} meses`, 38, 92, 510, 10, 14, 'paper');
      label(third, 'Cobro mensual sugerido por estudiante', 38, 159, 'purple');
      put(third, money(quote.offer.suggested), 38, 184, 32, 'plum', bold);
      paragraph(third, 'Referencia de GuateGeeks. El colegio define el cobro final a sus familias.', 38, 230, 505, 10, 16, 'muted', regular, 2);
      rect(third, 38, 281, 519, 86, 'soft');
      label(third, 'Ingresos estimados del programa', 54, 296, 'purple');
      put(third, money(quote.offer.revenue), 54, 320, 22, 'ink', bold);
      rect(third, 38, 380, 519, 86, 'paleSky');
      label(third, 'Diferencia bruta después de pagar a GuateGeeks', 54, 395, 'purple');
      put(third, money(quote.offer.contribution), 54, 419, 22, 'plum', bold);
      label(third, 'Cómo se calcula', 38, 505);
      paragraph(third, `${money(quote.offer.suggested)} por estudiante al mes x ${quote.students} estudiantes x ${quote.offer.months} meses = ${money(quote.offer.revenue)} de ingresos estimados. Al restar ${money(quote.offer.gross)} de inversión con IVA, la diferencia bruta es ${money(quote.offer.contribution)}.`, 38, 530, 505, 11, 17, 'ink', regular, 6);
      rect(third, 38, 662, 519, 86, 'soft');
      paragraph(third, 'Esta proyección es orientativa: no descuenta docentes, administración, cobros, infraestructura, impuestos ni otros gastos propios de la institución. No representa utilidad neta.', 52, 677, 488, 9, 14, 'muted', regular, 4);
      footer(third, 3);
    }
    return doc.save();
  }

  async function submit(event) {
    event.preventDefault();
    showError('');
    if (!form.reportValidity()) return;
    if (!validScenario()) { showError('Verifica las cantidades de equipos y estudiantes.'); return; }
    if (!$q('quote-school').value.trim()) { showError('Escribe el nombre de la institución educativa.'); $q('quote-school').focus(); return; }
    const quote = buildQuoteData();
    download.disabled = true;
    download.textContent = 'Preparando PDF…';
    try {
      if (!window.PDFLib) throw new Error('No se pudo cargar el generador de PDF.');
      const bytes = await makePdf(quote);
      const blob = new Blob([bytes], {type: 'application/pdf'});
      const url = URL.createObjectURL(blob);
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

  $q('quote-open').addEventListener('click', openQuote);
  $q('quote-close').addEventListener('click', () => dialog.close());
  $q('quote-cancel').addEventListener('click', () => dialog.close());
  mode.addEventListener('change', refreshSnapshot);
  form.addEventListener('submit', submit);
})();
