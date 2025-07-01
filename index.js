require("dotenv").config();
const express = require("express");
const { Telegraf } = require("telegraf");
const mongoose = require("mongoose");
const { setupBot } = require("./setupBot");
const { scheduleResetLimits } = require("./cron/resetLimits");

const app = express();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

app.use(express.json());

// Webhook для Telegram
app.use(bot.webhookCallback("/bot"));
bot.telegram.setWebhook(`${process.env.SERVER_URL}/bot`);

// MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Инициализация команд бота
setupBot(bot);

// Запуск планировщика сброса лимитов
scheduleResetLimits();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
