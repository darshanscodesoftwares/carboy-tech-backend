const sharp = require("sharp");
const fs = require("fs");

async function compressImage(inputPath, outputPath) {
  return sharp(inputPath)
    .rotate()
    .resize({
      width: 1600,
      withoutEnlargement: true,
      fit: "inside",
    })
    .jpeg({
      quality: 75,
      mozjpeg: true,
    })
    .toFile(outputPath);
}

module.exports = { compressImage };
