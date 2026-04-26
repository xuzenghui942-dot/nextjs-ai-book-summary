const fs = require("fs");
const path = require("path");

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    process.stdout.write(JSON.stringify({ error: "Missing PDF path argument" }));
    process.exit(1);
  }

  const resolvedPath = path.resolve(pdfPath);
  if (!fs.existsSync(resolvedPath)) {
    process.stdout.write(JSON.stringify({ error: `PDF file not found: ${resolvedPath}` }));
    process.exit(1);
  }

  try {
    const { PDFParse } = require("pdf-parse");
    const buffer = await fs.promises.readFile(resolvedPath);
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      process.stdout.write(JSON.stringify({ text: String(result?.text || "") }));
    } finally {
      await parser.destroy();
    }
  } catch (error) {
    process.stdout.write(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      })
    );
    process.exit(1);
  }
}

main();
