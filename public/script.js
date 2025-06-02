
  let autocompletePhrases = JSON.parse(localStorage.getItem("autocompletePhrases") || "[]");

function updateAutocomplete() {
  const input = document.getElementById("inputText");
  const list = document.getElementById("autocompleteList");
  const val = input.value.trim().toLowerCase();
  list.innerHTML = "";

  if (!val) return;

  const data = JSON.parse(localStorage.getItem("autocompletePhrases") || "[]");

  data
    .filter(p => p.text.toLowerCase().startsWith(val)) // Фільтрує фрази за введенням
    .sort((a, b) => (b.freq || 1) - (a.freq || 1)) // Сортує за частотою
    .forEach(p => {
      const div = document.createElement("div");
      div.textContent = p.text;
      div.onclick = () => {
        input.value = p.text;
        list.innerHTML = "";
      };
      list.appendChild(div);
    });
}


function saveInputToHistory(text) {
  let data = JSON.parse(localStorage.getItem("autocompletePhrases") || "[]");

  const existing = data.find(entry => entry.text === text);
  if (existing) {
    existing.freq = (existing.freq || 1) + 1; // Збільшує частоту, якщо запис уже існує
  } else {
    data.push({ text, freq: 1 });  // Додає нову фразу
  }

  localStorage.setItem("autocompletePhrases", JSON.stringify(data));
}



    async function translateText() {
  const text = document.getElementById("inputText").value.trim();
  const fromLang = document.getElementById("fromLang").value;
  const toLang = document.getElementById("toLang").value;
  if (!text) {
    alert("Please enter text to translate.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, fromLang, toLang })
    });

    const data = await response.json();
    const outputEl = document.getElementById("outputText");

// Вставляє перекладений текст у поле з підсвічуванням слів
    outputEl.innerHTML = wrapWordsWithSpans(data.translatedText || "Translation error.");

    
    saveInputToHistory(text);

  } catch (error) {
    console.error("Request error:", error);
    document.getElementById("outputText").value = "Server error.";
  }
}


    function startVoiceInput() {
      if (!('webkitSpeechRecognition' in window)) {
        alert("Speech recognition not supported in this browser.");
        return;
      }

      const recognition = new webkitSpeechRecognition();
      recognition.lang = document.getElementById("fromLang").value;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById("inputText").value = transcript;
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        alert("Speech recognition failed: " + event.error);
      };

      recognition.start();
    }
// Після завантаження голосів  ініціалізує їх
      window.speechSynthesis.onvoiceschanged = () => {
    speechSynthesis.getVoices();
  };

  function speakOutput() {
  const text = document.getElementById("outputText").innerText; 
  const lang = document.getElementById("toLang").value;
  if (!text) return;

  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;

  const voices = speechSynthesis.getVoices();
  const selectedVoice = voices.find(voice => voice.lang.startsWith(lang));
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  } else {
    console.warn("Не знайдено голос для мови: " + lang);
  }

  speechSynthesis.speak(utterance);
}



    async function showHistory() {
      try {
        const response = await fetch("http://localhost:3000/history");
        const history = await response.json();

        const container = document.getElementById("historyContainer");
        container.innerHTML = "<h3>History</h3>";

        if (history.length === 0) {
          container.innerHTML += "<p>Empty.</p>";
          return;
        }

        history.forEach(entry => {
          container.innerHTML += `
            <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px; background:#fff;">
              <strong>from ${entry.fromLang} to ${entry.toLang}</strong> <br/>
              <em>Original:</em> ${entry.originalText} <br/>
              <em>Translate:</em> ${entry.translatedText} <br/>
              <small>${new Date(entry.timestamp).toLocaleString()}</small>
            </div>
          `;
        });
      } catch (error) {
        console.error("Помилка отримання історії:", error);
        alert("Не вдалося завантажити історію.");
      }
    }
// Розпізнає текст з зображення за допомогою Tesseract
    async function recognizeAndTranslate(file) {
  try {
    const worker = await Tesseract.createWorker({ logger: m => console.log(m) });
    await worker.loadLanguage('ukr+eng');
    await worker.initialize('ukr+eng');

    const result = await worker.recognize(file);
    const recognizedText = result.data.text.trim();

    await worker.terminate();

    if (!recognizedText) {
      alert("Не вдалося розпізнати текст.");
      return;
    }

    document.getElementById("inputText").value = recognizedText;
    translateText();
  } catch (error) {
    console.error("Помилка розпізнавання:", error);
    alert("Помилка під час розпізнавання тексту з зображення.");
  }
}


// Автоматично встановлює мову браузера як цільову мову
window.addEventListener("DOMContentLoaded", () => {
  const toLang = document.getElementById("toLang");
  const browserLang = navigator.language?.split("-")[0];
  const supported = Array.from(toLang.options).map(opt => opt.value);
  if (supported.includes(browserLang)) toLang.value = browserLang;
});

      // перенести зображення + click на одну зону
