const { Markup } = require("telegraf");

module.exports = function mode(ctx) {
  ctx.reply(
    "Выберите режим работы:",
    Markup.inlineKeyboard([
      [Markup.button.callback("⚡ Быстрый ответ", "mode_fast")],
      [Markup.button.callback("🎓 Режим репетитора", "mode_tutor")],
    ])
  );
};
