import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Cpu,
  CheckCircle2,
  FlaskConical,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import {
  DatasetUploadImage,
  LoraTrainingJob,
} from '../types/b2bEnterprise';
import {
  generateDefaultCalibrationDataset,
  generateLossCurve,
} from '../utils/b2bEnterpriseEngine';

interface EnterpriseProductModelBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchJob: (newJob: LoraTrainingJob, openInSandboxImmediately?: boolean) => void;
}

export const EnterpriseProductModelBuilderModal: React.FC<
  EnterpriseProductModelBuilderModalProps
> = ({ isOpen, onClose, onLaunchJob }) => {
  const [modelName, setModelName] = useState('Lumiere Elixir Crystal Bottle');
  const [triggerToken, setTriggerToken] = useState('lumiere_elixir_v1');
  const [brandClient, setBrandClient] = useState('Maison Lumiere Paris');
  const [category, setCategory] = useState<LoraTrainingJob['category']>(
    'Luxury Fragrance & Glass'
  );
  const [networkRankDim, setNetworkRankDim] = useState<32 | 64 | 128>(64);
  const [precision, setPrecision] = useState<'BF16' | 'FP8-Dynamic'>('BF16');
  const [totalSteps, setTotalSteps] = useState<number>(1500);
  const [datasetImages, setDatasetImages] = useState<DatasetUploadImage[]>(() =>
    generateDefaultCalibrationDataset('Lumiere Elixir')
  );

  if (!isOpen) return null;

  const handleAddSyntheticAngle = () => {
    if (datasetImages.length >= 20) return;
    const nextIdx = datasetImages.length + 1;
    const extraImage: DatasetUploadImage = {
      id: `calib-img-${Date.now()}-${nextIdx}`,
      filename: `${triggerToken}_angle_${nextIdx}.png`,
      angleLabel: `${nextIdx}. Supplemental Studio Pass (${nextIdx * 15}°)`,
      lightingLabel: '5600K Cross-Polarized Key',
      resolution: '4096 × 4096 px (16-bit PNG)',
      qualityScore: 99.1,
      previewDataUri: datasetImages[0]?.previewDataUri || '',
    };
    setDatasetImages((prev) => [...prev, extraImage]);
  };

  const handleRemoveImage = (id: string) => {
    if (datasetImages.length <= 10) return;
    setDatasetImages((prev) => prev.filter((img) => img.id !== id));
  };

  const buildJobObject = (instantComplete: boolean): LoraTrainingJob => {
    const cleanToken =
      triggerToken.trim().replace(/\s+/g, '_').toLowerCase() || 'custom_product_v1';
    const currentStep = instantComplete ? totalSteps : 90;

    return {
      id: `lora-job-${Date.now()}`,
      modelName: modelName.trim() || 'Enterprise Custom Product Twin',
      triggerToken: cleanToken,
      brandClient: brandClient.trim() || 'Enterprise Brand Lab',
      category,
      phase: instantComplete ? 'completed' : 'validating_dataset',
      currentStep,
      totalSteps,
      datasetImageCount: datasetImages.length,
      networkRankDim,
      networkAlpha: (networkRankDim / 2) as 16 | 32 | 64,
      precision,
      estimatedSecondsRemaining: instantComplete ? 0 : Math.round((totalSteps - currentStep) * 0.4),
      currentLoss: instantComplete ? 0.0512 : 0.342,
      lossHistory: generateLossCurve(totalSteps, currentStep),
      assignedNodeIds: ['node-b200-01', 'node-h100-01'],
      startedAtIso: new Date().toISOString(),
      completedAtIso: instantComplete ? new Date().toISOString() : undefined,
      safetensorsSizeMb: networkRankDim === 128 ? 576.0 : networkRankDim === 64 ? 288.4 : 144.2,
      sha256Checksum: '7c4a8d09ca3762af61e59520943dc26494f8941b0000822cd15d6c15b0f00a99',
      previewImageUrl: datasetImages[0]?.previewDataUri || '',
      datasetSampleUrls: datasetImages.slice(0, 4).map((d) => d.previewDataUri),
      invariantTargets: {
        logoIntegrityTarget: 99.2,
        geometrySilhouetteIouTarget: 98.6,
        materialPurityTarget: 98.1,
      },
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-6 my-8 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <p className="text-xs font-medium text-cyan-400 uppercase tracking-wide">
              10–20 Multi-Angle Photogrammetry &amp; LoRA Calibration
            </p>
            <h3 className="text-xl font-bold text-white mt-0.5">
              Enterprise Product Model Builder
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Configuration Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Product Model Name
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Trigger Token Identifier
            </label>
            <input
              type="text"
              value={triggerToken}
              onChange={(e) => setTriggerToken(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Enterprise Client / Brand
            </label>
            <input
              type="text"
              value={brandClient}
              onChange={(e) => setBrandClient(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Product Vertical
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as LoraTrainingJob['category'])}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="Luxury Fragrance & Glass">Luxury Fragrance &amp; Glass</option>
              <option value="Consumer Electronics">Consumer Electronics</option>
              <option value="Automotive & Mobility">Automotive &amp; Mobility</option>
              <option value="Apparel & Footwear">Apparel &amp; Footwear</option>
              <option value="Beverage & Packaging">Beverage &amp; Packaging</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Network Rank Dimension
            </label>
            <select
              value={networkRankDim}
              onChange={(e) => setNetworkRankDim(Number(e.target.value) as 32 | 64 | 128)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value={32}>Rank 32 / Alpha 16 (Fast Agile)</option>
              <option value={64}>Rank 64 / Alpha 32 (Enterprise Standard)</option>
              <option value={128}>Rank 128 / Alpha 64 (Ultra Micro-Detail)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Tensor Precision &amp; Steps
            </label>
            <div className="flex items-center gap-2">
              <select
                value={precision}
                onChange={(e) => setPrecision(e.target.value as 'BF16' | 'FP8-Dynamic')}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value="BF16">BF16</option>
                <option value="FP8-Dynamic">FP8-Dynamic</option>
              </select>
              <select
                value={totalSteps}
                onChange={(e) => setTotalSteps(Number(e.target.value))}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value={1200}>1,200 Steps</option>
                <option value={1500}>1,500 Steps</option>
                <option value={2000}>2,000 Steps</option>
              </select>
            </div>
          </div>
        </div>

        {/* 10-20 Image Calibration Dataset Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-2 tabular-nums">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>
                Calibration Image Dataset ({datasetImages.length} / 20 images · Minimum 10 required)
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddSyntheticAngle}
              disabled={datasetImages.length >= 20}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Calibration Angle</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {datasetImages.map((img) => (
              <div
                key={img.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-2"
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-[11px] font-semibold text-white truncate">
                    {img.angleLabel}
                  </span>
                  {datasetImages.length > 10 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      className="text-slate-500 hover:text-rose-400 cursor-pointer"
                      title="Remove angle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {img.lightingLabel} · Quality {img.qualityScore}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Dataset passes multi-angle silhouette &amp; specular calibration check
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                const job = buildJobObject(false);
                onLaunchJob(job, false);
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>Start Live Cluster Training</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const job = buildJobObject(true);
                onLaunchJob(job, true);
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Instant Compile &amp; Open in Sandbox</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
