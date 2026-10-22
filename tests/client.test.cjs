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

test('la cotización permite agregar y repetir niveles con equipos y estudiantes propios', async () => {
  const page = await newPage();
  try {
    await page.selectOption('#mode', 'EVO16');
    await page.click('#quote-open');
    await page.selectOption('#quote-scope', 'multi');
    assert.equal(await page.locator('.quote-level').count(), 1);
    await page.locator('.quote-level').first().locator('.quote-level-stage').selectOption('pre');
    await page.locator('.quote-level').first().locator('.quote-level-tech').selectOption('Snap');
    await page.locator('.quote-level').first().locator('.quote-level-qty').fill('2');
    await page.locator('.quote-level').first().locator('.quote-level-students').fill('24');
    const expected = await page.evaluate(() => calculateScenario({tech:'Snap',qty:2,students:24,bims:1,down:.4,sm:.25}).EVO16.net);
    assert.match(await page.locator('.quote-level').first().locator('.quote-level-reach').innerText(), /24 estudiantes alcanzados · 2 equipos/);
    assert.match(await page.locator('#quote-snapshot').innerText(), new RegExp(expected.toLocaleString('es-GT', {minimumFractionDigits:2})));
    assert.match(await page.locator('.quote-level').first().locator('.quote-level-suggested').innerText(), /Cobro sugerido: Q/);
    await page.click('#quote-add-level');
    assert.equal(await page.locator('.quote-level').count(), 2);
    await page.locator('.quote-level').last().locator('.quote-level-stage').selectOption('pre');
    await page.locator('.quote-level').last().locator('.quote-level-tech').selectOption('Spike');
    const larger = await page.evaluate(() => calculateScenario({tech:'Spike',qty:5,students:60,bims:1,down:.4,sm:.25}).EVO16.net);
    assert.match(await page.locator('#quote-snapshot').innerText(), new RegExp((expected + larger).toLocaleString('es-GT', {minimumFractionDigits:2})));
    assert.deepEqual(await page.locator('.quote-level-stage').evaluateAll(nodes => nodes.map(node => node.value)), ['pre', 'pre']);
    await page.locator('.quote-level').last().locator('.quote-level-remove').click();
    assert.equal(await page.locator('.quote-level').count(), 1);
    await page.locator('.quote-level').first().locator('.quote-level-qty').fill('0');
    assert.equal(await page.locator('#quote-download').isDisabled(), true);
    await page.selectOption('#quote-mode', 'BUY');
    assert.equal(await page.locator('#quote-scope').isEnabled(), true);
    assert.equal(await page.inputValue('#quote-scope'), 'multi');
    assert.equal(await page.locator('#quote-levels').isVisible(), true);
    assert.equal(await page.locator('#quote-projection').isDisabled(), true);
  } finally { await page.close(); }
});

test('agregar otro programa desde la ficha inicial conserva el primero y abre una ficha nueva', async () => {
  const page = await newPage();
  try {
    await page.click('#quote-open');
    await page.selectOption('#quote-single-level', 'pre');
    await page.selectOption('#quote-single-tech', 'TaleBot');
    await page.fill('#quote-single-qty', '11');
    await page.fill('#quote-single-students', '47');
    await page.click('#quote-start-multi');
    assert.equal(await page.inputValue('#quote-scope'), 'multi');
    assert.equal(await page.locator('.quote-level').count(), 2);
    assert.equal(await page.locator('.quote-level').first().locator('.quote-level-stage').inputValue(), 'pre');
    assert.equal(await page.locator('.quote-level').first().locator('.quote-level-qty').inputValue(), '11');
    assert.equal(await page.locator('.quote-level').first().locator('.quote-level-students').inputValue(), '47');
  } finally { await page.close(); }
});

