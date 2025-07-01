const { Markup } = require("telegraf");
const User = require("../models/User");

module.exports = async function handleTermsConfirmation(ctx) {
  const telegramId = ctx.from.id.toString();

  await User.findOneAndUpdate({ telegramId }, { agreedToTerms: true });

  await ctx.editMessageText("✅ Спасибо за подтверждение!");

  return ctx.reply(
    "🎓 Отлично, начнем!\nВыберите предмет, с которым нужна помощь:",
    Markup.inlineKeyboard([
      [Markup.button.callback("📘 Выбрать предмет", "select_subject")],
    ])
  );
};
