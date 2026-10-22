const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright-core');
const {PDFDocument} = require('pdf-lib');

const root = path.resolve(__dirname, '..');
let server, browser, baseURL;
before(async () => {
  server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404).end(); return; }
      const ext = path.extname(file);
      res.setHeader('Content-Type', {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp'}[ext] || 'application/octet-stream');
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;
  const paths = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].filter(Boolean);
  const executablePath = paths.find(file => fs.existsSync(file));
  if (!executablePath) throw new Error('Se necesita Chrome o Chromium; indique su ruta en CHROME_PATH.');
  browser = await chromium.launch({executablePath, headless: true});
});
after(async () => { if (browser) await browser.close(); if (server) await new Promise(resolve => server.close(resolve)); });

async function newPage() {
  const page = await browser.newPage();
  page.setDefaultTimeout(1500);
  await page.goto(baseURL);
  return page;
}

test('calcula cada nivel con las fórmulas actuales sin cambiar el escenario visible', async () => {
  const page = await newPage();
  try {
    const result = await page.evaluate(() => {
      const before = calc();
      const same = calculateScenario({tech: 'Spike', qty: 5, students: 60, bims: before.bims, down: before.down, sm: before.sm});
      const preschool = calculateScenario({tech: 'TaleBot', qty: 3, students: 24, bims: before.bims, down: before.down, sm: before.sm});
      const after = calc();
      return {same: same.EVO16.net, original: before.EVO16.net, preschool: preschool.EVO16.net,
        students: preschool.students, visible: after.EVO16.net, technology: document.querySelector('#tech').value};
    });
    assert.equal(result.same, result.original);
    assert.notEqual(result.preschool, result.original);
    assert.equal(result.students, 24);
    assert.equal(result.visible, result.original);
    assert.equal(result.technology, 'Spike');
  } finally { await page.close(); }
});

test('Spike Prime comienza con 4.º a 6.º primaria y permite agregar cualquier grado al mismo kit', async () => {
  const page = await newPage();
  try {
    await page.click('#quote-open');
    const group = page.locator('.quote-level').first();
    assert.equal(await group.locator('.quote-level-tech').inputValue(), 'Spike');
    assert.equal(await group.locator('.quote-grade-row').count(), 12);
    for (const id of ['p4', 'p5', 'p6']) assert.equal(await group.locator(`.quote-grade-row[data-grade="${id}"] .quote-grade-check`).isChecked(), true);
    for (const id of ['pre', 'p1', 'b1', 'h4']) assert.equal(await group.locator(`.quote-grade-row[data-grade="${id}"] .quote-grade-check`).isChecked(), false);
    await group.locator('.quote-grade-row[data-grade="b1"] .quote-grade-check').check();
    await group.locator('.quote-grade-row[data-grade="b1"] .quote-grade-students').fill('40');
    await group.locator('.quote-grade-row[data-grade="h4"] .quote-grade-check').check();
    await group.locator('.quote-grade-row[data-grade="h4"] .quote-grade-students').fill('30');
    assert.match(await page.locator('#quote-snapshot').innerText(), /5 equipos · 130 estudiantes/);
    const expected = await page.evaluate(() => calculateScenario({tech:'Spike',qty:5,students:130,bims:1,down:.4,sm:.25}).EVO16.net);
    assert.ok((await page.locator('#quote-snapshot').innerText()).includes(`Q ${expected.toLocaleString('es-GT',{minimumFractionDigits:2})}`));
  } finally { await page.close(); }
});

test('cambiar de tecnología propone grados apropiados sin borrar una selección personalizada', async () => {
  const page = await newPage();
  try {
    await page.click('#quote-open');
    const group = page.locator('.quote-level').first();
    await group.locator('.quote-level-tech').selectOption('Robot Master');
    assert.equal(await group.locator('.quote-grade-row[data-grade="p1"] .quote-grade-check').isChecked(), true);
    assert.equal(await group.locator('.quote-grade-row[data-grade="p4"] .quote-grade-check').isChecked(), false);
    await group.locator('.quote-grade-row[data-grade="p4"] .quote-grade-check').check();
    await group.locator('.quote-grade-row[data-grade="p4"] .quote-grade-students').fill('12');
    await group.locator('.quote-level-tech').selectOption('Spike');
    assert.equal(await group.locator('.quote-grade-row[data-grade="p4"] .quote-grade-students').inputValue(), '12');
    assert.equal(await group.locator('.quote-grade-row[data-grade="p1"] .quote-grade-check').isChecked(), true);
    assert.match(await group.locator('.quote-tech-note').innerText(), /desde 4.º primaria/);
  } finally { await page.close(); }
});

