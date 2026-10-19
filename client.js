/* Vista institucional: recibe el resultado del mismo cálculo de la vista interna. */
const clientProjects = {
  Spike: {
    title: 'Robot Cartógrafo', program: 'CiudadBots Guatemala', status: 'Programa disponible',
    image: 'assets/projects/robot-cartografo.png',
    animatedImage: 'assets/projects/animations/robot-cartografo-recorrido.gif',
    alt: 'Modelo del Robot Cartógrafo de CiudadBots',
    description: 'Los estudiantes construyen y programan un robot para explorar y representar recorridos en una ciudad.',
    learning: 'Programación por bloques · medición · resolución de problemas',
    credit: 'Modelo: Ignat Khlebnikov / RoboRiseIT, referencia del programa CiudadBots.',
    link: 'https://guategeeks.com/programas-educativos/ciudadbots/'
  },
  TaleBot: {
    title: 'Rutas para pequeños', program: 'Robótica para pequeños', status: 'Equipo real · actividad ilustrativa',
    image: 'assets/projects/talebot-equipo.png', animatedImage: 'assets/projects/animations/rutas-pequenos.gif', alt: 'Robots educativos pequeños con botones de colores y una ruta de programación ilustrada',
    description: 'Una idea para explorar secuencias y direcciones mediante retos de recorrido con robótica tangible. El proyecto concreto se confirma en la propuesta.',
    learning: 'Secuencias · pensamiento lógico · orientación'
  },
  Snap: {
    title: 'Circuitos en Acción', program: 'Primeros pasos en electrónica', status: 'Referencia de catálogo · próximamente',
    image: 'assets/projects/circuitos.png', animatedImage: 'assets/projects/animations/circuitos-creaciones.gif', alt: 'Estudiantes explorando circuitos y una secuencia ilustrada para encender una luz',
    description: 'Una propuesta para explorar conexiones, energía y relaciones de causa y efecto con circuitos.',
    learning: 'Electrónica · experimentación · causa y efecto'
  },
  Meta: {
    title: 'Expediciones VR', program: 'Experiencias inmersivas', status: 'Referencia de catálogo · próximamente',
    image: 'assets/projects/realidad-virtual.png', animatedImage: 'assets/projects/animations/exploracion-inmersiva.gif', alt: 'Estudiantes explorando realidad virtual y una escena educativa del espacio',
    description: 'Una propuesta de exploraciones inmersivas con experiencias guiadas y reflexión aplicada a ciencia y tecnología.',
    learning: 'Exploración · ciencia · reflexión'
  },
  'Robot Master': {
    title: 'Robots que se mueven', program: 'Robótica para primaria', status: 'Equipo real · actividad ilustrativa',
    image: 'assets/projects/robot-master-equipo.png', animatedImage: 'assets/projects/animations/robot-master-creaciones.gif', alt: 'Kit de construcción robótica y un modelo ilustrado de carro programable',
    description: 'Una idea para construir modelos y explorar movimiento, secuencias y retos de programación. El proyecto concreto se confirma en la propuesta.',
    learning: 'Construcción · movimiento · pensamiento lógico'
  },
  Drones: {
    title: 'Aventura de vuelo', program: 'Drones educativos', status: 'Imagen ilustrativa · actividad propuesta',
    image: 'assets/projects/drones-educativos-generado.png', animatedImage: 'assets/projects/animations/drones-recorrido.gif', alt: 'Dron educativo y ruta ilustrada para practicar un recorrido de vuelo',
    description: 'Una propuesta para explorar trayectorias, orientación y resolución de retos mediante una experiencia de vuelo educativo. El equipo y la actividad se confirman en la propuesta.',
    learning: 'Orientación espacial · secuencias · resolución de retos'
  }
};

function clientConditions(key, data) {
  if (key === 'BUY') return {term: 'Propiedad desde el inicio', support: 'Implementación y soporte inicial durante 2 meses.', basis: 'La equivalencia mensual usa 8 meses como referencia de cálculo.'};
  if (key === 'RENT') return {term: `${data.RENT.months} meses · equipo en renta`, support: `Soporte y mantenimiento por desgaste normal durante ${data.RENT.months} meses.`, basis: 'Los equipos regresan a GuateGeeks al finalizar la renta.'};
  const months = data[key].months;
  return {term: `${months} meses · propiedad al finalizar`, support: `Acompañamiento, seguimiento y mantenimiento por desgaste normal durante ${months} meses.`, basis: 'El equipo queda en propiedad de la institución al completar el contrato.'};
}

