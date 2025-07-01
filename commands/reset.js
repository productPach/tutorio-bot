const { Markup } = require("telegraf");
const User = require("../models/User");

exports.command = (ctx) => {
  ctx.reply(
    "⚠️ Удалить историю и начать сначала?",
    Markup.inlineKeyboard([
      [Markup.button.callback("🧹 Забыть переписку", "confirm_reset")],
      [Markup.button.callback("❌ Отмена", "cancel_reset")],
    ])
  );
};

exports.confirm = async (ctx) => {
  const telegramId = ctx.from.id.toString();
  await User.findOneAndUpdate(
    { telegramId },
    { chatHistory: [], messagesCount: 0, firstMessageAt: null }
  );
  ctx.editMessageText("🧠 Готово! Можем начать сначала.");
};

exports.cancel = (ctx) => {
  ctx.editMessageText("❌ Отменено. Продолжаем как раньше.");
};