test('otro grupo de equipos se suma por separado y cada grado conserva sus estudiantes', async () => {
  const page = await newPage();
  try {
    await page.click('#quote-open');
    await page.click('#quote-add-level');
    const second = page.locator('.quote-level').last();
    await second.locator('.quote-level-tech').selectOption('TaleBot');
    await second.locator('.quote-level-qty').fill('3');
    for (const id of ['p4', 'p5', 'p6']) await second.locator(`.quote-grade-row[data-grade="${id}"] .quote-grade-check`).uncheck();
    await second.locator('.quote-grade-row[data-grade="pre"] .quote-grade-check').check();
    await second.locator('.quote-grade-row[data-grade="pre"] .quote-grade-students').fill('24');
    assert.match(await page.locator('#quote-snapshot').innerText(), /2 grupos · 8 equipos · 84 estudiantes/);
    await second.locator('.quote-level-remove').click();
    assert.match(await page.locator('#quote-snapshot').innerText(), /1 grupo · 5 equipos · 60 estudiantes/);
  } finally { await page.close(); }
});

test('impide cotizar sin grados, con estudiantes inválidos o con cero equipos', async () => {
  const page = await newPage();
  try {
    await page.click('#quote-open');
    const group = page.locator('.quote-level').first();
    for (const id of ['p4', 'p5', 'p6']) await group.locator(`.quote-grade-row[data-grade="${id}"] .quote-grade-check`).uncheck();
    assert.equal(await page.locator('#quote-download').isDisabled(), true);
    await group.locator('.quote-grade-row[data-grade="p4"] .quote-grade-check').check();
    await group.locator('.quote-grade-row[data-grade="p4"] .quote-grade-students').fill('0');
    assert.equal(await page.locator('#quote-download').isDisabled(), true);
    await group.locator('.quote-grade-row[data-grade="p4"] .quote-grade-students').fill('20');
    await group.locator('.quote-level-qty').fill('0');
    assert.equal(await page.locator('#quote-download').isDisabled(), true);
    await group.locator('.quote-level-qty').fill('2');
    assert.equal(await page.locator('#quote-download').isEnabled(), true);
  } finally { await page.close(); }
});

test('la proyección se puede activar en programas y se oculta en compra directa', async () => {
  const page = await newPage();
  try {
    await page.click('#quote-open');
    await page.selectOption('#quote-mode', 'BUY');
    assert.equal(await page.locator('#quote-projection-field').isVisible(), false);
    await page.selectOption('#quote-mode', 'RENT');
    assert.equal(await page.locator('#quote-projection-field').isVisible(), true);
    await page.check('#quote-projection');
    assert.equal(await page.locator('#quote-projection').isChecked(), true);
  } finally { await page.close(); }
});

test('el PDF crece con cada kit y deja el desglose financiero al final', async () => {
  const page = await newPage();
  try {
    await page.click('#quote-open');
    await page.fill('#quote-school', 'Colegio Integral');
    await page.click('#quote-add-level');
    await page.locator('.quote-level').last().locator('.quote-level-tech').selectOption('Robot Master');
    const pending = page.waitForEvent('download');
    await page.click('#quote-download');
    const pdf = await PDFDocument.load(fs.readFileSync(await (await pending).path()));
    assert.equal(pdf.getPageCount(), 5);
    assert.match(pdf.getSubject(), /2 grupos de equipos/);
    await page.click('#quote-open');
    await page.fill('#quote-school', 'Colegio Integral');
    await page.check('#quote-projection');
    const projected = page.waitForEvent('download');
    await page.click('#quote-download');
    const withProjection = await PDFDocument.load(fs.readFileSync(await (await projected).path()));
    assert.equal(withProjection.getPageCount(), 5);
  } finally { await page.close(); }
});

