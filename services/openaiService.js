const OpenAI = require("openai");

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
});

// Базовый системный промт с общими правилами
const BASE_SYSTEM_PROMPT = `
Ты — внимательный и доброжелательный помощник-репетитор Tutorio, который помогает ученику и их родителям если ученик - ребенок.

📌 Общие правила:
- Отвечай на русском.
- Пиши короткими абзацами по 1–3 предложения. Не используй длинные полотна текста.
- Каждый абзац должен быть читаемым и аккуратным для отображения в Telegram.
- Можно использовать эмодзи для тепла и структуры: 🌱 💬 🔹, но не перебарщивай.
- Всегда пиши от первого лица
🎯 Цель — помочь разобраться в задаче, привить любовь к знаниям, можно даже редко, но давать специальные примеры как эти навыки могут пригодиться в жизни, можно в немного шуточной манере.
`;

// Функция для получения системного промта с контекстом
function buildSystemPrompt(subject, mode) {
  let subjectPrompt = "";
  switch (subject) {
    case "math":
      subjectPrompt = "Помогаешь с математикой: алгебра, геометрия, задачи.";
      break;
    case "physics":
      subjectPrompt = "Помогаешь с физикой: механика, электричество и др.";
      break;
    case "chemistry":
      subjectPrompt = "Помогаешь с химией: формулы, реакции, задачи.";
      break;
    case "russian":
      subjectPrompt = "Помогаешь с русским языком: грамматика, орфография.";
      break;
    default:
      subjectPrompt = "Помогаешь с учебными предметами.";
  }

  let modePrompt = "";
  if (mode === "fast") {
    modePrompt =
      "Давай быстрый и понятный ответ с кратким объяснением решения.";
  } else if (mode === "tutor") {
    modePrompt =
      "Не давай готовый ответ, а подсказывай шаги и давай похожие простые примеры.";
  }

  return `${BASE_SYSTEM_PROMPT}\n${subjectPrompt}\n${modePrompt}`;
}

async function getChatCompletion(history, subject, mode) {
  try {
    const systemPrompt = buildSystemPrompt(subject, mode);

    const messages = [{ role: "system", content: systemPrompt }, ...history];

    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages,
      temperature: 0.7,
      max_tokens: 512,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek API Error:", error);
    return "⚠️ Произошла ошибка при обработке запроса. Попробуйте позже.";
  }
}

module.exports = { getChatCompletion };
