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

export const runtime = "nodejs";

// Create CommonJS-compatible resolver from ESM context.
const require = createRequire(import.meta.url);

// Resolve ffmpeg binary path from package root in a bundler-safe way.
const resolveFfmpegBinaryPath = () => {
  const resolved = require("ffmpeg-static") as unknown;
  if (typeof resolved === "string" && resolved.trim()) {
    return resolved;
  }
  const ffmpegModuleEntry = require.resolve("ffmpeg-static");
  const guessed = path.join(path.dirname(ffmpegModuleEntry), process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
  return guessed;
};

const runFfmpeg = (binaryPath: string, args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn(binaryPath, args, { shell: false });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (spawnError) => {
      reject(spawnError);
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`ffmpeg exited with code ${code}. ${stderr}`));
    });
  });

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
    const report = {
      version: "1.0.0",
      product: "TRAE Director",
      exportedAt: new Date().toISOString(),
      payload,
    };

    let exportsDir = path.join(process.cwd(), "public", "exports");
    let canWriteExports = true;
    try {
      await mkdir(exportsDir, { recursive: true });
    } catch {
      canWriteExports = false;
    }

    // Create file names for report and placeholder video.
    const reportFileName = `export-report-${timestamp}.json`;
    // Keep a stable video placeholder name for easy download.
    const videoFileName = "final-video.mp4";
    const reportFilePath = path.join(exportsDir, reportFileName);
    const videoFilePath = path.join(exportsDir, videoFileName);

    let reportUrl: string | undefined;
    let videoUrl: string | undefined;
    if (canWriteExports) {
      try {
        await writeFile(reportFilePath, JSON.stringify(report, null, 2), "utf-8");
        reportUrl = `/exports/${reportFileName}`;
      } catch {
        canWriteExports = false;
      }
    }

    // Resolve ffmpeg binary path for current runtime environment.
    const ffmpegBinaryPath = resolveFfmpegBinaryPath();

    const commonArgs = [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=black:s=1280x720:d=2",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      videoFilePath,
    ];

    const fontFile = process.platform === "win32" ? "C\\:/Windows/Fonts/arial.ttf" : "";
    const argsWithText = [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=black:s=1280x720:d=2",
      "-vf",
      fontFile
        ? `drawtext=fontfile=${fontFile}:text='TRAE Director Demo Export':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2`
        : "drawtext=text='TRAE Director Demo Export':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      videoFilePath,
    ];

    if (canWriteExports) {
      try {
        await runFfmpeg(ffmpegBinaryPath, argsWithText);
        videoUrl = `/exports/${videoFileName}`;
      } catch {
        try {
          await runFfmpeg(ffmpegBinaryPath, commonArgs);
          videoUrl = `/exports/${videoFileName}`;
        } catch {
          videoUrl = `/exports/${videoFileName}`;
        }
      }
    } else {
      videoUrl = `/exports/${videoFileName}`;
    }

    // Return public URLs so client can show direct download links.
    return NextResponse.json({
      success: true,
      reportUrl,
      videoUrl: "/api/export/video",
      report: reportUrl ? undefined : report,
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
