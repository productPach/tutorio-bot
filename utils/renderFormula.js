const axios = require("axios");

module.exports = async function renderFormula(formula, isDisplay = true) {
  try {
    // Упрощенное условие для простых формул
    if (formula.length < 30 && !formula.includes("\\")) {
      return null; // Используем текстовое представление
    }

    const response = await axios.get("https://math.now.sh", {
      params: {
        from: isDisplay ? "\\displaystyle " + formula : formula,
        color: "black",
        format: "png",
      },
      responseType: "arraybuffer",
      timeout: 5000, // Таймаут 5 секунд
    });

    return response.data;
  } catch (e) {
    console.error("MathJax API error:", e.message);
    throw new Error("Ошибка рендеринга формулы");
  }
};
