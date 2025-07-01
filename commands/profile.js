const User = require("../models/User");
const MAX_FREE_MESSAGES = 3;

module.exports = async function profile(ctx) {
  const telegramId = ctx.from.id.toString();
  const user = await User.findOne({ telegramId });

  const isPro = user?.isPremium;
  const sub = isPro ? "Про" : "Бесплатная";
  const remaining = Math.max(0, MAX_FREE_MESSAGES - (user?.messagesCount || 0));
  const limits = isPro
    ? "∞ Без ограничений"
    : `${remaining} из ${MAX_FREE_MESSAGES} сегодня`;

  ctx.reply(
    `🧾 Профиль:\nID: ${telegramId}\nПодписка: ${sub}\nОсталось сообщений: ${limits}`
  );
};