const dropZone = document.getElementById("dropZone");
const imageInput = document.getElementById("imageInput");

dropZone.addEventListener("click", () => imageInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.style.background = "#e6f7ff";
});

dropZone.addEventListener("dragleave", () => {
  dropZone.style.background = "#f9f9f9";
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.style.background = "#f9f9f9";

  const file = e.dataTransfer.files[0];
  if (file) {
    recognizeAndTranslate(file);
  }
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    recognizeAndTranslate(file);
  }
});


    let stream;

async function openCamera() {
  const cameraSection = document.getElementById("cameraSection");
  const video = document.getElementById("video");

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    cameraSection.style.display = "block";
  } catch (err) {
    console.error("Не вдалося отримати доступ до камери", err);
    alert("Помилка: не вдалося відкрити камеру");
  }
}

async function capturePhoto() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  
  stream.getTracks().forEach(track => track.stop());

  // Отримати зображення з canvas
  canvas.toBlob(async (blob) => {
    if (blob) {
      await recognizeAndTranslate(blob);
    }
  }, "image/png");

  // Сховати камеру
  document.getElementById("cameraSection").style.display = "none";
}


// Обгортання слів у span-елементи для інтерактивності
function wrapWordsWithSpans(text) {
  return text
    .split(/\s+/)
    .map(word => `<span class="word" data-word="${word}">${word}</span>`)
    .join(" ");
}

async function getSynonyms(word) {
  try {
    const response = await fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}`);
    const data = await response.json();
    console.log("Synonyms for:", word, data);
    return data.map(entry => entry.word).slice(0, 5);
  } catch (err) {
    console.error("Помилка завантаження синонімів:", err);
    return [];
  }
}
// Закриває вікно синонімів
function clearSynonymPopup() {
  const popup = document.getElementById("synonymPopup");
  if (popup) popup.remove();
}

document.addEventListener("mouseover", async (event) => {
  if (!event.target.classList.contains("word")) return;

  const word = event.target.dataset.word;
  if (!word) return;

  clearSynonymPopup();

  const synonyms = await getSynonyms(word);

  const popup = document.createElement("div");
  popup.id = "synonymPopup";
  popup.style.position = "absolute";
  popup.style.background = "#fff";
  popup.style.border = "1px solid #ccc";
  popup.style.padding = "5px 10px";
  popup.style.zIndex = "1000";
  popup.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
  popup.style.maxWidth = "300px";
  popup.style.fontSize = "14px";
  popup.style.borderRadius = "6px";

  if (!synonyms.length) {
    popup.textContent = `No synonyms found for "${word}".`;
  } else {
    popup.textContent = `Synonyms for "${word}": ${synonyms.join(", ")}`;
  }

  const rect = event.target.getBoundingClientRect();
  popup.style.top = `${rect.bottom + window.scrollY}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;

  document.body.appendChild(popup);
});
// Прибрати вікно синонімів при виході мишки
document.addEventListener("mouseout", (event) => {
  if (event.target.classList.contains("word")) {
    clearSynonymPopup();
  }
});

 function clearDefinitionPopup() {
  const popup = document.getElementById("definitionPopup");
  if (popup) popup.remove();
}

document.addEventListener("click", async (event) => {
  const popup = document.getElementById("definitionPopup");

  // Клік не по слову і не по вікну то закрити
  if (!event.target.classList.contains("word") && (!popup || !popup.contains(event.target))) {
    if (popup) popup.remove();
    return;
  }

  // Якщо це слово то показує пояснення
  if (event.target.classList.contains("word")) {
    const word = event.target.dataset.word;
    if (!word) return;

    if (popup) popup.remove();

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await response.json();

      if (!Array.isArray(data)) {
        showDefinitionPopup(event.target, `❌ Не знайдено пояснення для <b>${word}</b>.`);
        return;
      }

      const meaniіngs = data[0].meanings.map(m => {
        const def = m.definitions[0];
        return `<b>${m.partOfSpeech}</b>: ${def.definition}${def.example ? `<br><i>Приклад:</i> ${def.example}` : ""}`;
      }).join("<br><br>");

      showDefinitionPopup(event.target, meanings);
    } catch (err) {
      console.error("Помилка пояснення:", err);
      showDefinitionPopup(event.target, "⚠️ Помилка при завантаженні пояснення.");
    }
  }
});

// Показує спливаюче вікно з поясненням слова
function showDefinitionPopup(target, content) {
  const popup = document.createElement("div");
  popup.id = "definitionPopup";
  popup.style.position = "absolute";
  popup.style.background = "#fff";
  popup.style.border = "1px solid #ccc";
  popup.style.padding = "10px";
  popup.style.zIndex = "1000";
  popup.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  popup.style.maxWidth = "300px";
  popup.style.fontSize = "14px";
  popup.style.borderRadius = "8px";
  popup.style.lineHeight = "1.4";
  popup.innerHTML = content;

  const rect = target.getBoundingClientRect();
  popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;

  document.body.appendChild(popup);
}





