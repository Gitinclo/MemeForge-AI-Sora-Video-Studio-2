import { VersionSnapshot } from '../types/meme';

export interface PushSnapshotInput {
  note: string;
  author?: string;
  role?: string;
  timestamp?: string;
  memeState: VersionSnapshot['memeState'];
}

export interface PushSnapshotResult {
  versionHistory: VersionSnapshot[];
  historyIndex: number;
  snapshot: VersionSnapshot;
}

export interface StepHistoryResult {
  historyIndex: number;
  targetSnapshot: VersionSnapshot | null;
}

/**
 * Checks whether stepping backward (Undo) is available in the newest-first versionHistory list.
 * Index 0 is the latest snapshot; index (versionHistory.length - 1) is the oldest initial snapshot.
 */
export function canUndoHistory(
  versionHistory: VersionSnapshot[],
  historyIndex: number
): boolean {
  return versionHistory.length > 1 && historyIndex < versionHistory.length - 1;
}

/**
 * Checks whether stepping forward (Redo) is available in the newest-first versionHistory list.
 * Index 0 is the latest snapshot; when historyIndex > 0, the user has stepped back in history.
 */
export function canRedoHistory(
  versionHistory: VersionSnapshot[],
  historyIndex: number
): boolean {
  return versionHistory.length > 1 && historyIndex > 0;
}

/**
 * Deep-clones memeState arrays so mutations to live editor state never mutate stored snapshots.
 */
export function cloneMemeState(
  memeState: VersionSnapshot['memeState']
): VersionSnapshot['memeState'] {
  return {
    templateId: memeState.templateId,
    imageSrc: memeState.imageSrc,
    textLayers: JSON.parse(JSON.stringify(memeState.textLayers || [])),
    stickers: memeState.stickers
      ? JSON.parse(JSON.stringify(memeState.stickers))
      : undefined,
    filter: memeState.filter,
    aspectRatio: memeState.aspectRatio,
  };
}

/**
 * Records a new VersionSnapshot at the front (index 0) of `versionHistory`.
 * If the user had previously undone steps (`historyIndex > 0`), discards the undone future branch
 * (`versionHistory.slice(historyIndex)`) before prepending the new edit snapshot and resetting `historyIndex` to 0.
 */
export function pushVersionSnapshot(
  versionHistory: VersionSnapshot[],
  historyIndex: number,
  input: PushSnapshotInput
): PushSnapshotResult {
  const safeIndex = Math.max(0, Math.min(historyIndex, Math.max(0, versionHistory.length - 1)));
  const activeBranch = safeIndex > 0 ? versionHistory.slice(safeIndex) : versionHistory;

  const time =
    input.timestamp ||
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newSnap: VersionSnapshot = {
    id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    tag: `v1.${activeBranch.length}.0`,
    timestamp: time,
    author: input.author || 'You (Creator)',
    role: input.role || 'Meme Lord',
    note: input.note,
    memeState: cloneMemeState(input.memeState),
  };

  return {
    versionHistory: [newSnap, ...activeBranch],
    historyIndex: 0,
    snapshot: newSnap,
  };
}

/**
 * Steps backward one edit in `versionHistory` (Undo: increments `historyIndex` toward older snapshots).
 */
export function stepUndoHistory(
  versionHistory: VersionSnapshot[],
  historyIndex: number
): StepHistoryResult {
  if (!canUndoHistory(versionHistory, historyIndex)) {
    return { historyIndex, targetSnapshot: null };
  }
  const nextIndex = historyIndex + 1;
  return {
    historyIndex: nextIndex,
    targetSnapshot: versionHistory[nextIndex] || null,
  };
}

/**
 * Steps forward one edit in `versionHistory` (Redo: decrements `historyIndex` toward newer snapshots).
 */
export function stepRedoHistory(
  versionHistory: VersionSnapshot[],
  historyIndex: number
): StepHistoryResult {
  if (!canRedoHistory(versionHistory, historyIndex)) {
    return { historyIndex, targetSnapshot: null };
  }
  const nextIndex = historyIndex - 1;
  return {
    historyIndex: nextIndex,
    targetSnapshot: versionHistory[nextIndex] || null,
  };
}