test('nueve grupos de equipos caben en una misma propuesta con páginas adicionales', async () => {
  const page = await newPage();
  try {
    await page.click('#quote-open');
    await page.fill('#quote-school', 'Institución Multinivel');
    for (let i = 1; i < 9; i++) await page.click('#quote-add-level');
    assert.equal(await page.locator('.quote-level').count(), 9);
    const pending = page.waitForEvent('download');
    await page.click('#quote-download');
    const pdf = await PDFDocument.load(fs.readFileSync(await (await pending).path()));
    assert.equal(pdf.getPageCount(), 14);
  } finally { await page.close(); }
});

test('la vista institucional se conecta en vivo y coincide con la calculadora', async () => {
  const page = await newPage();
  try {
    await page.selectOption('#tech', 'Spike');
    await page.selectOption('#mode', 'EVO16');
    await page.fill('#qty', '5');
    await page.fill('#students', '60');
    await page.click('#client-view-button');
    assert.equal(await page.locator('#client-view').isVisible(), true);
    const client = page.locator('#client-offers');
    assert.match(await client.innerText(), /77,168\.00/);
    assert.match(await client.innerText(), /30,867\.20/);
    assert.match(await client.innerText(), /2,893\.80/);
    assert.match(await page.locator('#schoolMetrics').innerText(), /77,168\.00/);
    assert.doesNotMatch(await page.locator('#client-view').innerText(), /Costo directo estimado|Margen bruto GG|Ganancia bruta GG/);
    await page.fill('#qty', '10');
    assert.match(await client.innerText(), /154,336\.00/);
    assert.match(await page.locator('#schoolMetrics').innerText(), /154,336\.00/);
    await page.click('#internal-view-button');
    assert.equal(await page.inputValue('#qty'), '10');
    assert.equal(await page.locator('#client-view').isVisible(), false);
  } finally { await page.close(); }
});

test('la propuesta destaca el precio sin IVA y mantiene visible el total con IVA', async () => {
  const page = await newPage();
  try {
    await page.selectOption('#tech', 'Spike');
    await page.selectOption('#mode', 'EVO8');
    await page.selectOption('#down', '.20');
    await page.click('#client-view-button');
    const card = page.locator('#client-offers .client-offer');
    assert.equal(await card.locator('.client-total-label').innerText(), 'Inversión total sin IVA');
    assert.match(await card.locator('.client-total').innerText(), /63,494\.00/);
    const taxInclusive = card.locator('.client-tax-inclusive');
    assert.match(await taxInclusive.innerText(), /Total con IVA/);
    assert.match(await taxInclusive.innerText(), /71,113\.28/);
    assert.equal(await taxInclusive.isVisible(), true);
    const sizes = await card.evaluate(el => ({
      primary: parseFloat(getComputedStyle(el.querySelector('.client-total')).fontSize),
      secondary: parseFloat(getComputedStyle(el.querySelector('.client-tax-inclusive')).fontSize)
    }));
    assert.ok(sizes.primary > sizes.secondary && sizes.secondary >= 14);
    assert.match(await card.locator('.client-payment').innerText(), /Pago inicial con IVA/);
    assert.match(await card.locator('.client-payment').innerText(), /8 cuotas mensuales con IVA/);
    await page.fill('#qty', '10');
    assert.match(await card.locator('.client-total').innerText(), /126,988\.00/);
    assert.match(await taxInclusive.innerText(), /142,226\.56/);
    await page.selectOption('#mode', 'ALL');
    assert.equal(await page.locator('#client-offers .client-tax-inclusive:visible').count(), 4);
    assert.equal(await page.locator('#client-offers .client-total-label').filter({hasText: 'sin IVA'}).count(), 4);
  } finally { await page.close(); }
});

test('comparación y catálogo reflejan las cuatro modalidades y las seis tecnologías', async () => {
  const page = await newPage();
  try {
    await page.click('#client-view-button');
    await page.selectOption('#mode', 'ALL');
    const offers = await page.locator('#client-offers').innerText();
    for (const name of ['INTEGRA', 'FLEX', 'EVOLUCIONA 8', 'EVOLUCIONA 16']) assert.ok(offers.includes(name), name);
    for (const [tech, label] of [['Spike', 'Robot Cartógrafo'], ['TaleBot', 'Rutas para pequeños'], ['Snap', 'Circuitos en Acción'], ['Meta', 'Expediciones VR'], ['Robot Master', 'Robots que se mueven'], ['Drones', 'Aventura de vuelo']]) {
      await page.selectOption('#tech', tech);
      assert.ok((await page.locator('#client-project').innerText()).toLowerCase().includes(label.toLowerCase()), tech);
    }
  } finally { await page.close(); }
});

