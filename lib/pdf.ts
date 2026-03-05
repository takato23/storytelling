function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function buildSimplePdf(title: string, bodyLines: string[]): Buffer {
  const lines = [title, "", ...bodyLines].slice(0, 36);
  const contentParts: string[] = [];
  contentParts.push("BT");
  contentParts.push("/F1 18 Tf");
  contentParts.push("50 780 Td");
  contentParts.push(`(${escapePdfText(lines[0] ?? "StoryMagic")}) Tj`);
  contentParts.push("/F1 12 Tf");

  for (let index = 1; index < lines.length; index += 1) {
    contentParts.push("0 -20 Td");
    contentParts.push(`(${escapePdfText(lines[index])}) Tj`);
  }

  contentParts.push("ET");
  const contentStream = contentParts.join("\n");
  const streamLength = Buffer.byteLength(contentStream, "utf8");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += object;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}
