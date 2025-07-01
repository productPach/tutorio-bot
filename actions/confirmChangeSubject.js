const User = require("../models/User");
const { Markup } = require("telegraf");

module.exports = async (ctx) => {
  const telegramId = ctx.from.id.toString();

  // Сбрасываем предмет, режим и историю
  await User.findOneAndUpdate(
    { telegramId },
    {
      selectedSubject: null,
      selectedMode: null,
      chatHistory: [],
      messagesCount: 0,
      firstMessageAt: null,
      lastMessageAt: null,
    }
  );

  // Редактируем сообщение с подтверждением
  await ctx.editMessageText(
    "✅ История и выбор предмета сброшены. Пожалуйста, выберите предмет заново."
  );

  // Отправляем меню выбора предмета
  const subjects = [
    { label: "📐 Математика", value: "math" },
    { label: "🧪 Физика", value: "physics" },
    { label: "🔬 Химия", value: "chemistry" },
    { label: "📚 Русский язык", value: "russian" },
  ];

  const buttons = subjects.map((subj) => [
    Markup.button.callback(subj.label, `select_subject_${subj.value}`),
  ]);

  await ctx.reply("🎓 Выберите предмет:", Markup.inlineKeyboard(buttons));
};
