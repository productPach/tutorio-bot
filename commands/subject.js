const User = require("../models/User");
const { Markup } = require("telegraf");

module.exports = async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const user = await User.findOne({ telegramId });

  if (!user?.agreedToTerms) {
    return ctx.reply("⚠️ Пожалуйста, подтвердите согласие через /start");
  }

  // Если предмет уже выбран и есть история — предупреждаем о потере
  if (
    user.selectedSubject ||
    (user.chatHistory && user.chatHistory.length > 0)
  ) {
    return ctx.reply(
      "⚠️ Вы уже выбрали предмет или есть история сообщений.\n" +
        "При смене предмета вся история будет удалена.\nПродолжить?",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "Да, сменить предмет",
            "confirm_change_subject"
          ),
        ],
        [Markup.button.callback("Отмена", "cancel_change_subject")],
      ])
    );
  }

  // Иначе показываем меню выбора предмета
  const subjects = [
    { label: "📐 Математика", value: "math" },
    { label: "🧪 Физика", value: "physics" },
    { label: "🔬 Химия", value: "chemistry" },
    { label: "📚 Русский язык", value: "russian" },
  ];

  const buttons = subjects.map((subj) => [
    Markup.button.callback(subj.label, `select_subject_${subj.value}`),
  ]);

  return ctx.reply("🎓 Выберите предмет:", Markup.inlineKeyboard(buttons));
};
