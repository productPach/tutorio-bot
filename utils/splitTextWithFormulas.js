// utils/splitTextWithFormulas.js
module.exports = function splitTextWithFormulas(input) {
  const parts = [];
  // Регулярка для поиска формул в $...$ или $$...$$ или \( ... \)
  const regex = /(\$\$.*?\$\$|\$.*?\$|\\\(.*?\\\))/gs;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(input)) !== null) {
    // Текст перед формулой
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: input.slice(lastIndex, match.index),
      });
    }
    // Формула без обрамления
    let formula = match[0];
    if (formula.startsWith("$$") && formula.endsWith("$$")) {
      formula = formula.slice(2, -2);
    } else if (formula.startsWith("$") && formula.endsWith("$")) {
      formula = formula.slice(1, -1);
    } else if (formula.startsWith("\\(") && formula.endsWith("\\)")) {
      formula = formula.slice(2, -2);
    }
    parts.push({ type: "formula", content: formula.trim() });

    lastIndex = regex.lastIndex;
  }

  // Остаток текста после последней формулы
  if (lastIndex < input.length) {
    parts.push({ type: "text", content: input.slice(lastIndex) });
  }

  return parts;
};