test('las tres tecnologías muestran sus referencias visuales y aclaran su alcance', async () => {
  const page = await newPage();
  try {
    await page.click('#client-view-button');
    for (const [tech, file, label] of [
      ['TaleBot', 'talebot-equipo.png', /Equipo real/i],
      ['Robot Master', 'robot-master-equipo.png', /Equipo real/i],
      ['Drones', 'drones-educativos-generado.png', /Imagen ilustrativa/i]
    ]) {
      await page.selectOption('#tech', tech);
      const project = page.locator('#client-project');
      const image = project.locator('img');
      assert.match(await project.innerText(), label);
      assert.match(await image.getAttribute('src'), new RegExp(file.replace('.', '\\.')));
      await image.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => { const image = document.querySelector('#client-project img'); return image && image.complete && image.naturalWidth > 0; });
    }
  } finally { await page.close(); }
});

test('las categorías de robótica usan nombres por edad y conservan los precios', async () => {
  const page = await newPage();
  try {
    await page.fill('#qty', '5');
    await page.selectOption('#mode', 'BUY');
    await page.click('#client-view-button');
    for (const [key, label, amount] of [
      ['TaleBot', 'Robótica para pequeños', '11,200.00'],
      ['Robot Master', 'Robótica para primaria', '13,720.00'],
      ['Spike', 'Robótica para grandes', '45,920.00']
    ]) {
      assert.equal(await page.locator('#tech option').filter({hasText: label}).getAttribute('value'), key);
      await page.selectOption('#tech', key);
      assert.ok((await page.locator('#client-summary').innerText()).includes(label));
      assert.ok((await page.locator('#client-offers').innerText()).includes(amount));
      assert.doesNotMatch(await page.locator('#client-project').innerText(), /Tale.?Bot|Robot Master|Spike|Matatalab/i);
    }
  } finally { await page.close(); }
});

test('electrónica usa un nombre de programa y conserva su cálculo', async () => {
  const page = await newPage();
  try {
    assert.equal(await page.locator('#tech option[value="Snap"]').textContent(), 'Electrónica');
    await page.selectOption('#tech', 'Snap');
    await page.selectOption('#mode', 'BUY');
    await page.fill('#qty', '5');
    assert.match(await page.locator('#techCard').innerText(), /Electrónica/);
    await page.click('#client-view-button');
    assert.match(await page.locator('#client-summary').innerText(), /Electrónica/);
    assert.match(await page.locator('#client-offers').innerText(), /9,800\.00/);
    assert.doesNotMatch(await page.locator('#client-view').innerText(), /Snap Circuit/i);
  } finally { await page.close(); }
});

test('la presentación muestra Socrates con un recorrido controlable y condiciones actualizadas', async () => {
  const page = await newPage();
  try {
    await page.click('#client-view-button');
    const section = page.locator('[aria-labelledby="client-included-title"]');
    assert.match(await section.innerText(), /Socrates Aprende/);
    assert.match(await section.innerText(), /Sexto primaria/i);
    assert.equal(await section.getByRole('link', {name: /Explorar Socrates/}).getAttribute('href'), 'https://socrates-439aa.web.app/#/semana/s01');
    const preview = page.locator('#socrates-preview');
    const toggle = page.locator('#socrates-motion-toggle');
    assert.match(await preview.getAttribute('src'), /\.gif$/);
    await toggle.click();
    assert.match(await preview.getAttribute('src'), /\.webp$/);
    await toggle.click();
    assert.match(await preview.getAttribute('src'), /\.gif$/);
    await page.selectOption('#mode', 'RENT');
    await page.selectOption('#bims', '3');
    assert.match(await page.locator('#client-support').innerText(), /6 meses/);
    await page.emulateMedia({reducedMotion: 'reduce'});
    await page.reload();
    await page.click('#client-view-button');
    assert.match(await preview.getAttribute('src'), /\.webp$/);
    await preview.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const image = document.querySelector('#socrates-preview'); return image.complete && image.naturalWidth > 0; });
    assert.ok(await preview.evaluate(image => image.complete && image.naturalWidth > 0));
  } finally { await page.close(); }
});

