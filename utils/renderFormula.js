const katex = require("katex");
const { createCanvas } = require("canvas");

module.exports = async function renderFormula(formula) {
  // Рендерим формулу в HTML SVG
  let html;
  try {
    html = katex.renderToString(formula, {
      throwOnError: false,
      displayMode: true,
    });
  } catch (e) {
    throw new Error("Ошибка рендера формулы: " + e.message);
  }

  // Создаём canvas, рисуем формулу (приблизительно)
  // Можно взять ширину и высоту примерно, либо фиксированные размеры
  const width = 400;
  const height = 100;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Фон белый
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);

  // Добавим отрисовку через SVG-to-canvas или просто текст (т.к. katex.renderToString дает HTML, а canvas не умеет его рендерить)
  // Для простоты здесь сделаем заглушку с текстом формулы (лучше настроить отдельный рендер)

  ctx.fillStyle = "#000";
  ctx.font = "20px serif";
  ctx.fillText(formula, 10, 50);

  return canvas.toBuffer();
};
