/* Propuesta editorial GuateGeeks. Recibe los importes ya calculados por el simulador. */
(() => {
  const money = value => `Q ${Number(value).toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const date = value => new Intl.DateTimeFormat('es-GT', {day: '2-digit', month: 'long', year: 'numeric'}).format(value);
  const kitName = {Spike: 'LEGO Education SPIKE Prime', 'Robot Master': 'Robot Master', Snap: 'Snap Circuits', TaleBot: 'TaleBot', Meta: 'Equipo de realidad virtual', Drones: 'Dron educativo'};

  async function generate(quote, {visual, modality}) {
    if (!window.QUOTE_MEDIA || !window.PDFLib) throw new Error('Faltan recursos para generar la cotización.');
    const {PDFDocument, StandardFonts, rgb, pushGraphicsState, popGraphicsState, rectangle, clip, endPath} = PDFLib;
    const doc = await PDFDocument.create();
    doc.setTitle(`Cotización GuateGeeks · ${quote.school}`);
    doc.setAuthor('GuateGeeks');
    doc.setCreator('Simulador GuateGeeks');
    doc.setSubject(`${modality[quote.key]} · ${quote.levels.length} grupos de equipos`);
    const normal = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const W = 595.28, H = 841.89, M = 36, CW = W - M * 2;
    const hex = value => rgb(...[1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16) / 255));
    const c = {
      plum: hex('#392A54'), ink: hex('#193642'), cyan: hex('#0789AE'),
      orange: hex('#EC7650'), paper: hex('#F7F5F1'), white: rgb(1, 1, 1),
      mist: hex('#E5F4F7'), soft: hex('#EFEAF4'), gray: hex('#50616A'), line: hex('#CBD9DC')
    };
    const safe = value => [...String(value ?? '')].map(ch => {
      if (ch === '\n') return ch;
      try { normal.encodeText(ch); return ch; } catch { return '?'; }
    }).join('');
    const rect = (page, x, top, w, h, fill) => page.drawRectangle({x, y: H - top - h, width: w, height: h, color: fill});
    const line = (page, x, top, w, fill = c.line, thickness = 1) =>
      page.drawLine({start: {x, y: H - top}, end: {x: x + w, y: H - top}, color: fill, thickness});
    const txt = (page, value, x, top, size = 10, fill = c.ink, font = normal) =>
      page.drawText(safe(value), {x, y: H - top - size, size, font, color: fill});
    const right = (page, value, edge, top, size = 10, fill = c.ink, font = normal) => {
      const str = safe(value);
      txt(page, str, edge - font.widthOfTextAtSize(str, size), top, size, fill, font);
    };
    const fit = (page, value, x, top, width, size, min = 8, fill = c.ink, font = normal) => {
      const str = safe(value);
      while (font.widthOfTextAtSize(str, size) > width && size > min) size -= .3;
      txt(page, str, x, top, size, fill, font);
    };
    const wrap = (value, width, size, font = normal) => {
      const rows = [];
      for (const part of safe(value).split('\n')) {
        let row = '';
        for (const word of part.split(/\s+/).filter(Boolean)) {
          const next = row ? `${row} ${word}` : word;
          if (row && font.widthOfTextAtSize(next, size) > width) { rows.push(row); row = word; }
          else row = next;
        }
        if (row) rows.push(row);
      }
      return rows;
    };
    const paragraph = (page, value, x, top, width, size = 10, leading = 15, fill = c.gray, font = normal, max = 9) => {
      const rows = wrap(value, width, size, font).slice(0, max);
      rows.forEach((row, i) => txt(page, row, x, top + i * leading, size, fill, font));
      return rows.length * leading;
    };
    const mediaCache = {};
    const image = async key => {
      if (!mediaCache[key]) {
        const uri = window.QUOTE_MEDIA[key];
        if (!uri) throw new Error(`Falta la imagen ${key}.`);
        const bytes = Uint8Array.from(atob(uri.slice(uri.indexOf(',') + 1)), ch => ch.charCodeAt(0));
        mediaCache[key] = uri.startsWith('data:image/png') ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      }
      return mediaCache[key];
    };
    const coverImage = async (page, key, x, top, w, h) => {
      const asset = await image(key);
      const scale = Math.max(w / asset.width, h / asset.height);
      const iw = asset.width * scale, ih = asset.height * scale;
      page.pushOperators(pushGraphicsState(), rectangle(x, H - top - h, w, h), clip(), endPath());
      page.drawImage(asset, {x: x + (w - iw) / 2, y: H - top - (h + ih) / 2, width: iw, height: ih});
      page.pushOperators(popGraphicsState());
    };
    const containImage = async (page, key, x, top, w, h, fill = c.white) => {
      rect(page, x, top, w, h, fill);
      const asset = await image(key);
      const scale = Math.min(w / asset.width, h / asset.height);
      const iw = asset.width * scale, ih = asset.height * scale;
      page.drawImage(asset, {x: x + (w - iw) / 2, y: H - top - (h + ih) / 2, width: iw, height: ih});
    };
    const logo = await image('logo');
    const eyes = await image('geekEyes');
    const base = (section, dark = false) => {
      const page = doc.addPage([W, H]);
      rect(page, 0, 0, W, H, dark ? c.plum : c.paper);
      if (!dark) {
        page.drawImage(logo, {x: M, y: H - 69, width: 50, height: 50});
        txt(page, 'GUATEGEEKS', M + 61, 25, 9, c.cyan, bold);
        right(page, section.toUpperCase(), W - M, 29, 8, c.gray, bold);
        line(page, M, 78, CW, c.line);
      }
      page._ggSection = section;
      return page;
    };
    const tag = (page, label, x, top, width, fill = c.plum, textFill = c.white) => {
      rect(page, x, top, width, 24, fill);
      fit(page, label.toUpperCase(), x + 10, top + 6, width - 20, 8.5, 7.2, textFill, bold);
    };
    const icon = (page, kind, x, top) => {
      const stroke = (ax, ay, bx, by) => page.drawLine({start: {x: x + ax, y: H - top - ay}, end: {x: x + bx, y: H - top - by}, thickness: 1.7, color: c.cyan});
      const frame = (ax, ay, w, h) => page.drawRectangle({x: x + ax, y: H - top - ay - h, width: w, height: h, borderColor: c.cyan, borderWidth: 1.7});
      if (kind === 'equipment') { frame(5, 9, 22, 18); stroke(16, 5, 16, 9); stroke(11, 21, 21, 21); }
      else if (kind === 'planning') { frame(7, 5, 19, 23); stroke(11, 12, 22, 12); stroke(11, 18, 22, 18); }
      else if (kind === 'training') { frame(4, 6, 26, 18); stroke(17, 24, 17, 29); stroke(11, 29, 23, 29); }
      else if (kind === 'integration') { frame(4, 7, 11, 11); frame(19, 18, 11, 11); stroke(15, 13, 19, 23); }
      else if (kind === 'platform') { frame(4, 7, 26, 18); stroke(9, 13, 25, 13); stroke(9, 19, 20, 19); }
      else if (kind === 'support') { stroke(7, 18, 11, 10); stroke(11, 10, 17, 7); stroke(17, 7, 23, 10); stroke(23, 10, 27, 18); frame(5, 18, 5, 10); frame(24, 18, 5, 10); }
      else { stroke(6, 25, 25, 7); stroke(18, 7, 25, 7); stroke(25, 7, 25, 15); }
    };

    // The opening behaves like a prospectus cover, without a price or a repeated table.
    const cover = base('Propuesta educativa', true);
    rect(cover, M, 34, 86, 86, c.white);
    cover.drawImage(logo, {x: M + 7, y: H - 113, width: 72, height: 72});
    txt(cover, 'GUATEGEEKS', 140, 45, 11, c.white, bold);
    txt(cover, 'PROPUESTA EDUCATIVA', 140, 66, 8.5, c.mist, bold);
    right(cover, date(quote.issued), W - M, 66, 8.5, c.mist);
    txt(cover, 'Imagina, diseña', M, 142, 36, c.white, bold);
    txt(cover, 'y crea.', M, 187, 39, c.orange, bold);
    cover.drawImage(eyes, {x: W - M - 94, y: H - 218, width: 89, height: 49});
    fit(cover, `Para ${quote.school}`, M, 246, CW, 17, 12, c.white, bold);
    const photosTop = 290, photosHeight = 289;
    if (quote.levels.length === 1) {
      await coverImage(cover, visual[quote.levels[0].tech].classroom, M, photosTop, CW, photosHeight);
    } else {
      await coverImage(cover, visual[quote.levels[0].tech].classroom, M, photosTop, 351, photosHeight);
      const second = quote.levels[1];
      await coverImage(cover, visual[second.tech].classroom, M + 359, photosTop, CW - 359, 140);
      const third = quote.levels[2] || quote.levels[0];
      await coverImage(cover, visual[third.tech].classroom, M + 359, photosTop + 149, CW - 359, 140);
    }
    txt(cover, 'ESCENAS ILUSTRATIVAS DEL AULA', M, 582, 7.5, c.mist, bold);
    rect(cover, M, 596, CW, 174, c.white);
    tag(cover, modality[quote.key], M + 18, 613, 132, c.cyan);
    txt(cover, 'Una propuesta creada para su institución', M + 18, 649, 17, c.plum, bold);
    fit(cover, `${count(quote.levels.length, 'grupo de equipos', 'grupos de equipos')} · ${count(quote.quantity, 'equipo', 'equipos')} · ${quote.students} estudiantes`, M + 18, 681, CW - 36, 12, 10, c.ink);
    line(cover, M + 18, 715, CW - 36, c.line);
    txt(cover, 'Programas y grados', M + 18, 731, 9.5, c.gray);
    right(cover, 'Servicios incluidos  /  Inversión al final', M + CW - 18, 731, 9.5, c.gray);

    // A visual page for each unique group of kits. Grades do not duplicate equipment.
    for (const [index, level] of quote.levels.entries()) {
      const page = base('Experiencia y equipamiento');
      txt(page, `${String(index + 1).padStart(2, '0')}  /  ${String(quote.levels.length).padStart(2, '0')}`, M, 101, 10, c.orange, bold);
      fit(page, level.program, M, 122, CW, 28, 20, c.plum, bold);
      const view = visual[level.tech];
      paragraph(page, `${view.idea}. Los retos se adaptan a la edad de los estudiantes de cada grado.`, M, 162, CW, 10.2, 13, c.gray, normal, 2);
      fit(page, `EQUIPO PROPUESTO  /  ${kitName[level.tech] || level.tech}`, M, 190, CW, 9.2, 8.4, c.cyan, bold);
      await coverImage(page, view.classroom, M, 207, 350, 235);
      await containImage(page, view.product, M + 359, 207, CW - 359, 235);
      txt(page, 'ESCENA ILUSTRATIVA DEL AULA', M, 449, 8.5, c.cyan, bold);
      txt(page, 'EQUIPO PROPUESTO', M + 359, 449, 8.5, c.cyan, bold);
      rect(page, M, 479, CW, 67, c.mist);
      txt(page, `${level.equipmentQuantity}`, M + 16, 487, 25, c.plum, bold);
      txt(page, level.equipmentQuantity === 1 ? 'equipo' : 'equipos', M + 63, 502, 10, c.ink);
      page.drawLine({start: {x: M + 179, y: H - 490}, end: {x: M + 179, y: H - 533}, thickness: 1, color: c.line});
      txt(page, `${level.students}`, M + 197, 487, 25, c.plum, bold);
      txt(page, 'estudiantes', M + 251, 502, 10, c.ink);
      txt(page, 'Grados que utilizarán estos equipos', M, 566, 16, c.plum, bold);
      const grades = level.gradeDetails;
      grades.forEach((grade, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = M + col * 266, top = 598 + row * 25;
        line(page, x, top + 24, 253, c.line, .7);
        fit(page, grade.label, x, top + 4, 175, 10, 8.5, c.ink);
        right(page, String(grade.students), x + 253, top + 4, 10, c.plum, bold);
      });
      if (grades.length <= 8) {
        rect(page, M, 733, CW, 42, c.soft);
        fit(page, `Los ${count(level.equipmentQuantity, 'equipo se cotiza', 'equipos se cotizan')} una sola vez para los grados seleccionados.`, M + 12, 746, CW - 24, 10.5, 9, c.plum, bold);
      }
    }

    const services = base('Alcance del programa');
    txt(services, quote.key === 'BUY' ? 'Equipos listos para' : 'El equipo es solo', M, 111, 28, c.plum, bold);
    txt(services, quote.key === 'BUY' ? 'crear en el aula.' : 'el comienzo.', M, 145, 28, c.cyan, bold);
    services.drawImage(eyes, {x: W - M - 95, y: H - 183, width: 88, height: 49});
    const ownership = quote.key === 'BUY' ? 'Los equipos son propiedad del colegio desde la compra.' :
      quote.key === 'RENT' ? 'Los equipos se devuelven a GuateGeeks al finalizar FLEX.' :
      quote.key === 'EVO16' ? 'Dos ciclos de 8 meses; al terminar, los equipos quedan en la institución.' :
        'Al completar los 8 meses, los equipos quedan en la institución.';
    rect(services, M, 199, CW, 103, c.plum);
    tag(services, modality[quote.key], M + 15, 214, 135, c.orange);
    paragraph(services, ownership, M + 15, 250, CW - 30, 12, 17, c.white, bold, 3);
    const included = quote.key === 'BUY' ? [
      ['equipment', 'Equipamiento educativo', 'Kits para los grados detallados en la propuesta.'],
      ['training', 'Puesta en marcha y capacitación', 'Una sesión inicial de 1 hora para aprender a utilizar los equipos en clase.']
    ] : [
      ['equipment', 'Equipamiento educativo', 'Kits asignados a los grados de la propuesta.'],
      ['planning', 'Planificación docente', 'Actividades y guías alineadas con el CNB.'],
      ['training', 'Capacitación docente', 'Formación para utilizar los equipos en clase.'],
      ['integration', 'Integración tecnológica', 'Orientación para incorporarlos en el aula.'],
      ['platform', 'Socrates Aprende', 'Recursos docentes y contenido según el grado.'],
      ['support', 'Soporte y seguimiento', `Acompañamiento durante ${quote.offer.months} meses.`]
    ];
    txt(services, 'Lo que recibe la institución', M, 326, 16, c.plum, bold);
    included.forEach(([symbol, title, description], i) => {
      const buy = quote.key === 'BUY', col = buy ? 0 : i % 2, row = buy ? i : Math.floor(i / 2);
      const x = M + col * 266, top = 365 + row * (buy ? 125 : 87), width = buy ? CW : 255;
      icon(services, symbol, x, top + 1);
      fit(services, title, x + 42, top, width - 42, buy ? 13 : 11.5, 9.5, c.plum, bold);
      paragraph(services, description, x + 42, top + 25, width - 45, buy ? 10.2 : 9.2, 13, c.gray, normal, 3);
      line(services, x, top + (buy ? 110 : 70), width, c.line);
    });
    const gradeIds = new Set(quote.levels.flatMap(level => level.grades));
    const socrates = quote.key === 'BUY' ?
      'Socrates Aprende y las horas adicionales de capacitación se cotizan por separado.' : [
        gradeIds.has('p6') || gradeIds.has('p5') ? 'Contenido estudiantil disponible para 6.º primaria; ampliación gradual a 5.º.' : '',
        ['pk', 'k', 'prep'].some(id => gradeIds.has(id)) || [...gradeIds].some(id => /^p[1-4]$/.test(id)) ? 'Para preprimaria y 1.º a 4.º primaria hay recursos docentes.' : '',
        [...gradeIds].some(id => /^[bh]/.test(id)) ? 'Básicos y bachillerato: fases posteriores.' : '',
        'La vigencia del acceso se acuerda con GuateGeeks.'
      ].filter(Boolean).join(' ');
    rect(services, M, 649, CW, 126, c.mist);
    txt(services, quote.key === 'BUY' ? 'No incluido en la compra' : 'Socrates Aprende: disponibilidad', M + 15, 664, 12, c.plum, bold);
    paragraph(services, socrates, M + 15, 689, CW - 30, 10, 14.5, c.ink, normal, 5);
    if (quote.note) paragraph(services, `Nota de la propuesta: ${quote.note}`, M, 786, CW, 8, 10, c.gray, normal, 2);

    // This is an optional institutional estimate, never part of a direct purchase.
    if (quote.projection) {
      const projectionBatch = quote.levels.length > 4 ? 3 : 4;
      for (let start = 0; start < quote.levels.length; start += projectionBatch) {
        const p = base('Proyección opcional');
        txt(p, 'Una referencia para', M, 112, 26, c.plum, bold);
        txt(p, 'decidir cuánto cobrar.', M, 145, 26, c.cyan, bold);
        paragraph(p, 'GuateGeeks sugiere un cobro mensual por estudiante. La institución decide el importe final. Estas cifras son estimaciones antes de sus gastos propios.', M, 196, CW, 10.2, 15, c.gray, normal, 3);
        const subset = quote.levels.slice(start, start + projectionBatch);
        if (quote.levels.length === 1) {
          const level = subset[0];
          rect(p, M, 293, CW, 160, c.mist);
          txt(p, 'COBRO MENSUAL SUGERIDO POR ESTUDIANTE', M + 18, 311, 9, c.plum, bold);
          fit(p, money(level.offer.suggested), M + 18, 337, CW - 36, 43, 32, c.plum, bold);
          fit(p, `${level.program} · ${level.students} estudiantes · ${quote.offer.months} meses`, M + 18, 411, CW - 36, 11, 9.5, c.ink);
          rect(p, M, 473, 252, 115, c.white);
          txt(p, 'INGRESOS ESTIMADOS', M + 14, 491, 9, c.gray, bold);
          fit(p, money(quote.offer.revenue), M + 14, 515, 224, 22, 17, c.ink, bold);
          fit(p, `${money(level.offer.suggested)} × ${level.students} × ${quote.offer.months} meses`, M + 14, 554, 224, 8.5, 7.5, c.gray);
          rect(p, M + 265, 473, CW - 265, 115, c.white);
          txt(p, 'PAGO A GUATEGEEKS SIN IVA', M + 279, 491, 9, c.gray, bold);
          fit(p, money(quote.offer.net), M + 279, 515, CW - 293, 22, 17, c.ink, bold);
          txt(p, 'Costo total del programa', M + 279, 554, 8.5, c.gray);
          rect(p, M, 611, CW, 111, c.plum);
          txt(p, 'DIFERENCIA BRUTA ESTIMADA SIN IVA', M + 17, 630, 9, c.mist, bold);
          fit(p, money(quote.offer.revenue - quote.offer.net), M + 17, 654, CW - 34, 31, 24, c.white, bold);
          paragraph(p, `Antes de los gastos propios del colegio; no representa utilidad neta. Si corresponde IVA, la diferencia sería ${money(quote.offer.revenue - quote.offer.gross)}.`, M, 740, CW, 9, 13, c.gray, normal, 3);
          continue;
        }
        subset.forEach((level, i) => {
          const top = 276 + i * 99;
          line(p, M, top, CW, c.line);
          fit(p, level.program, M, top + 10, 300, 12.5, 10, c.plum, bold);
          txt(p, `${level.students} estudiantes · ${quote.offer.months} meses`, M, top + 33, 9, c.gray);
          txt(p, `Sugerido: ${money(level.offer.suggested)} / estudiante / mes`, M, top + 55, 9.5, c.ink);
          right(p, `Ingreso: ${money(level.offer.revenue)}`, W - M, top + 31, 9.5, c.ink, bold);
          right(p, `Diferencia: ${money(level.offer.revenue - level.offer.net)}`, W - M, top + 55, 9.5, c.cyan, bold);
        });
        if (start + subset.length === quote.levels.length) {
          const top = Math.min(702, 291 + subset.length * 99);
          rect(p, M, top, CW, 86, c.plum);
          txt(p, 'DIFERENCIA TOTAL ESTIMADA SIN IVA', M + 15, top + 12, 8.5, c.mist, bold);
          fit(p, money(quote.offer.revenue - quote.offer.net), M + 15, top + 31, 245, 25, 19, c.white, bold);
          right(p, `Ingresos ${money(quote.offer.revenue)}`, W - M - 15, top + 42, 9, c.white);
          paragraph(p, 'No es utilidad neta. Si corresponde IVA, la diferencia se calcula contra el total con IVA.', M, Math.min(799, top + 96), CW, 8.8, 12, c.gray, normal, 2);
        }
      }
    }

    // Additional financial detail precedes the final total when many groups are quoted.
    if (quote.levels.length > 4) {
      for (let start = 0; start < quote.levels.length; start += 5) {
        const p = base('Detalle de inversión');
        txt(p, 'Cada kit cuenta', M, 112, 27, c.plum, bold);
        txt(p, 'una sola vez.', M, 148, 27, c.cyan, bold);
        paragraph(p, 'Importes por grupo de equipos. Los grados comparten el kit asignado; no se duplica su costo.', M, 199, CW, 10, 15, c.gray, normal, 2);
        quote.levels.slice(start, start + 5).forEach((level, i) => {
          const top = 265 + i * 75;
          line(p, M, top, CW, c.line);
          fit(p, `${start + i + 1}. ${level.program}`, M, top + 10, 285, 12, 9.5, c.plum, bold);
          fit(p, `${count(level.equipmentQuantity, 'equipo', 'equipos')} · ${level.students} estudiantes · ${kitName[level.tech] || level.tech}`, M, top + 34, 300, 8.7, 7.5, c.gray);
          right(p, money(level.offer.net), W - M, top + 8, 14, c.ink, bold);
          right(p, `sin IVA  ·  con IVA ${money(level.offer.gross)}`, W - M, top + 34, 8.2, c.gray);
        });
      }
    }

    const finance = base('Inversión', true);
    rect(finance, M, 32, 70, 70, c.white);
    finance.drawImage(logo, {x: M + 6, y: H - 96, width: 58, height: 58});
    txt(finance, 'GUATEGEEKS / INVERSIÓN', 121, 42, 10, c.mist, bold);
    fit(finance, quote.school, 121, 65, W - M - 130, 13, 10, c.white, bold);
    txt(finance, 'La inversión para', M, 123, 27, c.white, bold);
    txt(finance, 'hacerlo realidad.', M, 157, 27, c.orange, bold);
    finance.drawImage(eyes, {x: W - M - 90, y: H - 217, width: 85, height: 47});
    txt(finance, 'TOTAL DEL PROGRAMA SIN IVA', M, 216, 9, c.mist, bold);
    fit(finance, money(quote.offer.net), M, 237, CW, 40, 29, c.white, bold);
    rect(finance, 0, 312, W, H - 312, c.paper);
    rect(finance, M, 337, 253, 74, c.white);
    txt(finance, 'IVA 12 %', M + 13, 349, 9, c.gray, bold);
    fit(finance, money(quote.offer.tax), M + 13, 370, 225, 17, 14, c.ink, bold);
    rect(finance, M + 267, 337, CW - 267, 74, c.mist);
    txt(finance, 'TOTAL CON IVA', M + 280, 349, 9, c.gray, bold);
    fit(finance, money(quote.offer.gross), M + 280, 370, CW - 295, 17, 14, c.ink, bold);
    txt(finance, 'Así se distribuye', M, 439, 16, c.plum, bold);
    if (quote.levels.length <= 4) {
      quote.levels.forEach((level, i) => {
        const top = 471 + i * 47;
        line(finance, M, top + 42, CW, c.line);
        fit(finance, level.program, M, top + 4, 290, 11, 9, c.ink, bold);
        fit(finance, `${count(level.equipmentQuantity, 'equipo', 'equipos')} · ${level.students} estudiantes · ${kitName[level.tech] || level.tech}`, M, top + 22, 300, 8.8, 7.5, c.gray);
        right(finance, money(level.offer.net), W - M, top + 9, 11, c.plum, bold);
      });
    } else {
      rect(finance, M, 476, CW, 84, c.white);
      fit(finance, `${count(quote.levels.length, 'grupo', 'grupos')} · ${count(quote.quantity, 'equipo', 'equipos')} · ${quote.students} estudiantes`, M + 15, 491, CW - 30, 14, 11, c.plum, bold);
      paragraph(finance, 'El detalle por grupo y sus importes se encuentra en las páginas anteriores.', M + 15, 522, CW - 30, 9.5, 13, c.gray, normal, 2);
    }
    const paymentTop = quote.levels.length <= 4 ? Math.max(610, 496 + quote.levels.length * 47) : 602;
    const paymentHeight = quote.levels.length <= 3 ? 112 : 82;
    rect(finance, M, paymentTop, CW, paymentHeight, c.soft);
    if (quote.key === 'BUY') {
      txt(finance, 'CONDICIÓN DE COMPRA', M + 15, paymentTop + 14, 9.5, c.plum, bold);
      txt(finance, 'Pago único', M + 15, paymentTop + 37, 20, c.plum, bold);
      txt(finance, 'Los equipos son propios desde la compra.', M + 15, paymentTop + 68, 10.2, c.ink);
    } else {
      const initialNet = quote.offer.net * quote.offer.initial / quote.offer.gross;
      const monthlyNet = (quote.offer.net - initialNet) / quote.offer.months;
      txt(finance, 'PAGO INICIAL SIN IVA', M + 15, paymentTop + 14, 9.2, c.plum, bold);
      fit(finance, money(initialNet), M + 15, paymentTop + 34, 220, 19, 16, c.plum, bold);
      txt(finance, `Con IVA ${money(quote.offer.initial)}`, M + 15, paymentTop + (paymentHeight > 82 ? 78 : 67), 10, c.gray);
      finance.drawLine({start: {x: M + 255, y: H - paymentTop - 15}, end: {x: M + 255, y: H - paymentTop - paymentHeight + 15}, color: c.line, thickness: 1});
      fit(finance, `${quote.offer.months} CUOTAS MENSUALES SIN IVA`, M + 278, paymentTop + 14, 215, 9.2, 8.5, c.plum, bold);
      fit(finance, money(monthlyNet), M + 278, paymentTop + 34, 215, 19, 16, c.plum, bold);
      txt(finance, `Con IVA ${money(quote.offer.installment)}`, M + 278, paymentTop + (paymentHeight > 82 ? 78 : 67), 10, c.gray);
    }
    const closeTop = paymentTop + paymentHeight + 9;
    txt(finance, `Emitida: ${date(quote.issued)}  ·  Vigente hasta: ${date(quote.expires)}`, M, closeTop, 10, c.gray);
    const contact = [quote.contact, quote.email, quote.location].filter(Boolean).join('  ·  ');
    if (contact) paragraph(finance, `Contacto: ${contact}`, M, closeTop + 19, CW, 8.7, 11, c.gray, normal, 2);

    const pages = doc.getPages();
    pages.forEach((page, i) => {
      const dark = i === 0 || i === pages.length - 1;
      const color = dark && i === 0 ? c.mist : c.gray;
      if (i > 0) line(page, M, 808, CW, dark ? c.line : c.line, .8);
      txt(page, 'GUATEGEEKS · IMAGINA, DISEÑA Y CREA', M, 816, 7.5, color, bold);
      right(page, `${String(i + 1).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}`, W - M, 816, 7.5, color, bold);
    });
    return doc.save();
  }

  window.GuateGeeksQuotePdf = {generate};
})();