test('cada programa permite escoger grados concretos sin perderlos al cambiar de tecnología', async () => {
  const page = await newPage();
  try {
    await page.click('#quote-open');
    await page.selectOption('#quote-single-level', 'primary');
    const grades = page.locator('#quote-single .quote-grade-picker input');
    assert.equal(await grades.count(), 6);
    await page.locator('#quote-single .quote-grade-picker input[value="4"]').check();
    await page.selectOption('#quote-single-tech', 'Robot Master');
    assert.equal(await page.locator('#quote-single .quote-grade-picker input[value="4"]').isChecked(), true);
    assert.match(await page.locator('#quote-snapshot').innerText(), /4.º primaria/);
    for (const grade of [1, 2, 3, 4]) await page.locator(`#quote-single .quote-grade-picker input[value="${grade}"]`).uncheck();
    assert.equal(await page.locator('#quote-download').isDisabled(), true);
    await page.locator('#quote-single .quote-grade-picker input[value="5"]').check();
    assert.equal(await page.locator('#quote-download').isEnabled(), true);
    assert.match(await page.locator('#quote-snapshot').innerText(), /5.º primaria/);
    await page.click('#quote-start-multi');
    assert.equal(await page.locator('.quote-level').first().locator('.quote-grade-picker input[value="5"]').isChecked(), true);
    await page.locator('.quote-level').last().locator('.quote-level-stage').selectOption('basic');
    assert.equal(await page.locator('.quote-level').last().locator('.quote-grade-picker input').count(), 3);
    await page.locator('.quote-level').last().locator('.quote-level-stage').selectOption('bach');
    assert.equal(await page.locator('.quote-level').last().locator('.quote-grade-picker input').count(), 2);
  } finally { await page.close(); }
});

test('descarga programas agregables en varias páginas y permite INTEGRA multinivel', async () => {
  const page = await newPage();
  try {
    await page.selectOption('#mode', 'EVO16');
    await page.click('#quote-open');
    await page.fill('#quote-school', 'Instituto del Valle');
    await page.selectOption('#quote-scope', 'multi');
    for (let i = 1; i < 5; i++) await page.click('#quote-add-level');
    const pending = page.waitForEvent('download');
    await page.click('#quote-download');
    const first = await pending;
    assert.match(first.suggestedFilename(), /instituto-del-valle-evoluciona-16-multinivel\.pdf$/);
    const multi = await PDFDocument.load(fs.readFileSync(await first.path()));
    assert.equal(multi.getPageCount(), 6);
    assert.match(multi.getSubject(), /5 programas/);

    await page.click('#quote-open');
    await page.selectOption('#quote-scope', 'multi');
    await page.fill('#quote-school', 'Instituto del Valle');
    await page.check('#quote-projection');
    for (let i = 1; i < 5; i++) await page.click('#quote-add-level');
    const next = page.waitForEvent('download');
    await page.click('#quote-download');
    const withProjection = await PDFDocument.load(fs.readFileSync(await (await next).path()));
    assert.equal(withProjection.getPageCount(), 8);

    await page.selectOption('#mode', 'BUY');
    await page.click('#quote-open');
    await page.fill('#quote-school', 'Instituto del Valle');
    await page.selectOption('#quote-scope', 'multi');
    await page.click('#quote-add-level');
    assert.equal(await page.locator('#quote-scope').isEnabled(), true);
    const buyPending = page.waitForEvent('download');
    await page.click('#quote-download');
    const buy = await PDFDocument.load(fs.readFileSync(await (await buyPending).path()));
    assert.equal(buy.getPageCount(), 3);
  } finally { await page.close(); }
});

test('las recomendaciones de cada nivel conservan una línea legible en móvil', async () => {
  const page = await browser.newPage({viewport: {width: 390, height: 844}});
  try {
    await page.goto(baseURL);
    await page.click('#quote-open');
    await page.selectOption('#quote-scope', 'multi');
    const metrics = await page.locator('.quote-level').first().locator('.quote-level-suggested').evaluate(node => {
      const style = getComputedStyle(node);
      return {height: node.getBoundingClientRect().height, lineHeight: parseFloat(style.lineHeight)};
    });
    assert.ok(metrics.height <= metrics.lineHeight * 2.2, 'La recomendación no debe crecer más de dos líneas.');
  } finally { await page.close(); }
});

