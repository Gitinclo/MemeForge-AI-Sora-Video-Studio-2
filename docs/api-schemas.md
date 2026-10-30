# Live API Schemas & Bleeding-Edge Model Reference (`v2.2.0`)

> **Agent Notice**: Pin all server-side and client-side calls to the exact model identifiers and JSON payloads documented below. Never guess legacy SDK syntax (`google-generativeai` or `getGenerativeModel`)—always use `new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })` from `@google/genai` inside `server.ts`.

---

## 1. Pinned Model Identifiers

| Capability | Pinned Model ID | SDK Method (`@google/genai`) | Notes |
| :--- | :--- | :--- | :--- |
| **Cinema Video Generation (High Quality)** | `veo-3.1-generate-preview` | `ai.models.generateVideos(...)` | Supports `720p`/`1080p`/`4k`, `16:9` or `9:16`, durations `4`, `6`, `8` sec |
| **Cinema Video Generation (Fast)** | `veo-3.1-fast-generate-preview` | `ai.models.generateVideos(...)` | Low-latency draft & storyboard preview tier |
| **Cinema Video Generation (Budget Pilot)** | `veo-3.1-lite-generate-preview` | `ai.models.generateVideos(...)` | $0.05/s (`720p`) and $0.08/s (`1080p`) for 23-shot 3-min episodes |
| **Character Voiceover TTS** | `gemini-2.5-flash-preview-tts` | `ai.models.generateContent(...)` | `responseModalities: ['AUDIO']`, voices: `Puck`, `Charon`, `Kore`, `Fenrir`, `Zephyr` |
| **AI Director & YouTube SEO** | `gemini-4-argon` | `ai.models.generateContent(...)` | Structured JSON schema output for camera & metadata |
| **Magic Meme Captions** | `gemini-3.8-flash` | `ai.models.generateContent(...)` | Fast JSON array caption generation |
| **Keyframe & Style Transfer Image** | `gemini-3.1-flash-lite-image` | `ai.models.generateContent(...)` | Base64 inline image part generation |

---

## 2. Express Backend Proxy Endpoints (`server.ts`)

### `POST /api/leo/generate-video`
Starts an asynchronous Veo 3.1 video generation job.

**Request Payload:**
```json
{
  "prompt": "Dark urban fantasy anime, Lin_Jie opening an old wooden bookstore door during a torrential rainstorm, 24fps, 8k cinematic lighting",
  "aspectRatio": "16:9",
  "resolution": "1080p"
}
```

**Response Payload (`200 OK`):**
```json
{
  "operationName": "operations/veo-3.1-job-982341",
  "done": false,
  "fallbackMode": false
}
```

---

### `POST /api/leo/poll-video`
Polls an in-flight Veo 3.1 video generation operation and streams or returns the signed MP4 URI.

**Request Payload:**
```json
{
  "operationName": "operations/veo-3.1-job-982341"
}
```

**Response Payload (`200 OK`):**
```json
{
  "done": true,
  "videoUri": "https://storage.googleapis.com/generativeai-downloads/videos/sample.mp4",
  "fallbackMode": false
}
```

---

### `POST /api/text-to-animation/generate-voice`
Synthesizes character dialogue for the 10-shot *"Nocturne in the Rainy Bookstore"* pipeline using `gemini-2.5-flash-preview-tts` (with deterministic WAV synthesis fallback when offline).

**Request Payload:**
```json
{
  "shotId": "shot-01",
  "characterId": "Character_A",
  "characterName": "Lin_Jie",
  "dialogue": "Such a heavy downpour.",
  "voiceName": "Charon",
  "emotion": "Warm, gentle, serene, inadvertently mysterious"
}
```

**Response Payload (`200 OK`):**
```json
{
  "shotId": "shot-01",
  "characterId": "Character_A",
  "characterName": "Lin_Jie",
  "voiceName": "Charon",
  "audioDataUri": "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
  "mimeType": "audio/wav",
  "durationEstimateSec": 2.4,
  "fallbackMode": false,
  "model": "gemini-2.5-flash-preview-tts"
}
```

---

### `GET /api/video-pilot/pricing` & `POST /api/video-pilot/compile-chapter`
Validates the 23-shot 3-minute episode budget against `config/pricing.yaml` and compiles Veo 3.1 API payloads with character/environment reference locks.

**Request Payload (`POST /api/video-pilot/compile-chapter`):**
```json
{
  "modelTier": "veo-3.1-lite-generate-preview",
  "resolution": "720p",
  "includeAudio": true,
  "maxBudgetUsd": 50.0,
  "safetyMarginPct": 15
}
```

**Response Payload (`200 OK`):**
```json
{
  "passedBudgetGate": true,
  "totalDurationSec": 180,
  "shotCount": 23,
  "baseCostUsd": 9.0,
  "bufferedCostUsd": 10.35,
  "maxBudgetUsd": 50.0,
  "compiledPayloads": [
    {
      "shotId": "S01",
      "model": "veo-3.1-lite-generate-preview",
      "durationSeconds": 8,
      "resolution": "720p",
      "aspectRatio": "16:9",
      "referenceAssets": ["CHAR_LIN_JIE", "ENV_BOOKSTORE_EXT"]
    }
  ]
}
```

---

## 3. On-Disk PyTorch DiT (`pytorch_dit/pipeline.py`) & Sora 2 Ultra Schemas

### PyTorch DiT Tensor Shape Convention
All docstrings and tensor interfaces in `pytorch_dit/` follow `[B, T, H, W, C]` (or channel-first `[B, C, T, H, W]` inside Causal 3D Conv layers as explicitly documented):
- **Causal 3D VAE (`pytorch_dit/vae.py`)**: `encode(x: [B, C, T, H, W]) -> z: [B, c, T/8, H/8, W/8]` with causal left-only temporal padding (`pad_t = kernel_t - 1`).
- **3D Patch Tokenizer (`pytorch_dit/patchify.py`)**: `patchify(z) -> tokens: [B, N_t * N_h * N_w, D]` with factorized 3D sinusoidal + learned positional embeddings.
- **Alternating Spatial/Temporal DiT (`pytorch_dit/dit.py`)**: Never materializes full `(T*H*W)^2` attention; alternates spatial `[B*T, H*W, D]` and temporal `[B*H*W, T, D]` attention blocks with `adaLN-Zero` timestep conditioning and T5-XXL (`4096-dim`) cross-attention.
