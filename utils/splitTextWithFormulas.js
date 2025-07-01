module.exports = function splitTextWithFormulas(input) {
  const parts = [];
  // Улучшенное регулярное выражение с поддержкой вложенных формул
  const regex =
    /(\$\$(?:[^$]|\$(?!\$))*\$\$|\$(?:[^$\n]|\$(?!$))*\$|\\\((?:[^]|\\\))*\\\)|\\\[(?:[^]|\\\])*\\\])/gs;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: input.slice(lastIndex, match.index),
      });
    }

    const fullMatch = match[0];
    let formula = "";
    let isDisplay = false;

    if (fullMatch.startsWith("$$") && fullMatch.endsWith("$$")) {
      formula = fullMatch.slice(2, -2);
      isDisplay = true;
    } else if (fullMatch.startsWith("$") && fullMatch.endsWith("$")) {
      formula = fullMatch.slice(1, -1);
    } else if (fullMatch.startsWith("\\(") && fullMatch.endsWith("\\)")) {
      formula = fullMatch.slice(2, -2);
    } else if (fullMatch.startsWith("\\[") && fullMatch.endsWith("\\]")) {
      formula = fullMatch.slice(2, -2);
      isDisplay = true;
    }

    parts.push({
      type: "formula",
      content: formula.trim(),
      isDisplay,
    });

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < input.length) {
    parts.push({
      type: "text",
      content: input.slice(lastIndex),
    });
  }

  return parts;
};
