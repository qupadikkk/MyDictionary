const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const port = 3000;
app.use(express.json());
app.use(cors());

app.use(express.static("public"));

// MongoDB підключення
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("Підключено до MongoDB"))
  .catch(err => console.error("Помилка MongoDB:", err));

// Модель для історії перекладів
const Translation = mongoose.model("Translation", new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  fromLang: String,
  toLang: String,
  originalText: String,
  translatedText: String
}));

// Переклад тексту з поясненням
app.post("/translate", async (req, res) => {
  const { text, fromLang, toLang } = req.body;
  
  if (!text || !fromLang || !toLang) {
    return res.status(400).json({ error: "Всі поля є обов'язковими!" });
  }

  try {

    const translationPrompt = `Переклади наступний текст з ${fromLang} на ${toLang}: ${text}`;

    const translationResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: translationPrompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const translatedText = translationResponse.data.choices[0].message.content.trim();
    
    // Зберегти в БД
    const historyEntry = new Translation({
      fromLang,
      toLang,
      originalText: text,
      translatedText
    });

    await historyEntry.save();

    res.json( {translatedText} );

  } catch (error) {
    console.error("Помилка API:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Помилка сервера" });
  }
});


// Отримання останніх 50 записів
app.get("/history", async (req, res) => {
  try {
    const history = await Translation.find()
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(history);
  } catch (err) {
    console.error("Помилка при отриманні історії:", err);
    res.status(500).json({ error: "Помилка сервера" });
  }
});

app.listen(port, () => {
  console.log(`Сервер працює на http://localhost:${port}`);
});