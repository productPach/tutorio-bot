const User = require("../models/User");
const { Markup } = require("telegraf");

const confirmTerms = async (ctx) => {
  const telegramId = ctx.from.id.toString();

  // Обновляем флаг согласия
  await User.findOneAndUpdate(
    { telegramId },
    { agreedToTerms: true },
    { new: true }
  );

  // Редактируем сообщение с кнопкой
  await ctx.editMessageText(
    "✅ Спасибо за подтверждение! Теперь вы можете выбрать предмет."
  );

  // Отправляем меню выбора предмета
  await ctx.reply(
    "🎓 Начнем! Выберите предмет:",
    Markup.inlineKeyboard([
      [Markup.button.callback("📐 Математика", "select_subject_math")],
      [Markup.button.callback("🧪 Физика", "select_subject_physics")],
      [Markup.button.callback("🔬 Химия", "select_subject_chemistry")],
      [Markup.button.callback("📚 Русский язык", "select_subject_russian")],
    ])
  );
};

module.exports = confirmTerms;