test('el escenario persiste al recargar y la vista cabe en móvil', async () => {
  const page = await newPage();
  try {
    await page.setViewportSize({width: 375, height: 812});
    await page.selectOption('#tech', 'Snap');
    await page.selectOption('#mode', 'RENT');
    await page.selectOption('#bims', '3');
    await page.fill('#students', '45');
    await page.reload();
    assert.equal(await page.inputValue('#tech'), 'Snap');
    assert.equal(await page.inputValue('#mode'), 'RENT');
    assert.equal(await page.inputValue('#bims'), '3');
    assert.equal(await page.inputValue('#students'), '45');
    await page.click('#client-view-button');
    assert.match(await page.locator('#client-offers').innerText(), /6 meses/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, 'La página institucional no debe desbordar horizontalmente');
  } finally { await page.close(); }
});

test('el modo presentación oculta la vista interna y conserva los cambios en vivo', async () => {
  const page = await newPage();
  try {
    await page.click('#client-view-button');
    await page.click('#presentation-mode-button');
    assert.equal(await page.locator('#internal-view-button').isVisible(), false);
    assert.equal(await page.locator('#internal-view').isVisible(), false);
    await page.selectOption('#mode', 'BUY');
    await page.fill('#qty', '10');
    assert.match(await page.locator('#client-offers').innerText(), /91,840\.00/);
    await page.reload();
    assert.equal(await page.locator('#client-view').isVisible(), true);
    assert.equal(await page.locator('#internal-view-button').isVisible(), false);
    assert.equal(await page.inputValue('#qty'), '10');
    await page.getByRole('button', {name: 'Salir de presentación'}).click();
    assert.equal(await page.locator('#internal-view-button').isVisible(), true);
    await page.click('#internal-view-button');
    assert.equal(await page.locator('#internal-view').isVisible(), true);
  } finally { await page.close(); }
});

