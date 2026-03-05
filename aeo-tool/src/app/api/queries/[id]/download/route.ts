import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Query from "@/models/Query";
import ExcelJS from "exceljs";

const PROVIDER_LABELS: Record<string, string> = {
  openai: "ChatGPT (OpenAI)",
  gemini: "Gemini (Google)",
  perplexity: "Perplexity",
  serpapi: "Google AI Overview",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format") || "excel";

  await dbConnect();
  const query = await Query.findOne({ _id: id, userId: session.user.id });
  if (!query) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (format === "excel") {
    return generateExcel(query);
  }
  return NextResponse.json({ error: "Invalid format" }, { status: 400 });
}

async function generateExcel(query: {
  title: string;
  country: string;
  createdAt: Date;
  questions: Array<{
    text: string;
    responses: Array<{ provider: string; text: string; status: string }>;
  }>;
}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("AEO Report");

  // Header info
  sheet.mergeCells("A1:E1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = query.title;
  titleCell.font = { size: 16, bold: true, color: { argb: "FF2D6A4F" } };

  sheet.mergeCells("A2:E2");
  sheet.getCell("A2").value = `Country: ${query.country} | Date: ${new Date(query.createdAt).toLocaleDateString()}`;
  sheet.getCell("A2").font = { size: 11, italic: true, color: { argb: "FF666666" } };

  // Column headers
  const headerRow = sheet.addRow([]);
  sheet.addRow([]);
  const colHeaders = sheet.addRow(["#", "Question", "Platform", "Response"]);
  colHeaders.font = { bold: true, color: { argb: "FFFFFFFF" } };
  colHeaders.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2D6A4F" },
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF000000" } },
    };
  });

  sheet.getColumn(1).width = 5;
  sheet.getColumn(2).width = 50;
  sheet.getColumn(3).width = 25;
  sheet.getColumn(4).width = 100;

  // Data rows
  query.questions.forEach((q, qi) => {
    const completedResponses = q.responses.filter((r) => r.status === "completed");
    completedResponses.forEach((r, ri) => {
      const row = sheet.addRow([
        ri === 0 ? qi + 1 : "",
        ri === 0 ? q.text : "",
        PROVIDER_LABELS[r.provider] || r.provider,
        r.text,
      ]);
      row.getCell(4).alignment = { wrapText: true, vertical: "top" };
      row.getCell(2).alignment = { wrapText: true, vertical: "top" };
      if (ri === 0) {
        row.getCell(1).font = { bold: true };
        row.getCell(2).font = { bold: true };
      }
    });
    // Add separator row
    sheet.addRow([]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${query.title.replace(/[^a-zA-Z0-9 ]/g, "")}.xlsx"`,
    },
  });
}
