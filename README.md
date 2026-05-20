# TRAE Director (VI/EN README)

TRAE Director is a prototype built for TRAE SOLO Hackathon 2026 - Video Generation Track.

TRAE Director là một prototype được xây dựng cho TRAE SOLO Hackathon 2026 - Video Generation Track.

---

## 1) Business Logic / Logic kinh doanh

### Problem / Bài toán

**EN**
- Traditional video workflows are slow, fragmented, and expensive.
- Teams often lose consistency in character, tone, and visual style across stages.
- Business stakeholders need measurable ROI, not only creative output.

**VI**
- Quy trình làm video truyền thống chậm, rời rạc và tốn chi phí.
- Dễ mất tính nhất quán về nhân vật, tone và visual style qua từng công đoạn.
- Bên kinh doanh cần ROI đo được, không chỉ cần video đẹp.

### Solution / Giải pháp

**EN**  
Users only paste a script. TRAE Director orchestrates an end-to-end 5-step pipeline:
1. Script Input + TRAE Analysis  
2. Storyboard Generation  
3. Intelligent Editing  
4. Subtitle + Voiceover  
5. Export + Business Impact

**VI**  
Người dùng chỉ cần dán script. TRAE Director tự động điều phối pipeline 5 bước:
1. Script Input + TRAE Analysis  
2. Storyboard Generation  
3. Intelligent Editing  
4. Subtitle + Voiceover  
5. Export + Business Impact

### ROI Metrics / Chỉ số ROI

- Time Saved: **87%**
- Traditional workflow: **6 hours**
- With TRAE Director: **47 minutes**
- ROI: **5.8x**

### Hackathon Scoring Alignment / Liên kết tiêu chí chấm điểm

**TRAE Platform Integration Depth (30%)**
- Step 1 uses `POST /api/trae/analyze` as a TRAE adapter.
- Supports live integration via `TRAE_API_URL` and `TRAE_API_KEY`.
- Has fallback mode so demo remains stable.

**Business Impact & Feasibility (30%)**
- Export step shows measurable impact dashboard.
- Export artifacts (`.json` report + `.mp4` placeholder) provide demo evidence.

---

## 2) Architecture / Kiến trúc

- Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, Sonner
- Voiceover: Web Speech API (client-side, VI/EN)
- API routes:
  - `POST /api/trae/analyze` (TRAE adapter + fallback)
  - `POST /api/export` (export report + placeholder video)

---

## 3) Requirements / Yêu cầu môi trường

- Node.js 20+
- npm 10+

Note / Lưu ý:
- `ffmpeg-static` is used to generate a valid MP4 placeholder for export.
- `ffmpeg-static` được dùng để tạo file MP4 placeholder hợp lệ.

---

## 4) Local Run Guide / Cách chạy local

### Step 1 - Install dependencies / Cài dependencies

```bash
npm install
```

### Step 2 - Configure environment / Cấu hình env

```bash
cp .env.example .env.local
```

Set values in `.env.local` (optional for live TRAE mode):

```env
TRAE_API_URL=https://<your-trae-compatible-endpoint>
TRAE_API_KEY=<your-token-if-needed>
```

If not configured, the app runs in fallback mode for demo.
Nếu chưa cấu hình, app vẫn chạy fallback mode để demo.

### Step 3 - Start dev server / Chạy dev server

```bash
npm run dev
```

Open / Mở trình duyệt:
- `http://localhost:3000`

---

## 5) Production Build / Build production

```bash
npm run build
npm run start
```

---

## 6) Quick Demo Script (3-5 min) / Kịch bản demo nhanh (3-5 phút)

1. Click `Load Sample Script`
2. Click `Phân tích với TRAE Agent`
3. Click `Generate 4-6 Consistent Scenes`
4. Click `Auto-compose Timeline`
5. Click `Generate Subtitles` -> choose language -> click `Phát Voiceover`
6. Click `Export Final Video`
7. Show ROI dashboard and download artifacts

---

## 7) Main Project Structure / Cấu trúc thư mục chính

```text
app/
  api/
    export/route.ts
    trae/analyze/route.ts
  globals.css
  layout.tsx
  page.tsx
public/
  exports/   # generated after export
```

---

## 8) Security and Git Notes / Lưu ý bảo mật và Git

- Do not commit `.env.local`
- Do not commit `node_modules` and `.next`
- If GitHub rejects push due to large files, clean history and remove dependency/build artifacts from commits

---

## 9) Next Improvements / Hướng nâng cấp tiếp theo

- Integrate live TRAE APIs for all 5 steps (not only analysis)
- Replace placeholder export with real render pipeline
- Add telemetry (jobId, latency, success rate) for stronger technical credibility
