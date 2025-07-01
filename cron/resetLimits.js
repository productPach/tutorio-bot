const cron = require("node-cron");
const User = require("../models/User");

function scheduleResetLimits() {
  cron.schedule("0 3 * * *", async () => {
    // каждый день в 3:00
    console.log("♻️ Запуск сброса лимитов");

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    try {
      const users = await User.find({
        isPremium: false,
        firstMessageAt: { $lte: weekAgo },
      });

      for (const user of users) {
        user.messagesCount = 0;
        user.firstMessageAt = null;
        await user.save();
      }

      console.log(`Сброшено лимитов у ${users.length} пользователей`);
    } catch (err) {
      console.error("Ошибка сброса лимитов:", err);
    }
  });
}

module.exports = { scheduleResetLimits };
