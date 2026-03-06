import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = Buffer.from(arrayBuffer) as any;
    let questions: string[] = [];

    if (fileName.endsWith(".csv")) {
      // Parse CSV - extract first column or single column
      const text = buffer.toString("utf-8");
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        // Split by comma, take first cell (handles quoted values)
        const cells = parseCSVLine(line);
        const value = cells[0]?.trim();
        if (value && !isHeaderRow(value)) {
          questions.push(value);
        }
      }
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      // Parse Excel using exceljs
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return NextResponse.json({ error: "No worksheet found" }, { status: 400 });
      }
      let isFirstRow = true;
      worksheet.eachRow((row) => {
        const cellValue = row.getCell(1).text?.trim();
        if (isFirstRow) {
          isFirstRow = false;
          if (cellValue && isHeaderRow(cellValue)) return;
        }
        if (cellValue) {
          questions.push(cellValue);
        }
      });
    } else {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload a .csv or .xlsx file." },
        { status: 400 }
      );
    }

    // Remove duplicates and empty strings
    questions = [...new Set(questions.filter(Boolean))];

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No questions found in the file. Make sure questions are in the first column." },
        { status: 400 }
      );
    }

    return NextResponse.json({ questions });
  } catch (e) {
    console.error("File upload parse error:", e);
    return NextResponse.json({ error: "Failed to parse file" }, { status: 500 });
  }
}

function isHeaderRow(value: string): boolean {
  const lower = value.toLowerCase();
  return ["question", "questions", "query", "queries", "text", "q", "#"].includes(lower);
}

function parseCSVLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cells.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  cells.push(current);
  return cells;
}
