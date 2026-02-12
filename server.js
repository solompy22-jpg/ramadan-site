import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";
import FormData from "form-data";

dotenv.config();

const app = express();
app.use(cors());

// يخلي الموقع يفتح index.html من نفس الفولدر
app.use(express.static("."));

const upload = multer({ dest: "uploads/" });

app.post("/api/ramadan", upload.single("image"), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY مش موجود في .env" });
    }
    if (!req.file) return res.status(400).json({ error: "ارفع صورة الأول" });

    const prompt =
      "حوّل الصورة لأجواء رمضانية واقعية بدون تغيير ملامح الشخص: إضاءة دافئة ذهبية، فوانيس رمضان مضيئة، زينة رمضان، هلال ونجوم خفيفة، بوكيه إضاءة، جودة عالية، شكل سينمائي.";

    const form = new FormData();
    form.append("model", "gpt-image-1.5");
    form.append("prompt", prompt);
    form.append("size", "1024x1536");
    form.append("image", fs.createReadStream(req.file.path));

    const resp = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    const data = await resp.json();

    // امسح الصورة المؤقتة
    fs.unlink(req.file.path, () => {});

    if (!resp.ok) {
      return res.status(500).json({ error: data?.error || data });
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: "مفيش صورة رجعت من الـ API" });

    res.json({ imageBase64: b64 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3000, () => {
  console.log("Open: http://localhost:3000");
});
