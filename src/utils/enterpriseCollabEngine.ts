import { triggerBrowserDownload } from './sharedCoreEngine';

export interface TimestampedComment {
  id: string;
  author: string;
  role: 'Admin' | 'Editor' | 'Viewer' | 'Director' | 'VFX Artist';
  avatarColor: string;
  timecode: string;
  frameNumber: number;
  text: string;
  createdAt: string;
  resolved: boolean;
}

export interface TimelineMergeConflict {
  id: string;
  trackName: string;
  clipName: string;
  timecodeRange: string;
  localAuthor: string;
  remoteAuthor: string;
  localChange: string;
  remoteChange: string;
  status: 'pending' | 'auto_resolved';
  resolutionStrategy: 'CRDT Auto-Merge' | 'Keep Local' | 'Keep Remote';
}

export interface CloudStorageConnector {
  id: 'dropbox' | 'gdrive';
  name: string;
  providerLabel: string;
  connected: boolean;
  autoSyncMasters: boolean;
  syncFolder: string;
  lastSyncedAt: string;
  syncedFilesCount: number;
  bandwidthMbps: number;
  status: 'idle' | 'syncing' | 'synced';
}

export interface E2eeSecurityConfig {
  enabled: boolean;
  cipherSuite: 'AES-256-GCM + X25519' | 'ChaCha20-Poly1305 Zero-Knowledge';
  keyRotationDays: number;
  keyFingerprint: string;
  hardwareHsmBacked: boolean;
}

export type RbacStandardRole = 'Admin' | 'Editor' | 'Viewer';

export const INITIAL_TIMESTAMPED_COMMENTS: TimestampedComment[] = [
  {
    id: 'cmt-1',
    author: 'Elena Rostova',
    role: 'Admin',
    avatarColor: 'bg-purple-500',
    timecode: '00:00:14:08',
    frameNumber: 848,
    text: 'Tighten the 32K ACES 2.0 highlight roll-off on the neon reflections before final Dolby Vision pass.',
    createdAt: '4m ago',
    resolved: false,
  },
  {
    id: 'cmt-2',
    author: 'Kenji Sato',
    role: 'Editor',
    avatarColor: 'bg-cyan-500',
    timecode: '00:01:02:19',
    frameNumber: 3739,
    text: 'AI rotoscoping matte locked at 1000 FPS. Ready for Fusion depth-glow composite.',
    createdAt: '11m ago',
    resolved: false,
  },
  {
    id: 'cmt-3',
    author: 'Maya Lin',
    role: 'Viewer',
    avatarColor: 'bg-emerald-500',
    timecode: '00:02:18:00',
    frameNumber: 8280,
    text: 'Client approved the Fairlight 192 kHz Dolby Atmos dialogue ducking here.',
    createdAt: '27m ago',
    resolved: true,
  },
];

export const INITIAL_MERGE_CONFLICTS: TimelineMergeConflict[] = [
  {
    id: 'conf-1',
    trackName: 'V1 · 32K 1000 FPS RAW Master',
    clipName: 'ARRI 32K Omnimax Plate (Cam A)',
    timecodeRange: '00:00:04:12 – 00:00:06:00',
    localAuthor: 'Alex Rivera (Admin)',
    remoteAuthor: 'Kenji Sato (Editor)',
    localChange: 'Ripple trim +12 frames (720,000,000,000 ticks)',
    remoteChange: 'Applied OCIO ACES 2.0 .cube LUT node',
    status: 'auto_resolved',
    resolutionStrategy: 'CRDT Auto-Merge',
  },
  {
    id: 'conf-2',
    trackName: 'A1 · Dialogue (192 kHz / 32f)',
    clipName: 'Studio Boom Stem 192 kHz',
    timecodeRange: '00:00:01:00 – 00:00:05:18',
    localAuthor: 'Samir Patel (Editor)',
    remoteAuthor: 'Elena Rostova (Admin)',
    localChange: 'VST3 FabFilter Pro-Q 3 +2.5 dB @ 3.2 kHz',
    remoteChange: 'Keyframe ducking -4.0 dB on Bus B1',
    status: 'pending',
    resolutionStrategy: 'CRDT Auto-Merge',
  },
];

