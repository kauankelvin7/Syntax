const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'frontend', 'public', 'android-chrome-512x512.png');
const outputPath = path.join(__dirname, '..', 'frontend', 'public', 'android-chrome-384x384.png');

sharp(inputPath)
  .resize(384, 384)
  .toFile(outputPath)
  .then(() => {
    console.log('Ícone 384x384 gerado com sucesso!');
  })
  .catch(err => {
    console.error('Erro ao gerar ícone:', err);
  });
