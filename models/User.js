const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  agreedToTerms: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },

  // Используем эти поля для выбранных предмета и режима
  selectedSubject: String, // было subject → меняем на selectedSubject
  selectedMode: String, // было mode → меняем на selectedMode

  // Лимиты сообщений и даты для бесплатных пользователей
  dailyMessageCount: { type: Number, default: 0 }, // было dailyCount → заменил на более понятное
  lastMessageDate: String, // дата (YYYY-MM-DD) последнего сообщения для сброса dailyMessageCount

  chatHistory: [
    {
      role: String,
      content: String,
    },
  ],

  firstMessageAt: Date,
  lastMessageAt: Date,
  messagesCount: { type: Number, default: 0 },
  lastActiveDate: String,
});

module.exports = mongoose.model("User", userSchema);
