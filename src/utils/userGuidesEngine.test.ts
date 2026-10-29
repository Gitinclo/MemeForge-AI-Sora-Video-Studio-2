import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  USER_GUIDE_SECTIONS,
  USER_GUIDE_SHORTCUTS,
  USER_GUIDE_FAQS,
  getDefaultUserGuideProgress,
  toggleGuideStepCompletion,
  toggleAllStepsInGuide,
  calculateGuideProgressSummary,
  calculateSingleGuideProgress,
  searchUserGuides,
} from './userGuidesEngine';

describe('userGuidesEngine', () => {
  it('provides comprehensive step-by-step guides across all studio modules', () => {
    assert.ok(USER_GUIDE_SECTIONS.length >= 7);
    assert.ok(USER_GUIDE_SHORTCUTS.length >= 6);
    assert.ok(USER_GUIDE_FAQS.length >= 5);

    for (const section of USER_GUIDE_SECTIONS) {
      assert.ok(section.steps.length > 0);
      for (const step of section.steps) {
        assert.ok(step.whereToClick.length > 3);
        assert.ok(step.description.length > 10);
        assert.ok(step.expectedOutcome.length > 10);
      }
    }
  });

  it('toggles individual step completion and calculates progress accurately', () => {
    const initial = getDefaultUserGuideProgress();
    assert.deepEqual(initial.completedStepIds, []);

    const afterOne = toggleGuideStepCompletion(initial.completedStepIds, 'qs-step-1');
    assert.ok(afterOne.includes('qs-step-1'));

    const summaryAfterOne = calculateGuideProgressSummary(afterOne);
    assert.equal(summaryAfterOne.completedSteps, 1);
    assert.ok(summaryAfterOne.totalSteps > 15);
    assert.ok(summaryAfterOne.percentComplete > 0);

    const afterToggleOff = toggleGuideStepCompletion(afterOne, 'qs-step-1');
    assert.deepEqual(afterToggleOff, []);
  });

  it('toggles all steps in a guide chapter and updates chapter completion counts', () => {
    const firstGuide = USER_GUIDE_SECTIONS[0];
    const completedAllFirst = toggleAllStepsInGuide([], firstGuide.id);
    assert.equal(completedAllFirst.length, firstGuide.steps.length);

    const singleProgress = calculateSingleGuideProgress(firstGuide, completedAllFirst);
    assert.equal(singleProgress.percent, 100);
    assert.equal(singleProgress.completed, firstGuide.steps.length);

    const summary = calculateGuideProgressSummary(completedAllFirst);
    assert.equal(summary.completedChaptersCount, 1);

    const uncompletedFirst = toggleAllStepsInGuide(completedAllFirst, firstGuide.id);
    assert.equal(uncompletedFirst.length, 0);
  });

  it('searches across guide titles, step instructions, shortcuts, and FAQs', () => {
    const airhornResults = searchUserGuides('Airhorn');
    assert.ok(airhornResults.matchingSections.some((s) => s.id === 'm1-memeforge-advanced'));
    assert.ok(airhornResults.matchingFaqs.some((f) => f.id === 'faq-3'));

    const shortcutResults = searchUserGuides('Alt+2');
    assert.ok(shortcutResults.matchingSections.some((s) => s.id === 'm2-leo-video-studio'));

    const emptyResults = searchUserGuides('xyznonexistentquery999');
    assert.equal(emptyResults.matchingSections.length, 0);
    assert.equal(emptyResults.matchingShortcuts.length, 0);
    assert.equal(emptyResults.matchingFaqs.length, 0);
  });
});