function clientOffer(key, data) {
  const offer = data[key];
  const conditions = clientConditions(key, data);
  const payment = key === 'EVO8' || key === 'EVO16'
    ? `<div class="client-payment"><div><span>Pago inicial con IVA</span><strong>${fmt2(offer.initial)}</strong></div><div><span>${offer.months} cuotas mensuales con IVA</span><strong>${fmt2(offer.installment)}</strong></div></div>`
    : '';
  return `<article class="client-offer">
    <div class="client-offer-intro">
    <div class="client-offer-top"><span class="client-offer-name">${meta[key].type}${key === 'EVO8' ? ' 8' : key === 'EVO16' ? ' 16' : ''}</span><span class="client-offer-term">${conditions.term}</span></div>
    <p class="client-offer-desc">${meta[key].desc}</p>
    <div class="client-total-label">Inversión total sin IVA</div><div class="client-total">${fmt2(offer.net)}</div>
    <div class="client-tax-inclusive">Total con IVA: <strong>${fmt2(offer.gross)}</strong></div>
    </div><div class="client-offer-details">
    <div class="client-finance-row"><span>IVA (12 %)</span><strong>${fmt2(offer.tax)}</strong></div>
    <div class="client-finance-row"><span>Por estudiante / mes con IVA</span><strong>${fmt2(offer.perGross)}</strong></div>
    ${payment}<p class="client-offer-note">${conditions.basis}</p>
    <details class="client-economics"><summary>Ver estimación para la institución</summary><div class="client-finance-row"><span>Cobro sugerido / estudiante / mes</span><strong>${fmt(offer.suggested)}</strong></div><div class="client-finance-row"><span>Ingresos estimados</span><strong>${fmt2(offer.revenue)}</strong></div><div class="client-finance-row"><span>Contribución bruta estimada</span><strong>${fmt2(offer.contribution)}</strong></div><p>Proyección con ${data.students} estudiantes durante ${offer.months} meses y un margen objetivo del ${(data.sm * 100).toFixed(0)} %. El cobro sugerido se redondea a múltiplos de Q 5. No descuenta gastos propios ni impuestos de la institución y no es utilidad neta.</p></details></div>
  </article>`;
}

function renderClient(data, selected) {
  const keys = selected === 'ALL' ? ['BUY', 'RENT', 'EVO8', 'EVO16'] : [selected];
  const project = clientProjects[document.getElementById('tech').value];
  const inputs = ['qty', 'students'].map(id => document.getElementById(id));
  const invalid = inputs.map(input => !input.value.trim() || !Number.isSafeInteger(Number(input.value)) || Number(input.value) < 1);
  const hasInvalid = invalid.some(Boolean);
  inputs.forEach((input, index) => input.setAttribute('aria-invalid', String(invalid[index])));
  document.body.classList.toggle('invalid-scenario', hasInvalid);
  document.getElementById('internalValidation').hidden = !hasInvalid;
  document.getElementById('client-validation').hidden = !hasInvalid;
  document.getElementById('client-summary').hidden = hasInvalid;
  document.getElementById('client-offers').hidden = hasInvalid;
  document.getElementById('capacity').hidden = hasInvalid;
  const lead = selected === 'ALL' ? 'Compara las modalidades y encuentra la mejor forma de llevar el programa a tu institución.' : 'Una propuesta que conecta tecnología, aprendizaje y una inversión clara para tu institución.';
  document.getElementById('client-summary').innerHTML = `<div class="client-eyebrow"><span></span> PROPUESTA EDUCATIVA GUATEGEEKS</div><h2>Aprender creando.<br><em>Crecer con propósito.</em></h2><p>${lead}</p><div class="client-summary-chips"><span>${data.t.name}</span><span>${data.qty} equipos</span><span>${data.students} estudiantes</span><span>${data.t.level}</span></div>`;
  const offers = document.getElementById('client-offers');
  offers.classList.toggle('is-single', keys.length === 1);
  offers.innerHTML = keys.map(key => clientOffer(key, data)).join('');

  const projectVisual = project.image
    ? `<div class="client-project-image${project.animatedImage ? ' has-animation' : ''}"><picture>${project.animatedImage ? `<source srcset="${project.animatedImage}" type="image/gif" media="(prefers-reduced-motion: no-preference)">` : ''}<img src="${project.image}" alt="${project.alt}" loading="lazy" decoding="async"></picture></div>`
    : `<div class="client-project-placeholder" aria-hidden="true"><span>GG</span><small>REFERENCIA EN PREPARACIÓN</small></div>`;
  const link = project.link ? `<a class="client-project-link" href="${project.link}" target="_blank" rel="noopener noreferrer">Conocer CiudadBots <span aria-hidden="true">↗</span></a>` : '';
  document.getElementById('client-project').innerHTML = `${projectVisual}<div class="client-project-copy"><span class="client-status">${project.status}</span><p class="client-project-program">${project.program}</p><h3>${project.title}</h3><p>${project.description}</p><div class="client-learning"><span>EN ESTA EXPERIENCIA</span><strong>${project.learning}</strong></div>${link}${project.credit ? `<small class="client-credit">${project.credit}</small>` : ''}</div>`;

  const conditions = selected === 'ALL'
    ? 'La propiedad, duración y soporte varían según la modalidad. Consulta las condiciones de cada alternativa.'
    : `${clientConditions(selected, data).support} ${clientConditions(selected, data).basis}`;
  document.getElementById('client-support').textContent = `Orientación para integrar el programa según las necesidades de la institución. ${conditions}`;
}

