function renderFormula(latex) {
  const encoded = encodeURIComponent(latex);
  return `https://latex.codecogs.com/png.image?${encoded}`;
}

module.exports = renderFormula;
