(() => {
  // Solo se incluyen precios comerciales públicos de referencia; nunca costos ni márgenes internos.
  const programs = {
    TaleBot: {name:'Robótica para pequeños',level:'preprimaria',levelName:'Preprimaria',buy:2000,rent:575,evo8:14700,evo16:17000,project:'Rutas para pequeños',image:'talebot-equipo.png',gif:'rutas-pequenos.gif',alt:'Robots educativos pequeños y un recorrido de programación ilustrado',status:'Equipo real · actividad ilustrativa',description:'Una idea para explorar secuencias y direcciones mediante retos de recorrido con robótica tangible.',tags:['Secuencias','Pensamiento lógico','Orientación']},
    'Robot Master': {name:'Robótica para primaria',level:'primaria',levelName:'Primaria · 1.º a 3.º',buy:2450,rent:700,evo8:17900,evo16:20600,project:'Robots que se mueven',image:'robot-master-equipo.png',gif:'robot-master-creaciones.gif',alt:'Kit de construcción robótica y un modelo ilustrado de carro programable',status:'Equipo real · actividad ilustrativa',description:'Una idea para construir modelos y explorar movimiento, secuencias y retos de programación.',tags:['Construcción','Movimiento','Pensamiento lógico']},
    Spike: {name:'Robótica para grandes',level:'secundaria',levelName:'4.º primaria a bachillerato',buy:8200,rent:1850,evo8:59900,evo16:68900,project:'Robot Cartógrafo',image:'robot-cartografo.png',gif:'robot-cartografo-recorrido.gif',alt:'Robot cartógrafo construido para explorar rutas en una ciudad',status:'Programa disponible',description:'Los estudiantes construyen y programan un robot para explorar recorridos, medir distancias y representar una ciudad.',tags:['Programación','Medición','Resolución de problemas']},
    Snap: {name:'Electrónica',level:'transversal',levelName:'Primaria y secundaria',buy:1750,rent:550,evo8:13300,evo16:15300,project:'Circuitos en Acción',image:'circuitos.png',gif:'circuitos-creaciones.gif',alt:'Estudiantes explorando circuitos y una secuencia para encender una luz',status:'Referencia de catálogo',description:'Una propuesta para explorar conexiones, energía y relaciones de causa y efecto con circuitos.',tags:['Electrónica','Experimentación','Causa y efecto']},
    Drones: {name:'Drones educativos',level:'transversal',levelName:'Primaria y secundaria',buy:4150,rent:1000,evo8:30500,evo16:35100,project:'Aventura de vuelo',image:'drones-educativos-generado.png',gif:'drones-recorrido.gif',alt:'Dron educativo y ruta ilustrada para practicar un recorrido de vuelo',status:'Imagen ilustrativa · actividad propuesta',description:'Una propuesta para explorar trayectorias, orientación y resolución de retos mediante una experiencia de vuelo educativo.',tags:['Orientación espacial','Secuencias','Resolución de retos']},
    Meta: {name:'Experiencias inmersivas',level:'transversal',levelName:'Tecnología transversal',buy:5550,rent:1750,evo8:44400,evo16:51100,project:'Expediciones VR',image:'realidad-virtual.png',gif:'exploracion-inmersiva.gif',alt:'Estudiantes explorando realidad virtual y una escena educativa del espacio',status:'Referencia de catálogo',description:'Una propuesta de exploraciones inmersivas con experiencias guiadas y reflexión aplicada a ciencia y tecnología.',tags:['Exploración','Ciencia','Reflexión']}
  };
  const modes = {
    BUY: {title:'INTEGRA',months:8,description:'Adquisición del equipamiento con propiedad desde el inicio e implementación inicial.'},
    RENT: {title:'FLEX',months:2,description:'Acceso al equipamiento mediante renta con acompañamiento durante el período seleccionado.'},
    EVO8: {title:'EVOLUCIONA 8',months:8,description:'Un ciclo de aprendizaje con acompañamiento y equipamiento que queda en propiedad de la institución al completar el contrato.'},
    EVO16: {title:'EVOLUCIONA 16',months:16,description:'Dos ciclos de aprendizaje con acompañamiento y equipamiento que queda en propiedad de la institución al completar el contrato.'}
  };
  function includedItems(mode, program, months) {
    const equipment = mode === 'BUY'
      ? `${program.name} para el aula; propiedad del colegio desde la compra.`
      : mode === 'RENT'
        ? `${program.name} disponible en renta durante ${months} meses; el equipo permanece en propiedad de GuateGeeks.`
        : `${program.name} para el aula; pasa a ser propiedad del colegio al completar ${months} meses.`;
    const items = [{title:'Equipamiento educativo',detail:equipment}];
    if (mode !== 'BUY') items.push({title:'Socrates Aprende',detail:`Acceso a la plataforma educativa durante ${months} meses, con semanas, lecciones y actividades interactivas.`});
    if (mode === 'BUY') {
      items.push({title:'Implementación inicial',detail:'Orientación para poner en marcha el equipamiento en el aula.'});
      items.push({title:'Capacitación de uso',detail:'Incluye 1 hora de capacitación para el uso del equipo. El tiempo adicional se cotiza por separado.'});
    } else {
      items.push({title:'Recursos para el aula',detail:'Actividades prácticas y materiales de apoyo para integrar la tecnología al aprendizaje.'});
      items.push({title:'Acompañamiento y soporte',detail:`Orientación, seguimiento y soporte durante ${months} meses.`});
    }
    return items;
  }
  const $ = id => document.getElementById(id);
  const money = new Intl.NumberFormat('es-GT',{style:'currency',currency:'GTQ',minimumFractionDigits:2,maximumFractionDigits:2});
  const fmt = value => money.format(value);
  const levelFilter = $('level-filter'), programFilter = $('program-filter'), modeFilter = $('offer-filter');
  const qtyInput = $('equipment-count'), feeInput = $('school-fee'), studentsInput = $('student-count');
  function eligiblePrograms() {
    const level = levelFilter.value;
    return Object.entries(programs).filter(([,p]) => level === 'all' || p.level === level || (['primaria','secundaria'].includes(level) && p.level === 'transversal') || (level === 'primaria' && p.level === 'secundaria'));
  }
  function refreshPrograms() {
    const previous = programFilter.value;
    const eligible = eligiblePrograms();
    programFilter.replaceChildren();
    eligible.forEach(([id,p]) => programFilter.add(new Option(p.name,id)));
    programFilter.value = eligible.some(([id]) => id === previous) ? previous : (eligible[0]?.[0] || 'all');
  }
  function selectedProgramId() { return programFilter.value || eligiblePrograms()[0]?.[0] || 'Spike'; }
  function totals(program, mode, quantity) {
    let net, months = modes[mode].months;
    if (mode === 'BUY') net = program.buy * quantity;
    if (mode === 'RENT') {
      const periods = Number($('rental-period')?.value || 1);
      const discount = {1:0,2:.02,3:.04,4:.05}[periods];
      net = program.rent * quantity * periods * (1 - discount);
      months = periods * 2;
    }
    if (mode === 'EVO8') net = program.evo8 * quantity / 5 * 1.06;
    if (mode === 'EVO16') net = program.evo16 * quantity / 5 * 1.10;
    const tax = net * .12, gross = net + tax;
    const initialRate = mode === 'EVO8' || mode === 'EVO16' || mode === 'RENT' ? .2 : 1;
    const initial = gross * initialRate;
    return {net,tax,gross,months,initial,monthly:mode === 'BUY' ? 0 : (gross-initial)/months,initialRate};
  }
  function render() {
    const programId = selectedProgramId(), program = programs[programId], mode = modeFilter.value, model = modes[mode];
    const quantity = Math.max(1,Math.min(100,Math.floor(Number(qtyInput.value) || 1)));
    if (qtyInput.value !== String(quantity)) qtyInput.value = String(quantity);
    const quote = totals(program,mode,quantity), students = Number(studentsInput.value);
    const suggested = Math.ceil((quote.gross / Math.max(1,Number.isFinite(students) ? students : 1) / quote.months / .75) / 5) * 5;
    const followSuggested = $('use-suggested-fee').checked;
    feeInput.readOnly = followSuggested;
    if (followSuggested) feeInput.value = String(suggested);
    $('school-fee-help').textContent = followSuggested ? 'El cobro sigue la sugerencia; desmarca la casilla para probar una cuota propia.' : 'Prueba un cobro distinto. Puedes volver a activar la sugerencia cuando quieras.';
    const fee = Number(feeInput.value);
    $('offer-title').textContent = model.title;
    $('offer-description').textContent = model.description;
    $('term-badge').textContent = `${quote.months} meses`;
    $('quote-net').textContent = fmt(quote.net);
    $('quote-total-with-vat').textContent = fmt(quote.gross);
    $('tax-note').textContent = `Incluye IVA de ${fmt(quote.tax)}`;
    if (mode === 'BUY') $('quote-basis').textContent = `${quantity} ${quantity === 1 ? 'equipo' : 'equipos'} × ${fmt(program.buy)} por equipo = ${fmt(quote.net)} sin IVA`;
    else if (mode === 'RENT') $('quote-basis').textContent = `Renta de ${quantity} ${quantity === 1 ? 'equipo' : 'equipos'} durante ${quote.months} meses · ${fmt(quote.net)} sin IVA`;
    else $('quote-basis').textContent = `${model.title} para ${quantity} ${quantity === 1 ? 'equipo' : 'equipos'} · ${quote.months} meses`;
    const isEvol = mode === 'EVO8' || mode === 'EVO16';
    const isBuy = mode === 'BUY';
    $('explorer').hidden = isBuy;
    $('integra-details').hidden = !isBuy;
    $('initial-label').textContent = isEvol || mode === 'RENT' ? 'Pago inicial · 20 %' : 'Pago inicial · 100 %';
    $('initial-payment').textContent = fmt(quote.initial);
    $('installment-label').textContent = isEvol ? `${quote.months} cuotas mensuales aprox.` : mode === 'RENT' ? `Renta mensual · ${quote.months} meses` : 'Pago único';
    $('monthly-payment').textContent = isBuy ? '—' : fmt(quote.monthly);
    $('ownership-note').textContent = isBuy ? 'El equipamiento queda en propiedad del colegio desde la compra.' : mode === 'RENT' ? 'El equipamiento se utiliza durante la renta; las condiciones finales se confirman con GuateGeeks.' : 'El equipamiento queda en propiedad del colegio al completar el contrato.';
    $('rounding-note').hidden = !isEvol;
    $('rental-field').hidden = mode !== 'RENT';
    $('experience-title').textContent = program.name;
    $('catalog-status').textContent = `${quantity < 5 ? 'Escenario informativo · mínimo comercial 5 equipos. ' : ''}${program.name} · ${program.levelName} · ${quantity} ${quantity === 1 ? 'equipo' : 'equipos'} · ${model.title}`;
    $('suggested-fee').textContent = fmt(suggested);
    $('suggested-description').textContent = `Referencia para ${quantity} ${quantity === 1 ? 'equipo' : 'equipos'} y ${Number.isFinite(students) && students > 0 ? students : 'el grupo seleccionado'} estudiantes con ${model.title}; la institución decide su cobro final.`;
    const validStudents = Number.isSafeInteger(students) && students >= 1 && students <= 500;
    const validFee = Number.isFinite(fee) && fee >= 1 && fee <= 10000;
    $('validation-message').hidden = validStudents && validFee;
    $('results').hidden = !(validStudents && validFee);
    studentsInput.setAttribute('aria-invalid',String(!validStudents)); feeInput.setAttribute('aria-invalid',String(!validFee));
    if (validStudents && validFee) {
      const revenue = fee * students * quote.months, difference = revenue - quote.gross;
      $('results-period').textContent = `${quote.months} meses`;
      $('revenue-estimate').textContent = fmt(revenue);
      $('revenue-breakdown').textContent = `${fmt(fee*students)} al mes · ${students} estudiantes`;
      $('gross-difference').textContent = fmt(difference);
      $('difference-per-student').textContent = fmt(difference/students);
      $('difference-per-student-month').textContent = fmt(difference/students/quote.months);
      $('student-total-label').textContent = `Por estudiante · durante ${quote.months} meses`;
    }
    const assetRoot = '../assets/projects/';
    $('project-image').src = assetRoot + program.image;
    $('project-image').alt = program.alt;
    $('project-animation').srcset = assetRoot + 'animations/' + program.gif;
    $('project-status').textContent = program.status;
    $('project-title').textContent = program.project;
    $('project-description').textContent = program.description;
    $('project-tags').replaceChildren(...program.tags.map(tag => {const span=document.createElement('span');span.textContent=tag;return span;}));
    $('included-title').textContent = `Qué incluye ${model.title}`;
    $('included-intro').textContent = mode === 'BUY'
      ? 'INTEGRA cubre el equipamiento y su puesta en marcha; el acceso a Socrates Aprende no forma parte de esta modalidad.'
      : `${model.title} combina ${program.name.toLowerCase()}, aprendizaje digital en Socrates y acompañamiento durante ${quote.months} meses.`;
    $('included-features').replaceChildren(...includedItems(mode,program,quote.months).map(item => {
      const article=document.createElement('article'); article.className='included-feature';
      const heading=document.createElement('h3'); heading.textContent=item.title;
      const detail=document.createElement('p'); detail.textContent=item.detail;
      article.append(heading,detail); return article;
    }));
    const platformIncluded = mode !== 'BUY';
    $('socrates-inclusion').hidden = !platformIncluded;
    $('platform-excluded').hidden = platformIncluded;
    $('socrates-description').textContent = `Acceso durante ${quote.months} meses a semanas de aprendizaje, lecciones y actividades interactivas para acompañar el trabajo en clase.`;
    $('fineprint').textContent = isBuy
      ? `Precio de INTEGRA para ${quantity} ${quantity===1?'equipo':'equipos'}. Incluye 1 hora de capacitación para el uso del equipo; el tiempo adicional se cotiza por separado.`
      : `Estimación para ${quantity} ${quantity===1?'equipo':'equipos'} y ${studentsInput.value || 'el grupo seleccionado'} estudiantes. La inversión corresponde al modelo ${model.title}; la cuota del colegio se puede ajustar. La cotización final se confirma con GuateGeeks.`;
  }

  Object.entries(programs).forEach(([id,p]) => programFilter.add(new Option(p.name,id)));
  programFilter.value = 'Spike';
  levelFilter.addEventListener('change',() => {refreshPrograms();render();});
  [programFilter,modeFilter,qtyInput,feeInput,studentsInput].forEach(el => el.addEventListener('input',render));
  [programFilter,modeFilter].forEach(el => el.addEventListener('change',render));
  $('use-suggested-fee').addEventListener('change',render);
  $('rental-period').addEventListener('change',render);
  render();
})();
