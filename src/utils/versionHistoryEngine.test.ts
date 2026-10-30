import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VersionSnapshot } from '../types/meme';
import {
  canUndoHistory,
  canRedoHistory,
  pushVersionSnapshot,
  stepUndoHistory,
  stepRedoHistory,
} from './versionHistoryEngine';

const createInitialHistory = (): VersionSnapshot[] => [
  {
    id: 'v_init',
    tag: 'v1.0.0-init',
    timestamp: '10:00 AM',
    author: 'You (Creator)',
    role: 'Owner',
    note: 'Loaded Drake Hotline Bling template',
    memeState: {
      templateId: 'drake',
      imageSrc: 'data:image/svg+xml;utf8,<svg></svg>',
      textLayers: [
        {
          id: 'top_1',
          text: 'INITIAL TOP',
          x: 50,
          y: 12,
          fontSize: 44,
          fontFamily: 'Impact',
          textColor: '#ffffff',
          outlineColor: '#000000',
          outlineWidth: 4,
          backgroundColor: 'transparent',
          textAlign: 'center',
          isUppercase: true,
          isBold: true,
          shadow: true,
          rotation: 0,
        },
      ],
      stickers: [],
      filter: 'none',
      aspectRatio: '1:1',
    },
  },
];

describe('versionHistoryEngine (Undo / Redo State Management)', () => {
  it('disables undo and redo when only the initial snapshot exists', () => {
    const history = createInitialHistory();
    assert.equal(canUndoHistory(history, 0), false);
    assert.equal(canRedoHistory(history, 0), false);
  });

  it('pushes new snapshots at index 0 and enables undo/redo traversal', () => {
    const initial = createInitialHistory();
    const step1 = pushVersionSnapshot(initial, 0, {
      note: 'Applied filter: cyberpunk',
      memeState: {
        ...initial[0].memeState,
        filter: 'cyberpunk',
      },
    });

    assert.equal(step1.versionHistory.length, 2);
    assert.equal(step1.historyIndex, 0);
    assert.equal(step1.versionHistory[0].note, 'Applied filter: cyberpunk');
    assert.equal(canUndoHistory(step1.versionHistory, step1.historyIndex), true);
    assert.equal(canRedoHistory(step1.versionHistory, step1.historyIndex), false);

    // Step backward (Undo)
    const undone = stepUndoHistory(step1.versionHistory, step1.historyIndex);
    assert.equal(undone.historyIndex, 1);
    assert.equal(undone.targetSnapshot?.id, 'v_init');
    assert.equal(undone.targetSnapshot?.memeState.filter, 'none');
    assert.equal(canUndoHistory(step1.versionHistory, undone.historyIndex), false);
    assert.equal(canRedoHistory(step1.versionHistory, undone.historyIndex), true);

    // Step forward (Redo)
    const redone = stepRedoHistory(step1.versionHistory, undone.historyIndex);
    assert.equal(redone.historyIndex, 0);
    assert.equal(redone.targetSnapshot?.memeState.filter, 'cyberpunk');
  });

  it('truncates future redo branch when a new edit occurs after undo', () => {
    const initial = createInitialHistory();
    const edit1 = pushVersionSnapshot(initial, 0, {
      note: 'Added text layer',
      memeState: { ...initial[0].memeState, filter: 'vintage' },
    });
    const edit2 = pushVersionSnapshot(edit1.versionHistory, edit1.historyIndex, {
      note: 'Changed aspect ratio to 16:9',
      memeState: { ...edit1.versionHistory[0].memeState, aspectRatio: '16:9' },
    });

    assert.equal(edit2.versionHistory.length, 3);

    // Undo once to edit1 (index 1)
    const undo1 = stepUndoHistory(edit2.versionHistory, 0);
    assert.equal(undo1.historyIndex, 1);
    assert.equal(undo1.targetSnapshot?.note, 'Added text layer');

    // Perform a new edit while at index 1 -> should discard edit2 and branch from edit1
    const branched = pushVersionSnapshot(edit2.versionHistory, undo1.historyIndex, {
      note: 'Applied filter: deep_fried',
      memeState: { ...undo1.targetSnapshot!.memeState, filter: 'deep_fried' },
    });

    assert.equal(branched.historyIndex, 0);
    assert.equal(branched.versionHistory.length, 3);
    assert.equal(branched.versionHistory[0].note, 'Applied filter: deep_fried');
    assert.equal(branched.versionHistory[1].note, 'Added text layer');
    assert.equal(branched.versionHistory[2].id, 'v_init');
    assert.equal(canRedoHistory(branched.versionHistory, branched.historyIndex), false);
  });
});
