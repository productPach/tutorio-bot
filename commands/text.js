const User = require("../models/User");
const { getChatCompletion } = require("../services/openaiService");
const splitTextWithFormulas = require("../utils/splitTextWithFormulas");
const renderFormula = require("../utils/renderFormula");

const MAX_MESSAGE_LENGTH = 2000;
const MAX_FREE_MESSAGES_PER_DAY = 3;
const DAILY_MESSAGE_LIMIT_PREMIUM = 500;
const INACTIVITY_TIMEOUT = 45 * 24 * 60 * 60 * 1000; // 45 дней
const MAX_HISTORY_FREE = 15;
const MAX_HISTORY_PREMIUM = 30;

// Оценка токенов в истории (примерно)
function estimateHistoryTokens(history) {
  return history.reduce((tokens, msg) => {
    return tokens + Math.ceil(msg.content.length / 2) + 3;
  }, 0);
}

module.exports = async function text(ctx) {
  const telegramId = ctx.from.id.toString();
  const text = ctx.message.text;
  const now = new Date();

  if (text.length > MAX_MESSAGE_LENGTH) {
    return ctx.reply(
      `Сообщение слишком длинное. Максимум ${MAX_MESSAGE_LENGTH} символов.`
    );
  }

  let user = await User.findOne({ telegramId });
  if (!user) {
    return ctx.reply("Пожалуйста, начните с команды /start");
  }

  // Проверка выбора предмета и режима
  if (!user.selectedSubject) {
    return ctx.reply("Пожалуйста, сначала выберите предмет командой /subject");
  }
  if (!user.selectedMode) {
    return ctx.reply("Пожалуйста, сначала выберите режим командой /mode");
  }

  // Сброс истории по неактивности
  if (user.lastMessageAt && now - user.lastMessageAt > INACTIVITY_TIMEOUT) {
    user.chatHistory = [];
  }
  user.lastMessageAt = now;

  // Лимиты бесплатных пользователей
  if (!user.isPremium) {
    const today = now.toISOString().slice(0, 10);
    if (user.lastMessageDate !== today) {
      user.dailyMessageCount = 0;
      user.lastMessageDate = today;
    }

    if ((user.dailyMessageCount || 0) >= MAX_FREE_MESSAGES_PER_DAY) {
      await user.save();
      return ctx.reply(
        `🚫 Лимит бесплатных сообщений (${MAX_FREE_MESSAGES_PER_DAY} в сутки) исчерпан. Купите подписку /buy для безлимитного доступа.`
      );
    }

    user.dailyMessageCount = (user.dailyMessageCount || 0) + 1;
    user.lastMessageDate = today;
  } else {
    // Для премиум — дневной лимит сообщений
    const today = now.toISOString().slice(0, 10);
    if (user.lastActiveDate !== today) {
      user.dailyCount = 0;
      user.lastActiveDate = today;
    }
    user.dailyCount = (user.dailyCount || 0) + 1;
    if (user.dailyCount > DAILY_MESSAGE_LIMIT_PREMIUM) {
      await user.save();
      return ctx.reply(
        "🚫 Дневной лимит сообщений исчерпан. Продолжим завтра!"
      );
    }
  }

  // Инициализируем историю если пустая
  user.chatHistory = user.chatHistory || [];
  user.chatHistory.push({ role: "user", content: text });

  // Защита от переполнения токенов
  const MAX_TOKENS = user.isPremium ? 8000 : 4000;
  let optimizedHistory = user.chatHistory;
  if (estimateHistoryTokens(optimizedHistory) > MAX_TOKENS) {
    optimizedHistory = optimizedHistory.slice(-8);
  }

  try {
    // Получаем ответ OpenAI
    const reply = await getChatCompletion(
      optimizedHistory,
      user.selectedSubject,
      user.selectedMode
    );

    user.chatHistory.push({ role: "assistant", content: reply });

    // Ограничиваем длину истории
    const historyLimit = user.isPremium
      ? MAX_HISTORY_PREMIUM
      : MAX_HISTORY_FREE;
    if (user.chatHistory.length > historyLimit) {
      user.chatHistory = user.chatHistory.slice(-historyLimit);
    }

    await user.save();

    const parts = splitTextWithFormulas(reply);
    for (const part of parts) {
      if (part.type === "text" && part.content.trim()) {
        await ctx.reply(part.content);
      } else if (part.type === "formula") {
        try {
          const image = await renderFormula(part.content); // await, если функция асинхронная
          await ctx.replyWithPhoto({ source: image });
        } catch (e) {
          console.error("Ошибка при рендере формулы:", e);
          await ctx.reply(`❌ Не удалось отобразить формулу.`);
        }
      }
    }
  } catch (err) {
    console.error("Ошибка в обработчике текста:", err);

    // Удаляем последнее сообщение пользователя при ошибке
    if (
      user.chatHistory.length > 0 &&
      user.chatHistory[user.chatHistory.length - 1].role === "user"
    ) {
      user.chatHistory.pop();
    }

    await user.save();

    if (err.response?.status === 402 || err.status === 402) {
      ctx.reply("⚠️ Проблема с сервисом. Администратор уже уведомлен.");
      const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID;
      if (ADMIN_ID) {
        ctx.telegram.sendMessage(
          ADMIN_ID,
          `❗️ Низкий баланс сервиса! Запрос пользователя ${telegramId} не выполнен.`
        );
      }
    } else {
      ctx.reply("❌ Ошибка при обработке сообщения. Попробуйте позже.");
    }
  }
};
