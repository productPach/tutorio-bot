const User = require("../models/User");

const modeMessages = {
  fast: {
    math: "⚡ Отлично! Давай быстро решим твою задачу по математике.",
    physics: "⚡ Окей! Быстро разберём твою задачу по физике.",
    chemistry: "⚡ Готов помочь быстро решить задачу по химии.",
    russian: "⚡ Давай быстро найдём ответ на твой вопрос по русскому.",
    default: "⚡ Отлично! Давай быстро решим твою задачу.",
  },
  tutor: {
    math: "🎓 Прекрасно! Давай разбираться в математике глубже, с объяснениями и примерами.",
    physics:
      "🎓 Хорошо! Погрузимся в физику, я помогу разобраться с каждым шагом.",
    chemistry: "🎓 Здорово! Поговорим о химии и решим задачи вместе.",
    russian:
      "🎓 Отлично! Помогу лучше понять русский язык и разбирать задания.",
    default: "🎓 Прекрасно! Давай учиться и разбираться вместе.",
  },
};

module.exports = async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const data = ctx.callbackQuery.data; // confirm_mode_change_fast или confirm_mode_change_tutor
  const selectedMode = data.replace("confirm_mode_change_", "");

  const user = await User.findOne({ telegramId });

  if (!user) {
    return ctx.answerCbQuery("Пользователь не найден. Попробуйте заново.");
  }

  // Меняем режим, сбрасываем историю и обновляем данные
  user.selectedMode = selectedMode;
  user.chatHistory = [];
  user.messagesCount = 0;
  user.firstMessageAt = null;
  user.lastMessageAt = null;

  await user.save();

  const subj = user.selectedSubject || "default";
  const message =
    modeMessages[selectedMode][subj] || modeMessages[selectedMode].default;

  await ctx.editMessageText(
    `✅ Режим сменён на *${
      selectedMode === "fast" ? "Быстрый ответ" : "Режим репетитора"
    }*.`,
    { parse_mode: "Markdown" }
  );

  await ctx.reply(message);
};