function initClientView() {
  const internal = document.getElementById('internal-view');
  const client = document.getElementById('client-view');
  const internalButton = document.getElementById('internal-view-button');
  const clientButton = document.getElementById('client-view-button');
  const presentationButton = document.getElementById('presentation-mode-button');
  const switchLabel = document.querySelector('.view-switch-label');
  const title = document.querySelector('.header h1');
  const description = document.querySelector('.header p');
  const originalTitle = title.textContent;
  const originalDescription = description.textContent;
  let presentationMode = false;
  function setPresentationMode(enabled) {
    presentationMode = enabled;
    document.body.classList.toggle('institution-presentation', enabled);
    internalButton.hidden = enabled;
    clientButton.hidden = enabled;
    switchLabel.hidden = enabled;
    presentationButton.textContent = enabled ? 'Salir de presentación' : 'Ocultar vista interna';
    presentationButton.setAttribute('aria-pressed', String(enabled));
    try { sessionStorage.setItem('guategeeks-presentacion-activa', enabled ? '1' : '0'); } catch (_) {}
  }
  function setView(isClient) {
    internal.hidden = isClient;
    client.hidden = !isClient;
    document.body.classList.toggle('client-presentation', isClient);
    internalButton.setAttribute('aria-pressed', String(!isClient));
    clientButton.setAttribute('aria-pressed', String(isClient));
    presentationButton.hidden = !isClient;
    title.textContent = isClient ? 'Una propuesta para tu institución' : originalTitle;
    description.textContent = isClient ? 'Tecnología, aprendizaje e inversión en un mismo programa.' : originalDescription;
  }
  internalButton.addEventListener('click', () => setView(false));
  clientButton.addEventListener('click', () => setView(true));
  presentationButton.addEventListener('click', () => setPresentationMode(!presentationMode));
  if (document.documentElement.classList.contains('presentation-restoring')) {
    setView(true);
    setPresentationMode(true);
    document.documentElement.classList.remove('presentation-restoring');
  }

  const preview = document.getElementById('socrates-preview');
  const motionButton = document.getElementById('socrates-motion-toggle');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let playing = false;
  function setPreviewMotion(shouldPlay) {
    playing = shouldPlay;
    preview.src = shouldPlay ? 'assets/platform/socrates-recorrido.gif' : 'assets/platform/socrates-preview.webp';
    motionButton.textContent = shouldPlay ? 'Pausar recorrido' : 'Reproducir recorrido';
    motionButton.setAttribute('aria-pressed', String(shouldPlay));
  }
  motionButton.addEventListener('click', () => setPreviewMotion(!playing));
  motionPreference.addEventListener('change', event => { if (event.matches) setPreviewMotion(false); });
  setPreviewMotion(!motionPreference.matches);
}
