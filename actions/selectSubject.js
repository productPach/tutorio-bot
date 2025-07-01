const { Markup } = require("telegraf");

module.exports = async (ctx) => {
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