test('nueve programas generan páginas adicionales sin limitar la selección de niveles', async () => {
  const page = await newPage();
  try {
    await page.selectOption('#mode', 'RENT');
    await page.click('#quote-open');
    await page.fill('#quote-school', 'Colegio Integral');
    await page.selectOption('#quote-scope', 'multi');
    for (let i = 1; i < 9; i++) await page.click('#quote-add-level');
    assert.equal(await page.locator('.quote-level').count(), 9);
    const pending = page.waitForEvent('download');
    await page.click('#quote-download');
    const pdf = await PDFDocument.load(fs.readFileSync(await (await pending).path()));
    assert.equal(pdf.getPageCount(), 9);
    assert.match(pdf.getSubject(), /9 programas/);
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

test('la cotización sigue la modalidad y los importes del escenario sin exponer la vista interna', async () => {
  const page = await newPage();
  try {
    await page.selectOption('#tech', 'TaleBot');
    await page.selectOption('#mode', 'RENT');
    await page.selectOption('#bims', '2');
    await page.fill('#qty', '6');
    await page.fill('#students', '48');
    await page.click('#quote-open');
    assert.equal(await page.locator('#quote-dialog').isVisible(), true);
    assert.equal(await page.inputValue('#quote-mode'), 'RENT');
    const snapshot = await page.locator('#quote-snapshot').innerText();
    assert.match(snapshot, /Robótica para pequeños · 6 equipos · 48 estudiantes/);
    const expectedNet = await page.evaluate(() => calc().RENT.net);
    assert.ok(snapshot.includes(`Q ${expectedNet.toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`));
    assert.doesNotMatch(snapshot, /Costo directo|Margen bruto GG|Ganancia bruta GG/);
    const schedule = await page.evaluate(() => ({initial: calc().RENT.initial, monthly: calc().RENT.installment, gross: calc().RENT.gross}));
    assert.ok(Math.abs(schedule.initial - schedule.gross * .2) < .01);
    assert.ok(Math.abs(schedule.initial + schedule.monthly * 4 - schedule.gross) < .01);
    await page.selectOption('#quote-mode', 'BUY');
    assert.equal(await page.locator('#quote-projection').isDisabled(), true);
    await page.selectOption('#quote-mode', 'RENT');
    assert.equal(await page.locator('#quote-projection').isEnabled(), true);
    await page.click('#quote-cancel');
    assert.equal(await page.locator('#quote-dialog').isVisible(), false);
  } finally { await page.close(); }
});

test('el programa único se configura dentro del cotizador y personaliza el PDF', async () => {
  const page = await newPage();
  try {
    await page.click('#quote-open');
    await page.fill('#quote-school', 'Colegio Horizonte');
    await page.selectOption('#quote-single-level', 'basic');
    await page.selectOption('#quote-single-tech', 'Snap');
    await page.fill('#quote-single-qty', '3');
    await page.fill('#quote-single-students', '42');
    const expected = await page.evaluate(() => calculateScenario({tech:'Snap',qty:3,students:42,bims:1,down:.4,sm:.25}).EVO16.net);
    const snapshot = await page.locator('#quote-snapshot').innerText();
    assert.match(snapshot, /1.º a 3.º básico · Electrónica · 3 equipos · 42 estudiantes/);
    assert.ok(snapshot.includes(`Q ${expected.toLocaleString('es-GT', {minimumFractionDigits:2})}`));
    assert.match(await page.locator('#quote-single-hint').innerText(), /Cobro sugerido: Q/);
    assert.equal(await page.inputValue('#tech'), 'Spike', 'El cotizador no debe alterar el escenario interno');
    const pending = page.waitForEvent('download');
    await page.click('#quote-download');
    const pdf = await PDFDocument.load(fs.readFileSync(await (await pending).path()));
    assert.match(pdf.getSubject(), /Electrónica/);
  } finally { await page.close(); }
});

test('cambiar entre programa único y varios niveles ignora campos ocultos inválidos', async () => {
  const page = await newPage();
  try {
    await page.click('#quote-open');
    await page.fill('#quote-school', 'Colegio Horizonte');
    await page.fill('#quote-single-qty', '0');
    await page.selectOption('#quote-scope', 'multi');
    assert.equal(await page.locator('#quote-single-qty').isDisabled(), true);
    assert.equal(await page.locator('#quote-form').evaluate(form => form.checkValidity()), true);
    await page.locator('.quote-level').first().locator('.quote-level-qty').fill('0');
    await page.selectOption('#quote-scope', 'single');
    await page.fill('#quote-single-qty', '2');
    assert.equal(await page.locator('.quote-level').first().locator('.quote-level-qty').isDisabled(), true);
    assert.equal(await page.locator('#quote-form').evaluate(form => form.checkValidity()), true);
  } finally { await page.close(); }
});

test('descarga una propuesta PDF de dos páginas y una proyección opcional en la tercera', async () => {
  const page = await newPage();
  try {
    await page.selectOption('#tech', 'Spike');
    await page.selectOption('#mode', 'EVO8');
    await page.fill('#qty', '5');
    await page.fill('#students', '75');
    await page.click('#quote-open');
    await page.fill('#quote-school', 'Colegio Costa Sur');
    await page.fill('#quote-contact', 'Ana García');
    await page.fill('#quote-email', 'ana@colegio.edu.gt');
    const firstDownload = page.waitForEvent('download');
    await page.click('#quote-download');
    const first = await firstDownload;
    assert.match(first.suggestedFilename(), /GuateGeeks-cotizacion-colegio-costa-sur-evoluciona-8\.pdf/);
    const firstBytes = fs.readFileSync(await first.path());
    assert.equal(firstBytes.subarray(0, 5).toString(), '%PDF-');
    const firstPdf = await PDFDocument.load(firstBytes);
    assert.equal(firstPdf.getPageCount(), 2);
    assert.match(firstPdf.getTitle(), /Colegio Costa Sur/);
    assert.match(firstPdf.getSubject(), /EVOLUCIONA 8.*Robótica para grandes/);

    await page.click('#quote-open');
    await page.check('#quote-projection');
    const secondDownload = page.waitForEvent('download');
    await page.click('#quote-download');
    const second = await secondDownload;
    const secondPdf = await PDFDocument.load(fs.readFileSync(await second.path()));
    assert.equal(secondPdf.getPageCount(), 3);
  } finally { await page.close(); }
});

test('cada tecnología genera una cotización PDF con su programa y recursos visuales', async () => {
  const page = await newPage();
  try {
    for (const [tech, program, title] of [
      ['TaleBot', 'Robótica para pequeños', 'Rutas para pequeños'],
      ['Robot Master', 'Robótica para primaria', 'Robots que se mueven'],
      ['Spike', 'Robótica para grandes', 'Robot Cartógrafo'],
      ['Snap', 'Electrónica', 'Circuitos en Acción'],
      ['Meta', 'Realidad virtual educativa', 'Expediciones VR'],
      ['Drones', 'Drones Educativos', 'Aventura de vuelo']
    ]) {
      await page.selectOption('#tech', tech);
      await page.selectOption('#mode', 'BUY');
      await page.click('#quote-open');
      await page.fill('#quote-school', 'Colegio de prueba');
      assert.match(await page.locator('#quote-snapshot').innerText(), new RegExp(program));
      const pending = page.waitForEvent('download');
      await page.click('#quote-download');
      const saved = await pending;
      const pdf = await PDFDocument.load(fs.readFileSync(await saved.path()));
      assert.equal(pdf.getPageCount(), 2, tech);
      assert.ok(pdf.getSubject().includes(program), tech);
      assert.equal(await page.locator('#quote-dialog').isVisible(), false, title);
    }
  } finally { await page.close(); }
});

test('la descarga desde archivo local conserva las imágenes y la proyección elegida', async () => {
  const page = await browser.newPage({acceptDownloads: true});
  try {
    await page.goto(`file://${path.join(root, 'index.html')}`);
    await page.selectOption('#tech', 'Spike');
    await page.selectOption('#mode', 'EVO16');
    await page.click('#quote-open');
    await page.fill('#quote-school', 'Colegio Costa Sur');
    await page.check('#quote-projection');
    const pending = page.waitForEvent('download');
    await page.click('#quote-download');
    const saved = await pending;
    const bytes = fs.readFileSync(await saved.path());
    const pdf = await PDFDocument.load(bytes);
    assert.equal(pdf.getPageCount(), 3);
    assert.ok(bytes.length > 200_000, 'El PDF debe llevar fotografías y equipo incrustados.');
    assert.equal(await page.locator('#quote-dialog').isVisible(), false);
  } finally { await page.close(); }
});
