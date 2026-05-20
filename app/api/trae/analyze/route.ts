// Import Next.js request and response helpers for API route handling.
import { NextRequest, NextResponse } from "next/server";

// Define expected payload shape sent from the client analysis step.
type AnalyzePayload = {
  // Raw script text that user pasted in step one.
  script: string;
};

// Define canonical analysis shape consumed by the frontend.
type AnalysisResult = {
  // Generated project title used in UI card.
  title: string;
  // Story category used for creative direction.
  genre: string;
  // Tone descriptor for consistency across pipeline.
  tone: string;
  // Character list for storyboard continuity.
  characters: string[];
  // Thematic anchors aligned with judging criteria.
  keyThemes: string[];
  // Suggested soundtrack profile.
  suggestedMusic: string;
  // Recommended camera movement/style.
  cameraStyle: string;
  // Scene count estimate for the storyboard stage.
  totalScenes: number;
  // Runtime estimate for final cut.
  estimatedDuration: string;
};

// Build deterministic fallback analysis when external API is unavailable.
const buildFallbackAnalysis = (script: string): AnalysisResult => {
  // Detect whether script includes Vietnamese diacritics.
  const isVietnamese = /[ăâđêôơưáàảãạéèẻẽẹíìỉĩịóòỏõọúùủũụ]/i.test(script);
  // Return polished mock output that keeps demo stable.
  return {
    // Localized title keeps user experience natural.
    title: isVietnamese
      ? "TRAE SOLO: Tăng tốc sản xuất video bằng AI"
      : "TRAE SOLO: Accelerating Video Production with AI",
    // Keep genre fixed for this hackathon product narrative.
    genre: "Startup Tech Story",
    // Keep tone aligned with pitch and ROI focus.
    tone: "Cinematic • Inspiring • ROI-focused",
    // Preserve core cast for consistency.
    characters: ["Linh (Creator)", "Narrator", "Mentor"],
    // Keep themes mapped to judging dimensions.
    keyThemes: ["Automation", "Speed-to-Market", "Business Impact", "TRAE Integration Depth"],
    // Music recommendation for demo realism.
    suggestedMusic: "Future Bass + Ambient Strings",
    // Camera style recommendation for a modern promo look.
    cameraStyle: "Dynamic dolly shots + close-up emotional beats",
    // Keep scene count concise for quick generation.
    totalScenes: 5,
    // Keep duration realistic for a short product story.
    estimatedDuration: "01:35",
  };
};

// Parse arbitrary API response into the strict frontend shape.
const normalizeAnalysis = (raw: unknown, script: string): AnalysisResult => {
  // Cast to loose object map for safe property extraction.
  const source = (raw ?? {}) as Record<string, unknown>;
  // Build fallback first so missing fields can be filled safely.
  const fallback = buildFallbackAnalysis(script);
  // Return normalized and validated object.
  return {
    // Use remote field when valid string, otherwise fallback title.
    title: typeof source.title === "string" ? source.title : fallback.title,
    // Use remote genre when present.
    genre: typeof source.genre === "string" ? source.genre : fallback.genre,
    // Use remote tone when present.
    tone: typeof source.tone === "string" ? source.tone : fallback.tone,
    // Use remote character list when valid array of strings.
    characters: Array.isArray(source.characters)
      ? source.characters.filter((item): item is string => typeof item === "string")
      : fallback.characters,
    // Use remote themes when valid array.
    keyThemes: Array.isArray(source.keyThemes)
      ? source.keyThemes.filter((item): item is string => typeof item === "string")
      : fallback.keyThemes,
    // Use remote soundtrack preference when present.
    suggestedMusic:
      typeof source.suggestedMusic === "string" ? source.suggestedMusic : fallback.suggestedMusic,
    // Use remote camera style when present.
    cameraStyle: typeof source.cameraStyle === "string" ? source.cameraStyle : fallback.cameraStyle,
    // Use remote scene count when valid number.
    totalScenes: typeof source.totalScenes === "number" ? source.totalScenes : fallback.totalScenes,
    // Use remote duration when valid string.
    estimatedDuration:
      typeof source.estimatedDuration === "string" ? source.estimatedDuration : fallback.estimatedDuration,
  };
};

// Handle POST analysis requests from step one CTA.
export async function POST(request: NextRequest) {
  try {
    // Parse incoming JSON body.
    const body = (await request.json()) as AnalyzePayload;
    // Normalize script value to a trimmed string.
    const script = typeof body.script === "string" ? body.script.trim() : "";
    // Reject invalid input early with explicit message.
    if (!script) {
      return NextResponse.json(
        {
          success: false,
          message: "Script is required for TRAE analysis.",
        },
        { status: 400 },
      );
    }

    // Read optional TRAE endpoint from environment.
    const traeApiUrl = process.env.TRAE_API_URL?.trim();
    // Read optional TRAE API key from environment.
    const traeApiKey = process.env.TRAE_API_KEY?.trim();

    // Use fallback path when endpoint is not configured.
    if (!traeApiUrl) {
      return NextResponse.json({
        success: true,
        source: "fallback-mock",
        analysis: buildFallbackAnalysis(script),
      });
    }

    // Call configured TRAE-compatible endpoint for real integration.
    const traeResponse = await fetch(traeApiUrl, {
      // Use POST because script is sent in request body.
      method: "POST",
      // Send JSON content type and optional auth header.
      headers: {
        "Content-Type": "application/json",
        ...(traeApiKey ? { Authorization: `Bearer ${traeApiKey}` } : {}),
      },
      // Send payload with script and product context.
      body: JSON.stringify({
        script,
        product: "TRAE Director",
        objective: "Analyze script for end-to-end video generation pipeline",
      }),
      // Keep a timeout-like behavior via AbortSignal.
      signal: AbortSignal.timeout(12000),
    });

    // Parse remote response body as JSON when possible.
    const traeData = (await traeResponse.json()) as Record<string, unknown>;
    // Throw descriptive error when upstream fails.
    if (!traeResponse.ok) {
      throw new Error(
        typeof traeData.message === "string"
          ? traeData.message
          : `TRAE endpoint returned ${traeResponse.status}`,
      );
    }

    // Normalize remote output into strict frontend schema.
    const analysis = normalizeAnalysis(traeData.analysis ?? traeData, script);
    // Return successful payload plus source metadata.
    return NextResponse.json({
      success: true,
      source: "trae-api",
      analysis,
    });
  } catch (error) {
    // Build safe fallback analysis when API call fails.
    const fallbackScript = "TRAE Director fallback script";
    // Return graceful degraded response so demo still works.
    return NextResponse.json(
      {
        success: true,
        source: "fallback-error",
        analysis: buildFallbackAnalysis(fallbackScript),
        warning: error instanceof Error ? error.message : "Unknown TRAE adapter error",
      },
      { status: 200 },
    );
  }
}
