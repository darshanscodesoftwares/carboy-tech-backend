const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

async function compressVideo(inputPath, outputPath) {
  console.log("🟡 [VIDEO-COMPRESS-START]", {
    input: inputPath,
  });

  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-vcodec libx264",
        "-crf 30",
        "-preset veryfast",
        "-movflags +faststart",
        "-threads 1",
      ])
      .size("960x?")
      .save(outputPath)
      .on("end", () => {
        console.log("🟢 [VIDEO-COMPRESS-SUCCESS]", { output: outputPath });
        resolve();
      })
      .on("error", (err) => {
        console.error("🔴 [VIDEO-COMPRESS-ERROR]", err.message);
        reject(err);
      });
  });
}

module.exports = { compressVideo };
