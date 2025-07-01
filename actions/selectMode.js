const User = require("../models/User");

module.exports = async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const data = ctx.callbackQuery.data; // mode_fast или mode_tutor
  const selectedMode = data.replace("mode_", "");

  const user = await User.findOne({ telegramId });

  if (!user || !user.selectedSubject) {
    return ctx.answerCbQuery(
      "Пожалуйста, сначала выберите предмет командой /subject"
    );
  }

  // Если режим не меняется — подтверждаем и выходим
  if (user.selectedMode === selectedMode) {
    return ctx.answerCbQuery(
      `Вы уже используете режим: ${
        selectedMode === "fast" ? "Быстрый ответ" : "Режим репетитора"
      }`
    );
  }

  // Предлагаем подтвердить смену режима с очисткой истории
  await ctx.editMessageText(
    `⚠️ Вы собираетесь сменить режим работы на *${
      selectedMode === "fast" ? "Быстрый ответ" : "Режим репетитора"
    }*.\n\nЭто приведёт к очистке истории чата. Вы уверены?`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ Да, сбросить и сменить режим",
              callback_data: `confirm_mode_change_${selectedMode}`,
            },
          ],
          [{ text: "❌ Отмена", callback_data: "cancel_mode_change" }],
        ],
      },
    }
  );
};
