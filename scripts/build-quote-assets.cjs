const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const files = {
  logo: 'guategeeks-logo.png',
  geekEyes: 'geek-eyes.png',
  spikeProduct: 'spike-prime-kit-reference.png',
  robotMasterProduct: 'robot-master-kit-reference.png',
  snapProduct: 'snap-device-illustrative.jpg',
  talebotProduct: 'talebot-kit-reference.png',
  vrProduct: 'vr-device-illustrative.jpg',
  droneProduct: 'drone-device-illustrative.jpg',
  spikeClass: 'spike-class.jpg',
  spikeProgramming: 'spike-programming.jpg',
  robotMasterClass: 'robot-master-class-generated.png',
  robotMasterDesign: 'robot-master-design.jpg',
  snapClass: 'snap-class.jpg',
  snapDesign: 'snap-design.jpg',
  talebotClass: 'talebot-class.jpg',
  talebotDesign: 'talebot-design.jpg',
  vrClass: 'vr-class.jpg',
  vrDesign: 'vr-design.jpg',
  dronesClass: 'drones-class.jpg',
  dronesDesign: 'drones-design.jpg',
  ideaClass: 'idea-class.jpg',
  designClass: 'design-class.jpg'
};

const entries = Object.entries(files).map(([key, file]) => {
  const mime = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const bytes = fs.readFileSync(path.join(root, 'assets', 'quote-media', file));
  return `  ${JSON.stringify(key)}: ${JSON.stringify(`data:${mime};base64,${bytes.toString('base64')}`)}`;
});

fs.writeFileSync(path.join(root, 'quote-assets.js'),
  `/* Recursos incrustados para que la cotización funcione también desde file://. */\nwindow.QUOTE_MEDIA = Object.freeze({\n${entries.join(',\n')}\n});\n`);