test('las ofertas son legibles y se adaptan a una o varias tarjetas', async () => {
  const page = await newPage();
  try {
    await page.click('#client-view-button');
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({width, height: 900});
      for (const mode of ['BUY', 'ALL']) {
        await page.selectOption('#mode', mode);
        const offers = page.locator('#client-offers');
        const cards = offers.locator('.client-offer');
        assert.equal(await cards.count(), mode === 'ALL' ? 4 : 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}/${mode}: desbordamiento`);
        const first = await cards.first().boundingBox();
        assert.ok(first.width >= Math.min(300, width - 60), `${width}/${mode}: tarjeta demasiado estrecha`);
        const textSize = await cards.first().locator('.client-offer-desc').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
        assert.ok(textSize >= 15, `${width}/${mode}: texto demasiado pequeño`);
        if (mode === 'BUY') {
          const container = await offers.boundingBox();
          assert.ok(first.width >= container.width * 0.95, `${width}: la tarjeta individual debe aprovechar el espacio`);
        }
      }
    }
  } finally { await page.close(); }
});

test('la vista interna cabe en la pantalla y la tabla conserva su desplazamiento propio', async () => {
  const page = await newPage();
  try {
    for (const width of [375, 768, 1024, 1440, 1952]) {
      await page.setViewportSize({width, height: 900});
      for (const mode of ['EVO16', 'ALL']) {
        await page.selectOption('#mode', mode);
        const dimensions = await page.evaluate(() => {
          const main = document.querySelector('#internal-view').getBoundingClientRect();
          const table = document.querySelector('.table-wrap');
          return {pageWidth: document.documentElement.scrollWidth, viewport: innerWidth, mainRight: main.right, tableWidth: table.clientWidth, tableContent: table.scrollWidth};
        });
        assert.ok(dimensions.pageWidth <= dimensions.viewport, `${width}/${mode}: página desbordada (${dimensions.pageWidth}px)`);
        assert.ok(dimensions.mainRight <= dimensions.viewport, `${width}/${mode}: panel fuera de pantalla`);
        if (dimensions.tableWidth < 1180) assert.ok(dimensions.tableContent > dimensions.tableWidth, `${width}: la tabla debe desplazarse dentro de su contenedor`);
      }
    }
  } finally { await page.close(); }
});

test('los campos de equipos y estudiantes quedan alineados en ambas vistas', async () => {
  const page = await newPage();
  try {
    await page.setViewportSize({width: 1440, height: 900});
    for (const view of ['internal', 'client']) {
      if (view === 'client') await page.click('#client-view-button');
      const qty = await page.locator('#qty').boundingBox();
      const students = await page.locator('#students').boundingBox();
      assert.ok(Math.abs(qty.y - students.y) < 1, `${view}: los campos no están alineados`);
      assert.ok(Math.abs(qty.height - students.height) < 1, `${view}: alturas distintas`);
    }
  } finally { await page.close(); }
});

test('una oferta interna organiza el resumen y los valores en columnas cuando hay espacio', async () => {
  const page = await newPage();
  try {
    await page.setViewportSize({width: 1440, height: 900});
    await page.selectOption('#mode', 'EVO16');
    const intro = await page.locator('#offers .offer-intro').boundingBox();
    const details = await page.locator('#offers .offer-details').boundingBox();
    assert.ok(details.x >= intro.x + intro.width, 'los importes deben quedar junto al resumen');
    assert.ok(Math.abs(details.y - intro.y) < 3, 'las columnas deben comenzar alineadas');
    assert.match(await page.locator('#offers').innerText(), /77,168/);
    await page.selectOption('#mode', 'ALL');
    const cards = page.locator('#offers .offer');
    assert.equal(await cards.count(), 4);
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    const third = await cards.nth(2).boundingBox();
    assert.ok(Math.abs(first.y - second.y) < 2 && third.y > first.y, 'la comparación debe distribuirse en dos columnas legibles');
  } finally { await page.close(); }
});

test('las modalidades aplican los valores, plazos y condiciones correspondientes', async () => {
  const page = await newPage();
  try {
    await page.selectOption('#tech', 'Spike');
    await page.fill('#qty', '5');
    await page.fill('#students', '60');
    await page.selectOption('#bims', '3');
    await page.click('#client-view-button');
    for (const [mode, amount] of [['BUY', '45,920.00'], ['RENT', '29,836.80'], ['EVO8', '67,088.00'], ['EVO16', '77,168.00']]) {
      await page.selectOption('#mode', mode);
      assert.ok((await page.locator('#client-offers').innerText()).includes(amount), mode);
    }
    await page.selectOption('#down', '.30');
    assert.match(await page.locator('#client-offers').innerText(), /81,026\.40/);
    await page.selectOption('#mode', 'ALL');
    const offers = await page.locator('#client-offers').innerText();
    for (const amount of ['45,920.00', '29,836.80', '69,100.64', '81,026.40']) assert.ok(offers.includes(amount), amount);
    assert.equal(await page.locator('#client-offers .client-offer').count(), 4);
  } finally { await page.close(); }
});

test('cantidades inválidas no producen una propuesta financiera engañosa', async () => {
  const page = await newPage();
  try {
    await page.click('#client-view-button');
    await page.fill('#qty', '0');
    assert.equal(await page.locator('#client-validation').isVisible(), true);
    assert.equal(await page.locator('#client-offers').isVisible(), false);
    assert.equal(await page.getAttribute('#qty', 'aria-invalid'), 'true');
    await page.click('#internal-view-button');
    assert.equal(await page.locator('#internalValidation').isVisible(), true);
    assert.equal(await page.locator('#schoolMetrics').isVisible(), false);
    await page.click('#client-view-button');
    await page.fill('#qty', '5');
    await page.fill('#students', '2.5');
    assert.equal(await page.locator('#client-validation').isVisible(), true);
    await page.fill('#students', '60');
    assert.equal(await page.locator('#client-validation').isVisible(), false);
    assert.equal(await page.locator('#client-offers').isVisible(), true);
  } finally { await page.close(); }
});

test('cada tecnología y modalidad conserva los mismos importes en las dos vistas', async () => {
  const page = await newPage();
  try {
    await page.fill('#qty', '7');
    await page.fill('#students', '48');
    await page.selectOption('#bims', '2');
    await page.selectOption('#down', '.20');
    await page.click('#client-view-button');
    for (const tech of ['TaleBot', 'Robot Master', 'Spike', 'Snap', 'Drones', 'Meta']) {
      await page.selectOption('#tech', tech);
      for (const mode of ['BUY', 'RENT', 'EVO8', 'EVO16']) {
        await page.selectOption('#mode', mode);
        const financialValues = await page.locator('#schoolMetrics .v').allTextContents();
        const clientText = await page.locator('#client-offers').innerText();
        for (const value of [financialValues[0], financialValues[1], financialValues[3]]) assert.ok(clientText.includes(value), `${tech}/${mode}: ${value}`);
        assert.doesNotMatch(clientText, /NaN|Infinity/);
      }
    }
  } finally { await page.close(); }
});

test('opciones guardadas que ya no existen no rompen el simulador', async () => {
  const page = await newPage();
  try {
    await page.evaluate(() => localStorage.setItem('guategeeks-simulador-v12', JSON.stringify({tech: 'obsoleta', mode: 'obsoleta', bims: '99', down: '2', schoolMargin: '7'})));
    await page.reload();
    assert.equal(await page.inputValue('#tech'), 'Spike');
    assert.equal(await page.inputValue('#mode'), 'ALL');
    await page.click('#client-view-button');
    assert.match(await page.locator('#client-project').innerText(), /Robot Cartógrafo/);
    assert.equal(await page.locator('#client-offers .client-offer').count(), 4);
  } finally { await page.close(); }
});

test('el cotizador toma la modalidad y cantidades del simulador sin exponer costos internos', async () => {
  const page = await newPage();
  try {
    await page.selectOption('#tech', 'TaleBot');
    await page.selectOption('#mode', 'RENT');
    await page.selectOption('#bims', '2');
    await page.fill('#qty', '6');
    await page.fill('#students', '48');
    await page.click('#quote-open');
    assert.equal(await page.inputValue('#quote-mode'), 'RENT');
    assert.equal(await page.locator('.quote-level-tech').inputValue(), 'TaleBot');
    assert.equal(await page.locator('.quote-level-qty').inputValue(), '6');
    assert.match(await page.locator('#quote-snapshot').innerText(), /6 equipos · 48 estudiantes/);
    assert.doesNotMatch(await page.locator('#quote-snapshot').innerText(), /Costo directo|Margen bruto GG|Ganancia bruta GG/);
  } finally { await page.close(); }
});

test('la cotización PDF refleja varios grados en una sola ficha y se descarga en archivo local', async () => {
  const page = await browser.newPage({acceptDownloads: true});
  try {
    await page.goto(`file://${path.join(root, 'index.html')}`);
    await page.click('#quote-open');
    await page.fill('#quote-school', 'Colegio Costa Sur');
    await page.locator('.quote-grade-row[data-grade="b1"] .quote-grade-check').check();
    await page.locator('.quote-grade-row[data-grade="b1"] .quote-grade-students').fill('40');
    await page.check('#quote-projection');
    const pending = page.waitForEvent('download');
    await page.click('#quote-download');
    const saved = await pending;
    assert.match(saved.suggestedFilename(), /colegio-costa-sur-evoluciona-16\.pdf$/);
    const bytes = fs.readFileSync(await saved.path());
    const pdf = await PDFDocument.load(bytes);
    assert.equal(pdf.getPageCount(), 5);
    assert.ok(bytes.length > 200_000);
  } finally { await page.close(); }
});

test('cada tecnología genera su propuesta con kit e imagen de aula', async () => {
  const page = await newPage();
  try {
    for (const [tech, name] of [['TaleBot','Robótica para pequeños'],['Robot Master','Robótica para primaria'],['Spike','Robótica para grandes'],['Snap','Electrónica'],['Meta','Realidad virtual educativa'],['Drones','Drones Educativos']]) {
      await page.selectOption('#tech', tech);
      await page.selectOption('#mode', 'BUY');
      await page.click('#quote-open');
      await page.fill('#quote-school', 'Colegio de prueba');
      assert.match(await page.locator('.quote-level-tech').locator('option:checked').innerText(), new RegExp(name));
      const pending = page.waitForEvent('download');
      await page.click('#quote-download');
      const pdf = await PDFDocument.load(fs.readFileSync(await (await pending).path()));
      assert.equal(pdf.getPageCount(), 4, tech);
    }
  } finally { await page.close(); }
});
