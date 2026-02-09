const sharp = require("sharp");
const fs = require("fs");

async function compressImage(inputPath, outputPath) {
  const inputStats = fs.statSync(inputPath);
  const inputSizeKB = (inputStats.size / 1024).toFixed(2);

  console.log("🟡 [IMG-COMPRESS-START]", {
    file: inputPath,
    sizeKB_before: inputSizeKB,
  });

  await sharp(inputPath)
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

  const outputStats = fs.statSync(outputPath);
  const outputSizeKB = (outputStats.size / 1024).toFixed(2);

  console.log("🟢 [IMG-COMPRESS-DONE]", {
    original: inputPath,
    compressed: outputPath,
    sizeKB_before: inputSizeKB,
    sizeKB_after: outputSizeKB,
    reduction_percent: `${(((inputStats.size - outputStats.size) / inputStats.size) * 100).toFixed(1)}%`,
  });
}

module.exports = { compressImage };
