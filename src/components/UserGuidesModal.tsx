import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  BookOpen,
  Search,
  CheckCircle2,
  Circle,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  Keyboard,
  HelpCircle,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Compass,
} from 'lucide-react';
import {
  USER_GUIDE_SECTIONS,
  GuideSection,
  GuideDeepLinkTarget,
  UserGuideProgressState,
  loadUserGuideProgress,
  saveUserGuideProgress,
  getDefaultUserGuideProgress,
  toggleGuideStepCompletion,
  toggleAllStepsInGuide,
  calculateGuideProgressSummary,
  calculateSingleGuideProgress,
  searchUserGuides,
} from '../utils/userGuidesEngine';

export interface UserGuidesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteDeepLink: (target: GuideDeepLinkTarget) => void;
  initialGuideId?: string;
}

export const UserGuidesModal: React.FC<UserGuidesModalProps> = ({
  isOpen,
  onClose,
  onExecuteDeepLink,
  initialGuideId,
}) => {
  const [progressState, setProgressState] = useState<UserGuideProgressState>(() =>
    loadUserGuideProgress()
  );
  const [activeView, setActiveView] = useState<'guides' | 'shortcuts' | 'faq'>('guides');
  const [selectedGuideId, setSelectedGuideId] = useState<string>(
    initialGuideId || progressState.lastActiveGuideId || USER_GUIDE_SECTIONS[0].id
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  useEffect(() => {
    if (initialGuideId && USER_GUIDE_SECTIONS.some((g) => g.id === initialGuideId)) {
      setSelectedGuideId(initialGuideId);
      setActiveView('guides');
    }
  }, [initialGuideId]);

  useEffect(() => {
    saveUserGuideProgress(progressState);
  }, [progressState]);

  const overallSummary = useMemo(
    () => calculateGuideProgressSummary(progressState.completedStepIds),
    [progressState.completedStepIds]
  );

  const searchResults = useMemo(
    () => searchUserGuides(searchQuery, 'all'),
    [searchQuery]
  );

  const activeGuide: GuideSection = useMemo(() => {
    return (
      USER_GUIDE_SECTIONS.find((sec) => sec.id === selectedGuideId) ||
      USER_GUIDE_SECTIONS[0]
    );
  }, [selectedGuideId]);

  const activeGuideProgress = useMemo(
    () => calculateSingleGuideProgress(activeGuide, progressState.completedStepIds),
    [activeGuide, progressState.completedStepIds]
  );

  const currentGuideIndex = useMemo(
    () => USER_GUIDE_SECTIONS.findIndex((sec) => sec.id === activeGuide.id),
    [activeGuide.id]
  );

  if (!isOpen) return null;

  const handleSelectGuide = (guideId: string) => {
    setSelectedGuideId(guideId);
    setActiveView('guides');
    setProgressState((prev) => ({
      ...prev,
      lastActiveGuideId: guideId,
    }));
  };

  const handleToggleStep = (stepId: string) => {
    setProgressState((prev) => ({
      ...prev,
      completedStepIds: toggleGuideStepCompletion(prev.completedStepIds, stepId),
    }));
  };

  const handleToggleAllInActiveGuide = () => {
    setProgressState((prev) => ({
      ...prev,
      completedStepIds: toggleAllStepsInGuide(prev.completedStepIds, activeGuide.id),
    }));
  };

  const handleToggleBookmarkGuide = (guideId: string) => {
    setProgressState((prev) => {
      const exists = prev.bookmarkedGuideIds.includes(guideId);
      return {
        ...prev,
        bookmarkedGuideIds: exists
          ? prev.bookmarkedGuideIds.filter((id) => id !== guideId)
          : [...prev.bookmarkedGuideIds, guideId],
      };
    });
  };

  const handleResetAllProgress = () => {
    const fresh = getDefaultUserGuideProgress();
    setProgressState(fresh);
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  const handleDeepLinkClick = (target: GuideDeepLinkTarget) => {
    onExecuteDeepLink(target);
    onClose();
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-guides-modal-title"
    >
      <div className="w-full max-w-6xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Modal Header */}
        <div className="px-4 sm:px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="user-guides-modal-title"
                className="text-base sm:text-lg font-bold text-white tracking-tight truncate"
              >
                How to Use MemeForge AI Studio — Interactive User Guide
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                <span>7 Chapters</span>
                <span aria-hidden="true">·</span>
                <span>
                  {overallSummary.completedSteps}/{overallSummary.totalSteps} Steps Completed (
                  {overallSummary.percentComplete}%)
                </span>
                <span aria-hidden="true">·</span>
                <span>Shortcut: Alt+G</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {overallSummary.completedSteps > 0 && (
              <button
                type="button"
                onClick={handleResetAllProgress}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                title="Reset all completed checklist steps"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset Checklist</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              aria-label="Close User Guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Mode Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900/50 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Ask "How do I..." (e.g. download meme, add audio, Magic Caption, rollback, YouTube, Sora 2)...'
              className="w-full pl-10 pr-20 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500/60 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Segmented View Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveView('guides');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'guides' && !isSearching
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Step-by-Step Guides</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView('shortcuts');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'shortcuts' && !isSearching
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Shortcuts</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView('faq');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'faq' && !isSearching
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Common Questions (FAQ)</span>
            </button>
          </div>
        </div>

        {/* Main Two-Pane Body */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Left Navigation Sidebar: Guide Chapters & Mastery Progress */}
          <aside className="w-full lg:w-72 bg-slate-900/40 border-b lg:border-b-0 lg:border-r border-slate-800 p-4 overflow-y-auto shrink-0 space-y-4">
            {/* Overall Progress Block */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Your Onboarding Progress</span>
                <span className="font-mono tabular-nums font-bold text-amber-400">
                  {overallSummary.percentComplete}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-200"
                  style={{ width: `${overallSummary.percentComplete}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                <span>
                  {overallSummary.completedSteps} of {overallSummary.totalSteps} steps done
                </span>
                <span>
                  {overallSummary.completedChaptersCount}/{overallSummary.totalChaptersCount} chapters
                </span>
              </div>
            </div>

            {/* Chapter List */}
            <div className="space-y-1">
              <div className="px-2 pb-1 text-xs font-semibold text-slate-400">
                How to Use the App (Chapters)
              </div>
              {USER_GUIDE_SECTIONS.map((sec) => {
                const secProg = calculateSingleGuideProgress(sec, progressState.completedStepIds);
                const isSelected = activeView === 'guides' && !isSearching && activeGuide.id === sec.id;
                const isBookmarked = progressState.bookmarkedGuideIds.includes(sec.id);

                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      handleSelectGuide(sec.id);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-colors flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-slate-900 border-amber-500/50 text-white'
                        : 'bg-transparent border-transparent hover:bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <span className="font-mono tabular-nums text-amber-400 shrink-0">
                          {sec.chapterNumber}.
                        </span>
                        <span className="truncate">{sec.title.replace(/^How to Use |^Quick Start: /, '')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono tabular-nums">
                        <span>
                          {secProg.completed}/{secProg.total} steps
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{sec.estimatedMinutes} min</span>
                        {isBookmarked && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-400">Saved</span>
                          </>
                        )}
                      </div>
                    </div>
                    {secProg.percent === 100 && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Viewport: Active Guide / Search Results / Shortcuts / FAQ */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            {/* CASE 1: SEARCH RESULTS VIEW */}
            {isSearching ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Search Results for &ldquo;{searchQuery}&rdquo;
                    </h3>
                    <p className="text-xs text-slate-400 font-mono tabular-nums">
                      {searchResults.matchingSections.length} guides ·{' '}
                      {searchResults.matchingFaqs.length} FAQ answers ·{' '}
                      {searchResults.matchingShortcuts.length} shortcuts
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-800"
                  >
                    Clear Search
                  </button>
                </div>

                {searchResults.matchingSections.length === 0 &&
                  searchResults.matchingFaqs.length === 0 &&
                  searchResults.matchingShortcuts.length === 0 && (
                    <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
                      <p className="text-sm font-semibold text-slate-200">
                        No guides or answers matched &ldquo;{searchQuery}&rdquo;.
                      </p>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Try searching for everyday tasks like &ldquo;download&rdquo;, &ldquo;text&rdquo;,
                        &ldquo;audio&rdquo;, &ldquo;Magic Caption&rdquo;, &ldquo;video&rdquo;, or
                        &ldquo;YouTube&rdquo;.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
                      >
                        Show All How-To Guides
                      </button>
                    </div>
                  )}

                {searchResults.matchingSections.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400">Matching Step-by-Step Guides</h4>
                    {searchResults.matchingSections.map((sec) => (
                      <div
                        key={sec.id}
                        className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-white">
                            {sec.chapterNumber}. {sec.title}
                          </div>
                          <p className="text-xs text-slate-400">{sec.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery('');
                              handleSelectGuide(sec.id);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold whitespace-nowrap"
                          >
                            Read Steps
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeepLinkClick(sec.primaryDeepLink)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 whitespace-nowrap"
                          >
                            <span>{sec.primaryDeepLinkLabel}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.matchingFaqs.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400">Matching Common Questions</h4>
                    {searchResults.matchingFaqs.map((faq) => (
                      <div
                        key={faq.id}
                        className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2"
                      >
                        <div className="text-sm font-bold text-white">{faq.question}</div>
                        <p className="text-xs text-slate-300 leading-relaxed">{faq.answer}</p>
                        {faq.deepLinkAction && faq.deepLinkLabel && (
                          <button
                            type="button"
                            onClick={() => handleDeepLinkClick(faq.deepLinkAction!)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold inline-flex items-center gap-1.5"
                          >
                            <span>{faq.deepLinkLabel}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeView === 'shortcuts' ? (
              /* CASE 2: KEYBOARD SHORTCUTS MATRIX */
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-white">
                    Keyboard Shortcuts &amp; Quick Controls
                  </h3>
                  <p className="text-xs text-slate-400">
                    Switch studio modules, paste clipboard images, and open this guide from anywhere.
                  </p>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-300">
                        <th className="py-3 px-4">Shortcut Keys</th>
                        <th className="py-3 px-4">What It Does</th>
                        <th className="py-3 px-4 hidden sm:table-cell">Where It Works</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-xs">
                      {searchResults.matchingShortcuts.map((sc) => (
                        <tr key={sc.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              {sc.keys.map((k, idx) => (
                                <React.Fragment key={k}>
                                  <kbd className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs">
                                    {k}
                                  </kbd>
                                  {idx < sc.keys.length - 1 && (
                                    <span className="text-slate-500">+</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-200 font-medium">{sc.action}</td>
                          <td className="py-3 px-4 text-slate-400 hidden sm:table-cell">
                            {sc.context}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {sc.deepLinkAction ? (
                              <button
                                type="button"
                                onClick={() => handleDeepLinkClick(sc.deepLinkAction!)}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs font-semibold inline-flex items-center gap-1"
                              >
                                <span>Open</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-slate-500 font-mono">Active</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeView === 'faq' ? (
              /* CASE 3: COMMON QUESTIONS & TROUBLESHOOTING FAQ */
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-white">
                    Common Questions &amp; Troubleshooting (&ldquo;How Do I...?&rdquo;)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Direct answers for editing text, exporting clean images/video, restoring versions, and unlocking templates.
                  </p>
                </div>

                <div className="space-y-3">
                  {searchResults.matchingFaqs.map((faq, idx) => (
                    <div
                      key={faq.id}
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-bold text-white">
                          <span className="font-mono tabular-nums text-amber-400 mr-2">
                            0{idx + 1}.
                          </span>
                          {faq.question}
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {faq.answer}
                      </p>
                      {faq.deepLinkAction && faq.deepLinkLabel && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleDeepLinkClick(faq.deepLinkAction!)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                          >
                            <span>{faq.deepLinkLabel}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* CASE 4: STEP-BY-STEP CHAPTER GUIDE VIEW */
              <div className="space-y-6">
                {/* Chapter Header */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                        <span className="text-amber-400 font-semibold">
                          Chapter {activeGuide.chapterNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{activeGuide.steps.length} Steps</span>
                        <span aria-hidden="true">·</span>
                        <span>{activeGuide.estimatedMinutes} min read</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {activeGuideProgress.completed}/{activeGuideProgress.total} Completed (
                          {activeGuideProgress.percent}%)
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        {activeGuide.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300">{activeGuide.subtitle}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleBookmarkGuide(activeGuide.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                          progressState.bookmarkedGuideIds.includes(activeGuide.id)
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>
                          {progressState.bookmarkedGuideIds.includes(activeGuide.id)
                            ? 'Bookmarked'
                            : 'Save Guide'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleAllInActiveGuide}
                        className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {activeGuideProgress.percent === 100
                            ? 'Unmark Chapter'
                            : 'Mark Chapter Complete'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeepLinkClick(activeGuide.primaryDeepLink)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>{activeGuide.primaryDeepLinkLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
                    {activeGuide.overview}
                  </p>
                  <div className="text-xs text-slate-400">
                    <strong className="text-slate-200">Best for:</strong> {activeGuide.whoIsItFor}
                  </div>
                </div>

                {/* Numbered Step-by-Step Instructions ("Where to Click -> What to Do -> Expected Result") */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">
                      Step-by-Step Instructions (Click the circle as you complete each step)
                    </h4>
                  </div>

                  {activeGuide.steps.map((step) => {
                    const isCompleted = progressState.completedStepIds.includes(step.id);
                    return (
                      <div
                        key={step.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
                          isCompleted
                            ? 'bg-emerald-950/15 border-emerald-500/30'
                            : 'bg-slate-900/50 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStep(step.id)}
                            className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                            aria-label={`Mark Step ${step.stepNumber} complete`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h5 className="text-sm sm:text-base font-bold text-white">
                                <span className="font-mono tabular-nums text-amber-400 mr-2">
                                  Step 0{step.stepNumber}.
                                </span>
                                {step.title}
                              </h5>
                              {step.shortcutHint && (
                                <kbd className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-amber-300 font-mono text-xs tabular-nums shrink-0">
                                  Shortcut: {step.shortcutHint}
                                </kbd>
                              )}
                            </div>

                            {/* Structured Where to Click / What to Do / What Happens */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                                <div className="text-[11px] font-semibold text-amber-400">
                                  1. Where to Click in the App
                                </div>
                                <div className="text-xs text-slate-200 font-medium leading-snug">
                                  {step.whereToClick}
                                </div>
                              </div>

                              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                                <div className="text-[11px] font-semibold text-cyan-400">
                                  2. What to Do
                                </div>
                                <div className="text-xs text-slate-300 leading-relaxed">
                                  {step.description}
                                </div>
                              </div>

                              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                                <div className="text-[11px] font-semibold text-emerald-400">
                                  3. What Happens Next
                                </div>
                                <div className="text-xs text-slate-300 leading-relaxed">
                                  {step.expectedOutcome}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleToggleStep(step.id)}
                                className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
                              >
                                {isCompleted ? 'Completed (Click to undo)' : 'Mark step as done'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeepLinkClick(step.deepLinkAction)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 text-slate-100 hover:text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                              >
                                <span>Try This Step: {step.deepLinkLabel}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Copyable Sample Prompts / Commands (if available) */}
                {activeGuide.samplePrompts && activeGuide.samplePrompts.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-200">
                      Ready-to-Try Prompts &amp; Commands (Click to Copy)
                    </h4>
                    <div className="space-y-2">
                      {activeGuide.samplePrompts.map((sp) => (
                        <div
                          key={sp.id}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="text-xs font-semibold text-amber-300">
                              {sp.label} <span className="text-slate-500">·</span>{' '}
                              <span className="text-slate-400">{sp.targetModule}</span>
                            </div>
                            <div className="text-xs font-mono text-slate-200 break-words">
                              {sp.promptText}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyPrompt(sp.id, sp.promptText)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 shrink-0"
                          >
                            {copiedPromptId === sp.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pro Tips */}
                {activeGuide.proTips.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-amber-400">
                      Helpful Tips for This Module
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                      {activeGuide.proTips.map((tip, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Previous / Next Chapter Footer Navigation */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                  {currentGuideIndex > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectGuide(USER_GUIDE_SECTIONS[currentGuideIndex - 1].id)
                      }
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>
                        Prev: {USER_GUIDE_SECTIONS[currentGuideIndex - 1].chapterNumber}.{' '}
                        {USER_GUIDE_SECTIONS[currentGuideIndex - 1].title.slice(0, 28)}...
                      </span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentGuideIndex < USER_GUIDE_SECTIONS.length - 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectGuide(USER_GUIDE_SECTIONS[currentGuideIndex + 1].id)
                      }
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span>
                        Next: {USER_GUIDE_SECTIONS[currentGuideIndex + 1].chapterNumber}.{' '}
                        {USER_GUIDE_SECTIONS[currentGuideIndex + 1].title.slice(0, 28)}...
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveView('faq')}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span>View Common Questions (FAQ)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
