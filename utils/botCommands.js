const { Markup } = require("telegraf");
const User = require("../models/User");
const { getChatCompletion } = require("../services/openaiService");

const MAX_FREE_MESSAGES = 3;
const INACTIVITY_TIMEOUT = 45 * 24 * 60 * 60 * 1000; // 45 дней
const MAX_MESSAGE_LENGTH = 2000; // Макс. длина сообщения
const PREMIUM_HISTORY_LENGTH = 30; // Для платных пользователей
const FREE_HISTORY_LENGTH = 15; // Для бесплатных
const DAILY_MESSAGE_COUNT = 500; // Лимит сообщений в день

// Функция для оценки токенов в истории
function estimateHistoryTokens(history) {
  return history.reduce((tokens, message) => {
    // 1 токен ≈ 2 символа на русском + 3 токена на роль
    return tokens + Math.ceil(message.content.length / 2) + 3;
  }, 0);
}

async function setupBot(bot) {
  bot.telegram.setMyCommands([
    { command: "start", description: "Старт" },
    { command: "buy", description: "Купить подписку" },
    { command: "restart", description: "Перезапуск" },
    { command: "reset", description: "Забыть переписку" },
    { command: "profile", description: "Профиль" },
  ]);

  bot.start(async (ctx) => {
    const telegramId = ctx.from.id.toString();
    let user = await User.findOne({ telegramId });
    if (!user) user = await User.create({ telegramId });

    // Инициализируем историю при старте
    if (!user.chatHistory) {
      user.chatHistory = [];
      await user.save();
    }

    ctx.reply(
      "👋 Привет! Я Mentorio — бот психологической поддержки.\n\nЗдесь можно поговорить о чувствах, задать вопрос или просто выговориться. Всё анонимно, бережно и безопасно.\n\nПиши, если хочешь поделиться — я рядом."
    );
  });

  bot.command("restart", (ctx) => {
    ctx.reply(
      "🔄 Перезапуск чата выполнен. Пиши, если хочешь поделиться — я рядом."
    );
  });

  bot.command("reset", (ctx) => {
    ctx.reply(
      "⚠️ Ты действительно хотите забыть переписку? Это удалит память Менторио об этой беседе.",
      Markup.inlineKeyboard([
        [Markup.button.callback("🧹 Забыть переписку", "confirm_reset")],
        [Markup.button.callback("❌ Отмена", "cancel_reset")],
      ])
    );
  });

  bot.command("profile", async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const user = await User.findOne({ telegramId });
    const isPro = user?.isPremium;
    const remaining = Math.max(
      0,
      MAX_FREE_MESSAGES - (user?.messagesCount || 0)
    );
    const sub = isPro ? "Про" : "Бесплатная";
    const limitText = isPro
      ? "∞ Без ограничений"
      : `${remaining} сообщений из ${MAX_FREE_MESSAGES} до следующей недели`;

    ctx.reply(
      `🧾 Ваш профиль:\nID: ${telegramId}\nПодписка: ${sub}\nЛимиты: ${limitText}`
    );
  });

  bot.command("buy", (ctx) => {
    ctx.reply(
      '💖 Подписка "Про" — это безлимитная психологическая поддержка от Менторио за 1000 ₽ в месяц. Никаких ограничений, только забота.\n\nПерейдите по ссылке, чтобы оформить подписку:\n\n👉 https://mentorio.pro.ru/pay'
    );
  });

  bot.action("confirm_reset", async (ctx) => {
    const telegramId = ctx.from.id.toString();
    await User.findOneAndUpdate(
      { telegramId },
      {
        messagesCount: 0,
        firstMessageAt: null,
        chatHistory: [], // Очищаем историю диалога
      }
    );
    await ctx.editMessageText("🧠 Память очищена. Можем начать сначала.");
  });

  bot.action("cancel_reset", async (ctx) => {
    await ctx.editMessageText("🚫 Отмена. Мы продолжаем общение как прежде.");
  });

  bot.on("text", async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const text = ctx.message.text;
    const now = new Date();

    let user = await User.findOne({ telegramId });
    if (!user) {
      user = await User.create({
        telegramId,
        chatHistory: [],
      });
    }

    // Проверка длины сообщения
    if (text.length > MAX_MESSAGE_LENGTH) {
      return ctx.reply(
        `Сообщение слишком длинное. Пожалуйста, ограничьте ${MAX_MESSAGE_LENGTH} символов.`
      );
    }

    // Проверка активности и сброс истории
    if (user.lastMessageAt && now - user.lastMessageAt > INACTIVITY_TIMEOUT) {
      user.chatHistory = [];
    }
    user.lastMessageAt = now;

    // Проверка лимитов для бесплатных пользователей
    if (!user.isPremium) {
      if (!user.firstMessageAt) {
        user.firstMessageAt = now;
        user.messagesCount = 0;
      } else {
        const diff = now - user.firstMessageAt;
        if (diff >= 7 * 24 * 60 * 60 * 1000) {
          user.messagesCount = 0;
          user.firstMessageAt = now;
        }
      }

      user.messagesCount++;

      if (user.messagesCount > MAX_FREE_MESSAGES) {
        await user.save();
        return ctx.reply(
          "🚫 Лимит бесплатных сообщений исчерпан. Оплатите доступ: https://mentorio.pro/pay/" +
            telegramId
        );
      }
    }

    // После проверки бесплатных лимитов
    if (user.isPremium) {
      const today = new Date().toISOString().split("T")[0];

      if (user.lastActiveDate !== today) {
        user.dailyCount = 0;
        user.lastActiveDate = today;
      }

      user.dailyCount = (user.dailyCount || 0) + 1;

      if (user.dailyCount > DAILY_MESSAGE_COUNT) {
        await user.save();
        return ctx.reply(
          "🚫 Дневной лимит сообщений исчерпан. Продолжим завтра!"
        );
      }
    }

    // Добавляем сообщение пользователя в историю
    user.chatHistory.push({ role: "user", content: text });

    try {
      // Защита от переполнения токенов
      const MAX_TOKENS = user.isPremium ? 8000 : 4000;
      let optimizedHistory = user.chatHistory;

      if (estimateHistoryTokens(optimizedHistory) > MAX_TOKENS) {
        // Берем последние 8 сообщений (системный промпт добавится позже)
        optimizedHistory = optimizedHistory.slice(-8);
      }

      // Получаем ответ
      const reply = await getChatCompletion(optimizedHistory);

      // Добавляем ответ в историю
      user.chatHistory.push({ role: "assistant", content: reply });

      // Определяем лимит истории в зависимости от подписки
      const historyLimit = user.isPremium
        ? PREMIUM_HISTORY_LENGTH
        : FREE_HISTORY_LENGTH;

      // Ограничиваем длину истории
      if (user.chatHistory.length > historyLimit) {
        user.chatHistory = user.chatHistory.slice(-historyLimit);
      }

      await user.save();
      ctx.reply(reply);
    } catch (err) {
      console.error("GPT error:", err);

      // Удаляем последнее сообщение пользователя при ошибке
      if (
        user.chatHistory.length > 0 &&
        user.chatHistory[user.chatHistory.length - 1].role === "user"
      ) {
        user.chatHistory.pop();
      }

      await user.save();

      // Специальная обработка ошибки баланса
      if (err.response?.status === 402 || err.status === 402) {
        ctx.reply("⚠️ Проблема с сервисом. Администратор уже уведомлен.");
        const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID;
        if (ADMIN_ID) {
          bot.telegram.sendMessage(
            ADMIN_ID,
            `❗️ Low DeepSeek balance! ${telegramId} request failed.`
          );
        }
      } else {
        ctx.reply("❌ Ошибка при обработке запроса. Попробуйте позже.");
      }
    }
  });
}

module.exports = { setupBot };
