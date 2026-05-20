// Import Next.js request and response helpers for route handling.
import { NextRequest, NextResponse } from "next/server";
// Import Node.js path helper to build filesystem-safe paths.
import path from "node:path";
// Import Node.js file APIs to create directories and write files.
import { mkdir, writeFile } from "node:fs/promises";
// Import Node.js path resolution helper for robust binary lookup.
import { createRequire } from "node:module";
// Import Node.js process runner to execute ffmpeg command.
import { spawn } from "node:child_process";

// Create CommonJS-compatible resolver from ESM context.
const require = createRequire(import.meta.url);

// Resolve ffmpeg binary path from package root in a bundler-safe way.
const resolveFfmpegBinaryPath = () => {
  // Resolve package entry file path first.
  const ffmpegModuleEntry = require.resolve("ffmpeg-static");
  // Build known binary location relative to package directory.
  return path.join(path.dirname(ffmpegModuleEntry), "ffmpeg");
};

// Declare shape of payload expected from client export action.
type ExportPayload = {
  // Store generated analysis block from step one.
  analysis: unknown;
  // Store storyboard data from step two.
  scenes: unknown;
  // Store timeline data from step three.
  timeline: unknown;
  // Store subtitle data from step four.
  subtitles: unknown;
  // Store selected voiceover language.
  language: string;
  // Store business metrics shown in export dashboard.
  metrics: {
    timeSaved: string;
    traditionalWorkflow: string;
    withTraeDirector: string;
    roi: string;
  };
};

// Handle POST requests to produce export artifacts for demo.
export async function POST(request: NextRequest) {
  try {
    // Parse client JSON body into typed payload.
    const payload = (await request.json()) as ExportPayload;
    // Build deterministic timestamp for file naming.
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    // Resolve absolute path to public exports directory.
    const exportsDir = path.join(process.cwd(), "public", "exports");
    // Ensure export directory exists before writing files.
    await mkdir(exportsDir, { recursive: true });

    // Build report object to capture all export context.
    const report = {
      // Version field helps future compatibility.
      version: "1.0.0",
      // Mark source product for clarity.
      product: "TRAE Director",
      // Save creation time for traceability.
      exportedAt: new Date().toISOString(),
      // Save full payload for judge/demo evidence.
      payload,
    };

    // Create file names for report and placeholder video.
    const reportFileName = `export-report-${timestamp}.json`;
    // Keep a stable video placeholder name for easy download.
    const videoFileName = "final-video.mp4";
    // Build absolute path to report file.
    const reportFilePath = path.join(exportsDir, reportFileName);
    // Build absolute path to placeholder video file.
    const videoFilePath = path.join(exportsDir, videoFileName);

    // Persist JSON report with human-readable formatting.
    await writeFile(reportFilePath, JSON.stringify(report, null, 2), "utf-8");

    // Resolve ffmpeg binary path for current runtime environment.
    const ffmpegBinaryPath = resolveFfmpegBinaryPath();

    // Build ffmpeg arguments for a tiny valid MP4 placeholder.
    const ffmpegArgs = [
      // Overwrite existing output file if present.
      "-y",
      // Generate black color source at 1280x720 resolution.
      "-f",
      "lavfi",
      "-i",
      "color=c=black:s=1280x720:d=2",
      // Overlay simple centered text for clear placeholder identity.
      "-vf",
      "drawtext=text='TRAE Director Demo Export':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2",
      // Encode with H.264 baseline profile for broad compatibility.
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      // Set output path in public exports directory.
      videoFilePath,
    ];

    // Execute ffmpeg process and wait until encoding completes.
    await new Promise<void>((resolve, reject) => {
      // Spawn ffmpeg process with configured arguments.
      const child = spawn(ffmpegBinaryPath, ffmpegArgs, {
        // Run in shell-free mode for safer execution.
        shell: false,
      });

      // Capture stderr chunks for useful error diagnostics.
      let stderr = "";
      child.stderr.on("data", (chunk) => {
        // Append chunk text to cumulative stderr string.
        stderr += chunk.toString();
      });

      // Handle process-level launch errors.
      child.on("error", (spawnError) => {
        // Reject with rich error details for API response.
        reject(spawnError);
      });

      // Resolve or reject based on ffmpeg exit code.
      child.on("close", (code) => {
        // Resolve when ffmpeg exits successfully.
        if (code === 0) {
          resolve();
          return;
        }
        // Reject when ffmpeg fails, including stderr payload.
        reject(new Error(`ffmpeg exited with code ${code}. ${stderr}`));
      });
    });

    // Return public URLs so client can show direct download links.
    return NextResponse.json({
      success: true,
      // Expose downloadable report URL.
      reportUrl: `/exports/${reportFileName}`,
      // Expose downloadable placeholder video URL.
      videoUrl: `/exports/${videoFileName}`,
    });
  } catch (error) {
    // Return safe server error payload for UI handling.
    return NextResponse.json(
      {
        success: false,
        message: "Failed to export artifacts.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