export const INITIAL_CLOUD_CONNECTORS: CloudStorageConnector[] = [
  {
    id: 'dropbox',
    name: 'Dropbox Business Replay & Sync',
    providerLabel: 'Dropbox Enterprise API v2',
    connected: true,
    autoSyncMasters: true,
    syncFolder: '/MemeForge_Studio_Masters/32K_Deliverables',
    lastSyncedAt: '2m ago',
    syncedFilesCount: 48,
    bandwidthMbps: 840,
    status: 'synced',
  },
  {
    id: 'gdrive',
    name: 'Google Drive Workspace Shared Drive',
    providerLabel: 'Google Drive API v3 (Zero-Copy)',
    connected: true,
    autoSyncMasters: true,
    syncFolder: 'drive://Cinema_NLE_Production_Vault/2026_Renders',
    lastSyncedAt: '5m ago',
    syncedFilesCount: 64,
    bandwidthMbps: 920,
    status: 'synced',
  },
];

export const INITIAL_E2EE_CONFIG: E2eeSecurityConfig = {
  enabled: true,
  cipherSuite: 'AES-256-GCM + X25519',
  keyRotationDays: 30,
  keyFingerprint: 'SHA256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b',
  hardwareHsmBacked: true,
};

/**
 * Generates and downloads a Final Cut Pro / Premiere compatible NLE XML (.xml) sequence file
 */
export function exportNleTimelineXml(projectTitle: string, fps = 60, width = 3840, height = 2160): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="5">
  <sequence id="seq-memeforge-cinema-nle">
    <name>${projectTitle}</name>
    <duration>${fps * 10}</duration>
    <rate>
      <timebase>${fps}</timebase>
      <ntsc>FALSE</ntsc>
    </rate>
    <timecode>
      <rate><timebase>${fps}</timebase></rate>
      <string>00:00:00:00</string>
      <frame>0</frame>
      <displayformat>NDF</displayformat>
    </timecode>
    <media>
      <video>
        <format>
          <samplecharacteristics>
            <width>${width}</width>
            <height>${height}</height>
            <pixelaspectratio>square</pixelaspectratio>
            <colordepth>32</colordepth>
            <colorspace>ACES 2.0 AP0</colorspace>
          </samplecharacteristics>
        </format>
        <track>
          <clipitem id="clip-v1-master">
            <name>ARRI_32K_Omnimax_Master_Plate.exr</name>
            <start>0</start>
            <end>${fps * 6}</end>
            <in>0</in>
            <out>${fps * 6}</out>
          </clipitem>
          <clipitem id="clip-v1-optical-flow">
            <name>Phantom_1000FPS_Optical_Flow_Plate.mov</name>
            <start>${fps * 6}</start>
            <end>${fps * 10}</end>
            <in>0</in>
            <out>${fps * 4}</out>
          </clipitem>
        </track>
      </video>
      <audio>
        <format>
          <samplecharacteristics>
            <depth>32</depth>
            <samplerate>192000</samplerate>
          </samplecharacteristics>
        </format>
        <track>
          <clipitem id="clip-a1-atmos">
            <name>Fairlight_192kHz_Dolby_Atmos_7_1_4_Master.wav</name>
            <start>0</start>
            <end>${fps * 10}</end>
          </clipitem>
        </track>
      </audio>
    </media>
  </sequence>
</xmeml>`;

  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  triggerBrowserDownload(blob, `${projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_nle_sequence.xml`);
  return xml;
}

/**
 * Generates and downloads a CMX 3600 Edit Decision List (.edl) file
 */
export function exportCmx3600Edl(projectTitle: string): string {
  const edl = [
    `TITLE: ${projectTitle.toUpperCase()}`,
    `FCM: NON-DROP FRAME`,
    ``,
    `001  AX       V     C        00:00:00:00 00:00:06:00 00:00:00:00 00:00:06:00`,
    `* FROM CLIP NAME: ARRI_32K_OMNIMAX_PLATE_CAM_A_1000FPS.EXR`,
    `* COLOR SPACE: ACES 2.0 AP0 (32-BIT FLOAT)`,
    ``,
    `002  AX       V     C        00:00:00:00 00:00:04:00 00:00:06:00 00:00:10:00`,
    `* FROM CLIP NAME: PHANTOM_1000FPS_OPTICAL_FLOW_CAM_C.MOV`,
    `* LUT APPLIED: KODAK_VISION3_2383_DCI_P3.CUBE`,
    ``,
    `003  AX       AA/V  C        00:00:00:00 00:00:10:00 00:00:00:00 00:00:10:00`,
    `* FROM CLIP NAME: FAIRLIGHT_192KHZ_32FLOAT_ATMOS_BED.WAV`,
    `* AUDIO BUS: 7.1.4 DOLBY ATMOS + SIDE-CHAIN DUCKING`,
  ].join('\n');

  const blob = new Blob([edl], { type: 'text/plain;charset=utf-8' });
  triggerBrowserDownload(blob, `${projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_cmx3600.edl`);
  return edl;
}
