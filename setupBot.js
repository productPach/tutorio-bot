const startHandler = require("./commands/start");
const resetHandler = require("./commands/reset");
const profileHandler = require("./commands/profile");
const buyHandler = require("./commands/buy");
const modeHandler = require("./commands/mode");
const subjectHandler = require("./commands/subject");
const helpHandler = require("./commands/help");
const restartHandler = require("./commands/restart");
const textHandler = require("./commands/text");

const confirmTermsHandler = require("./actions/confirmTerms");
const selectSubjectHandler = require("./actions/selectSubject");
const selectSubjectChooseHandler = require("./actions/selectSubjectChoose");
const selectModeHandler = require("./actions/selectMode");
const confirmChangeSubjectHandler = require("./actions/confirmChangeSubject");
const cancelChangeSubjectHandler = require("./actions/cancelChangeSubject");
const confirmChangeModeHandler = require("./actions/confirmChangeMode");
const cancelChangeModeHandler = require("./actions/cancelChangeMode");

function setupBot(bot) {
  bot.telegram.setMyCommands([
    { command: "start", description: "Старт" },
    { command: "subject", description: "Выбрать предмет" },
    { command: "mode", description: "Выбрать режим" },
    { command: "buy", description: "Купить подписку" },
    { command: "help", description: "Как работать с ботом" },
    { command: "restart", description: "Перезапуск" },
    { command: "reset", description: "Забыть переписку" },
    { command: "profile", description: "Профиль" },
  ]);

  bot.start(startHandler);
  bot.command("subject", subjectHandler);
  bot.command("mode", modeHandler);
  bot.command("buy", buyHandler);
  bot.command("help", helpHandler);
  bot.command("restart", restartHandler);
  bot.command("reset", resetHandler.command);
  bot.action("confirm_reset", resetHandler.confirm);
  bot.action("cancel_reset", resetHandler.cancel);
  bot.command("profile", profileHandler);

  // Согласие с условиями
  bot.action("confirm_terms", confirmTermsHandler);

  // Кнопка открыть меню выбора предмета
  bot.action("select_subject", selectSubjectHandler);

  // Обработка выбора предмета (callback: select_subject_<value>)
  bot.action(/^select_subject_/, selectSubjectChooseHandler);

  // Обработка выбора режима (callback: mode_fast, mode_tutor и т.п.)
  bot.action(/^mode_/, selectModeHandler);

  bot.action("confirm_change_subject", confirmChangeSubjectHandler);
  bot.action("cancel_change_subject", cancelChangeSubjectHandler);

  bot.action(/^confirm_mode_change_/, confirmChangeModeHandler);
  bot.action("cancel_mode_change", cancelChangeModeHandler);

  bot.on("text", textHandler);
}

module.exports = { setupBot };
