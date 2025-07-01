function splitTextWithFormulas(text) {
  const regex = /(\$\$[^$]+\$\$|\$[^$]+\$|\\\[.*?\\\])/gs;
  const parts = [];
  let lastIndex = 0;

  for (const match of text.matchAll(regex)) {
    const { index } = match;
    if (index > lastIndex) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex, index).trim(),
      });
    }
    parts.push({ type: "formula", content: match[0].trim() });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex).trim() });
  }

  return parts.filter((p) => p.content.length > 0);
}
