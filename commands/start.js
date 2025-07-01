const { Markup } = require("telegraf");
const User = require("../models/User");

module.exports = async function start(ctx) {
  const telegramId = ctx.from.id.toString();

  let user = await User.findOne({ telegramId });
  if (!user) {
    user = await User.create({ telegramId });
    console.log(`👤 Новый пользователь: ${telegramId}`);
  }

  // Если пользователь уже согласен, продолжаем
  if (user.agreedToTerms) {
    return ctx.reply(
      "✅ Вы уже подтвердили согласие. Используйте команду /subject, чтобы начать."
    );
  }

  // Отправляем запрос на согласие
  return ctx.replyWithHTML(
    "🛡️ <b>Перед началом работы нужно подтвердить:</b>\n" +
      "▪️ Согласие на обработку персональных данных\n" +
      "▪️ Пользовательское соглашение\n" +
      "▪️ Возраст 18+\n\n" +
      "📄 <a href='https://bot.tutorio.ru/legal/privacy'>Согласие на ПДн</a>\n" +
      "📜 <a href='https://bot.tutorio.ru/legal/terms'>Пользовательское соглашение</a>",
    Markup.inlineKeyboard([
      [Markup.button.callback("✅ Мне 18+ и я согласен(а)", "confirm_terms")],
    ])
  );
};
