import express from "express";
import multer from "multer";
import { exec } from "child_process";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/concat", upload.any(), async (req, res) => {
  try {
    const listFile = req.files.find(f => f.originalname === "list.txt");
    if (!listFile) return res.status(400).send("Missing list.txt");

    fs.renameSync(listFile.path, "list.txt");

    for (const file of req.files) {
      if (file.originalname.startsWith("segment_")) {
        fs.renameSync(file.path, file.originalname);
      }
    }

    const command = `ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4 -y`;

    exec(command, (error) => {
      if (error) {
        console.error(error);
        return res.status(500).send("FFmpeg error");
      }

      const video = fs.readFileSync("output.mp4");
      res.set("Content-Type", "video/mp4");
      res.send(video);

      fs.unlinkSync("output.mp4");
      fs.unlinkSync("list.txt");
      req.files.forEach(f => {
        if (fs.existsSync(f.originalname)) fs.unlinkSync(f.originalname);
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.listen(3000, () => console.log("FFmpeg server running on port 3000"));
