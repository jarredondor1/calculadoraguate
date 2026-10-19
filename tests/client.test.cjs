const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright-core');

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

test('la propuesta Costa Sur comunica la inversión y el escenario sugerido', async () => {
  const page = await newPage();
  try {
    await page.goto(`${baseURL}/colegio-costa-sur/index.html`);
    assert.match(await page.title(), /Colegio Costa Sur/);
    const offer = await page.locator('#offer').innerText();
    assert.match(offer, /EVOLUCIONA/);
    assert.equal((offer.match(/8 meses/g) || []).length, 1);
    assert.match(await page.locator('#quote-net').innerText(), /63,494\.00/);
    assert.match(await page.locator('#quote-total-with-vat').innerText(), /71,113\.28/);
    assert.match(await page.locator('#suggested-fee').innerText(), /200/);
    assert.match(await page.locator('#revenue-estimate').innerText(), /96,000\.00/);
    assert.match(await page.locator('#gross-difference').innerText(), /24,886\.72/);
    assert.match(await page.locator('#difference-per-student').innerText(), /414\.78/);
    assert.match(await page.locator('#difference-per-student-month').innerText(), /51\.85/);
  } finally { await page.close(); }
});

test('el colegio ajusta su cuota y observa el efecto en vivo', async () => {
  const page = await newPage();
  try {
    await page.goto(`${baseURL}/colegio-costa-sur/index.html`);
    await page.fill('#school-fee', '250');
    assert.match(await page.locator('#revenue-estimate').innerText(), /120,000\.00/);
    assert.match(await page.locator('#gross-difference').innerText(), /48,886\.72/);
    await page.fill('#student-count', '30');
    assert.match(await page.locator('#revenue-estimate').innerText(), /60,000\.00/);
    assert.match(await page.locator('#quote-total-with-vat').innerText(), /71,113\.28/);
    assert.match(await page.locator('body').innerText(), /Cuota sugerida por GuateGeeks/);
    assert.match(await page.locator('body').innerText(), /Cuota mensual que evaluaría el colegio/);
  } finally { await page.close(); }
});

test('la propuesta Costa Sur valida entradas y no muestra las cuentas internas', async () => {
  const page = await newPage();
  try {
    await page.goto(`${baseURL}/colegio-costa-sur/index.html`);
    const script = await page.evaluate(() => fetch('costa-sur.js').then(response => response.text()));
    for (const phrase of ['costo directo', 'margen objetivo', 'rentabilidad GG', '+6%', '+10%']) {
      assert.equal((await page.locator('body').innerText()).toLowerCase().includes(phrase.toLowerCase()), false);
      assert.equal(script.toLowerCase().includes(phrase.toLowerCase()), false);
    }
    await page.fill('#student-count', '0');
    assert.equal(await page.locator('#results').isVisible(), false);
    assert.equal(await page.locator('#validation-message[role="alert"]').isVisible(), true);
    await page.fill('#student-count', '60');
    await page.fill('#school-fee', '-1');
    assert.equal(await page.locator('#results').isVisible(), false);
    assert.equal(await page.locator('#validation-message[role="alert"]').isVisible(), true);
  } finally { await page.close(); }
});

test('la propuesta Costa Sur se adapta a escritorio y móvil sin desbordamiento', async () => {
  const page = await newPage();
  try {
    await page.goto(`${baseURL}/colegio-costa-sur/index.html`);
    for (const viewport of [{width: 1280, height: 800}, {width: 375, height: 812}]) {
      await page.setViewportSize(viewport);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      assert.equal(await page.locator('#school-fee').isVisible(), true);
      assert.equal(await page.locator('#student-count').isVisible(), true);
      assert.equal(await page.locator('#gross-difference').isVisible(), true);
    }
    const image = page.locator('#project-image');
    await image.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const project = document.querySelector('#project-image');
      return project && project.complete && project.naturalWidth > 0;
    });
    assert.ok(await image.getAttribute('alt'));
  } finally { await page.close(); }
});
