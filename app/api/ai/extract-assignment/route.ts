import { NextRequest, NextResponse } from "next/server";
import { assignmentInputSchema } from "@/lib/validators/assignment";
import { extractAssignmentFromText, fallbackOcrExtract } from "@/lib/ai/extract";
import { sanitizeText } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = assignmentInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { source_type, text, file_name, file_type } = parsed.data;

    let inputText = text ? sanitizeText(text) : "";

    if (!inputText && (source_type === "screenshot" || source_type === "pdf" || source_type === "upload")) {
      if (!file_name) {
        return NextResponse.json(
          { error: "No file provided for upload extraction" },
          { status: 400 }
        );
      }
      inputText = fallbackOcrExtract(file_name, file_type || "unknown");
    }

    if (!inputText || inputText.length < 10) {
      return NextResponse.json(
        { error: "Please provide at least 10 characters of assignment text" },
        { status: 400 }
      );
    }

    const result = await extractAssignmentFromText(inputText);
    return NextResponse.json({
      ...result,
      provider: process.env.OPENAI_API_KEY ? "openai" : "fallback",
      notice: process.env.OPENAI_API_KEY
        ? undefined
        : "AI features require an OpenAI API key. Using demo extraction for now.",
    });
  } catch (error) {
    console.error("AI extraction error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Failed to extract assignment" }, { status: 500 });
  }
}
