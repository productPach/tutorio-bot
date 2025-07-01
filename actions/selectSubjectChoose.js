const User = require("../models/User");
const { Markup } = require("telegraf");
const subjectLabels = require("../utils/subjectLabels");

module.exports = async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const data = ctx.callbackQuery.data; // например "select_subject_math"
  const selectedSubject = data.replace("select_subject_", "");

  // Обновляем предмет, сбрасываем историю и режим
  await User.findOneAndUpdate(
    { telegramId },
    {
      selectedSubject,
      selectedMode: null,
      chatHistory: [],
      messagesCount: 0,
      firstMessageAt: null,
      lastMessageAt: null,
    }
  );

  const subjectLabel = subjectLabels[selectedSubject] || selectedSubject;

  await ctx.editMessageText(`✅ Выбран предмет: *${subjectLabel}*`, {
    parse_mode: "Markdown",
  });

  await ctx.reply(
    "Теперь выберите режим работы:",
    Markup.inlineKeyboard([
      [Markup.button.callback("⚡️ Быстрое решение", "mode_fast")],
      [Markup.button.callback("🎓 Режим репетитора", "mode_tutor")],
    ])
  );
};
