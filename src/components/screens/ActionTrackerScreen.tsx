import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Pushpin } from '../common/Pushpin';
import { RubberStamp } from '../common/RubberStamp';
import { WashiTape } from '../common/WashiTape';
import {
  CheckCircle2,
  Camera,
  Upload,
  ShieldCheck,
  AlertTriangle,
  Send,
  Users,
  Clock,
  Sparkles,
  Award,
  ArrowRight,
} from 'lucide-react';

export const ActionTrackerScreen: React.FC = () => {
  const {
    problems,
    selectedProblemId,
    selectedProblem,
    navigateTo,
    addProgressUpdate,
    resolveProblem,
    currentVolunteer,
  } = useApp();

  const [activeProblemId, setActiveProblemId] = useState<string>(
    selectedProblemId || problems.find((p) => p.status === 'IN_PROGRESS')?.id || problems[0]?.id || ''
  );

  useEffect(() => {
    if (selectedProblemId) {
      setActiveProblemId(selectedProblemId);
    }
  }, [selectedProblemId]);

  const activeProblem = problems.find((p) => p.id === activeProblemId) || problems[0];

  const [logDesc, setLogDesc] = useState('');
  const [logTag, setLogTag] = useState('FIELD ACTION');
  const [logPhotoUrl, setLogPhotoUrl] = useState('');

  const [customBeforePhotoUrl, setCustomBeforePhotoUrl] = useState('');
  const [solvePhotoUrl, setSolvePhotoUrl] = useState('');
  const [showAfterUrlInput, setShowAfterUrlInput] = useState(false);
  const [showBeforeUrlInput, setShowBeforeUrlInput] = useState(false);
  const [impactMetrics, setImpactMetrics] = useState('');
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Demo photos for quick field logging
  const demoFieldPhotos = [
    {
      label: 'Cones & Warning Tape (Before/Interim)',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNGVt-Gg5lV45t6cNNHyzGusRd0LDWDT-0CEFYf6nQM31t3_nLQb7nBoucN0Za8uu7icl-1I1jwHZGbOMVqJXiBEqQUOWpmfxkFbz1ykoqSDEiOdZNz2f63RONtTte-oVqr-bxWXor7rwUpUhlnur4IF4Z2sjsoG-1YKxqJzAwUV4VgwWJ6JGjSOMd39IlveCtXzm_t9BF2Ylv4kTAT9ji6H3U3DoBGpO1J8SnvNb_NWdCmCo1s0tM6g',
    },
    {
      label: 'Cleared Alley / Fixed (After)',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdPt6ktGSv5L8mO7Ik4PYP8nNgUP9uk9zPO-skOiVGyvH9E9dFwTbzVhOLghA9wROEA51dU6ZincrQVU8X99wlbnn5HyGpUMAResuxBBEOaefwV7m4RmX4rmmPl3tHrgUx9UQKRjzTcRMazHjK_xOTq9x0AyDc0Zee0sEa0vMmsohW2jRkemtgAjWFqKCtBSCTsW8f1ODKdqcshLl9SCRioZYTuszTc4UURz94MoRhr9s3SDjT7VeVHg',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'progress' | 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (target === 'progress') setLogPhotoUrl(result);
        if (target === 'before') setCustomBeforePhotoUrl(result);
        if (target === 'after') setSolvePhotoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const effectiveBeforePhoto =
    customBeforePhotoUrl ||
    activeProblem?.beforePhotoUrl ||
    activeProblem?.photoUrl ||
    activeProblem?.updates.find((u) => Boolean(u.photoUrl))?.photoUrl;

  const handleAddUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProblem || !logDesc.trim()) return;
    addProgressUpdate(activeProblem.id, {
      description: logDesc,
      photoUrl: logPhotoUrl || undefined,
      tag: logTag,
    });
    setLogDesc('');
    setLogPhotoUrl('');
  };

  const handleMarkSolved = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProblem) return;
    setResolveError(null);

    const result = resolveProblem(
      activeProblem.id,
      solvePhotoUrl,
      impactMetrics || 'Remediation completed and verified with municipal officers.',
      effectiveBeforePhoto
    );

    if (!result.success && result.error) {
      setResolveError(result.error);
    } else {
      navigateTo('impact-gallery');
    }
  };

  if (!activeProblem) {
    return (
      <div className="pb-24 px-4 pt-3 max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="flex items-center gap-2">
              <Pushpin color="teal" size="sm" />
              <h1 className="font-['Epilogue'] font-black text-xl text-[#1F1B17]">
                Action Tracker
              </h1>
            </div>
            <p className="text-xs text-[#6E5A4E]">
              Add updates, post photos, and mark issues solved.
            </p>
          </div>
        </div>

        <div className="bg-[#FFFDF8] border-2 border-dashed border-[#B8EADE] rounded-xl p-8 text-center space-y-2">
          <Pushpin color="teal" size="md" />
          <h3 className="font-['Epilogue'] font-bold text-base text-[#1F1B17]">
            0 Active Problems in Queue
          </h3>
          <p className="text-xs text-[#6E5A4E]">
            There are currently no civic problems in progress to track. Claim or report a problem to begin logging field updates.
          </p>
          <button
            onClick={() => navigateTo('problem-wall')}
            className="mt-2 px-3.5 py-1.5 rounded-lg bg-[#1B4B43] hover:bg-[#143731] text-white text-xs font-['Epilogue'] font-bold cursor-pointer shadow-xs"
          >
            Browse Problem Board
          </button>
        </div>
      </div>
    );
  }

  const hasLoggedPhoto =
    activeProblem.updates.some((u) => Boolean(u.photoUrl)) || Boolean(solvePhotoUrl);

  return (
    <div className="pb-24 px-4 pt-3 max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-2">
            <Pushpin color="teal" size="sm" />
            <h1 className="font-['Epilogue'] font-black text-xl text-[#1F1B17]">
              Action Tracker
            </h1>
          </div>
          <p className="text-xs text-[#6E5A4E]">
            Add updates, post photos, and mark issues solved.
          </p>
        </div>
      </div>

      {/* Select Problem Selector */}
      <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-3 shadow-xs">
        <label className="block text-[11px] font-['Epilogue'] font-bold uppercase text-[#57423C] mb-1">
          Choose a Problem to Track / Resolve:
        </label>
        <select
          value={activeProblemId || ''}
          onChange={(e) => setActiveProblemId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-sm font-semibold text-[#1F1B17] focus:outline-none focus:border-[#38665E]"
        >
          {problems.map((p) => {
            const isAssignedToMe =
              p.assignedToVolunteerId === currentVolunteer.id ||
              p.assignedLead === currentVolunteer.name ||
              p.assignedVolunteers?.includes(currentVolunteer.name);
            return (
              <option key={p.id} value={p.id}>
                {isAssignedToMe ? '★ [ASSIGNED TO YOU] ' : `[${p.status}] `}
                {p.title} ({p.location})
              </option>
            );
          })}
        </select>
      </div>

      {/* Problem Status Card */}
      <div className="relative bg-[#FFFDF8] border-2 border-[#B8EADE] rounded-xl p-4 shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <RubberStamp status={activeProblem.status} size="sm" />
            {activeProblem.assignedBy ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-['Epilogue'] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF0E6] text-[#C1502E] border border-[#F5C2A5]">
                Assigned by {activeProblem.assignedBy}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-['Epilogue'] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF6ED] text-[#57423C] border border-[#DEC0B8]">
                Claimed by you
              </span>
            )}
          </div>
          <span className="text-xs font-mono text-[#7C695E]">ID: #{activeProblem.id.slice(-6)}</span>
        </div>

        <h2 className="font-['Epilogue'] font-bold text-base text-[#1F1B17]">
          {activeProblem.title}
        </h2>
        <p className="text-xs text-[#57423C]">{activeProblem.description}</p>

        <div className="p-2.5 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] space-y-1 text-xs text-[#57423C]">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span>
              Squad: <strong>{activeProblem.assignedSquad || 'NSS Civic Cadre'}</strong> • Lead:{' '}
              <strong>{activeProblem.assignedLead || currentVolunteer.name}</strong>
            </span>
            {activeProblem.assignmentStatus && (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                activeProblem.assignmentStatus === 'ACCEPTED'
                  ? 'bg-[#B8EADE] text-[#1B4B43]'
                  : activeProblem.assignmentStatus === 'PENDING'
                  ? 'bg-[#FFDDAE] text-[#7B5300]'
                  : 'bg-[#FFDBD1] text-[#A03818]'
              }`}>
                {activeProblem.assignmentStatus}
              </span>
            )}
          </div>

          {activeProblem.targetDate && (
            <div className="text-[11px] text-[#C1502E] font-semibold pt-0.5">
              Target date: {activeProblem.targetDate}
            </div>
          )}

          {activeProblem.materialsNeeded && (
            <div className="text-[11px] text-[#6E5A4E]">
              Tools needed: {activeProblem.materialsNeeded}
            </div>
          )}
        </div>
      </div>

      {/* Step 1: Log Verified Field Update */}
      <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-[#F1E6E0] pb-2">
          <Camera className="w-4 h-4 text-[#A03818]" />
          <h3 className="font-['Epilogue'] font-bold text-sm text-[#1F1B17]">
            1. Add Progress Update
          </h3>
        </div>

        <form onSubmit={handleAddUpdate} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-[#57423C] mb-1">
              What did you do? *
            </label>
            <textarea
              required
              rows={2}
              value={logDesc || ''}
              onChange={(e) => setLogDesc(e.target.value)}
              placeholder="e.g., Put warning tape around the area and contacted the electric board."
              className="w-full px-3 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-xs text-[#1F1B17] focus:outline-none focus:border-[#38665E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-[#57423C] mb-1">Type of Update</label>
              <select
                value={logTag || 'FIELD ACTION'}
                onChange={(e) => setLogTag(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-xs"
              >
                <option value="FIELD ACTION">Field Action</option>
                <option value="SAFETY PERIMETER">Safety Warning</option>
                <option value="MUNICIPAL TICKET">City Report</option>
                <option value="CLEANUP SQUAD">Cleanup Drive</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#57423C] mb-1">
                Attach Field Photo
              </label>
              <div className="flex gap-1.5">
                <label className="flex-1 py-1.5 px-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-[11px] font-bold text-[#38665E] hover:border-[#38665E] text-center cursor-pointer flex items-center justify-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>{logPhotoUrl ? 'Photo Selected' : 'Upload File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'progress')}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setLogPhotoUrl(demoFieldPhotos[0].url)}
                  className="py-1.5 px-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-[10.5px] font-bold text-[#57423C] hover:text-[#1F1B17] text-center cursor-pointer shrink-0"
                >
                  Demo Photo
                </button>
              </div>
              {logPhotoUrl && (
                <div className="mt-1 flex items-center gap-2 text-[10px] text-[#38665E]">
                  <span>✓ Photo attached</span>
                  <button
                    type="button"
                    onClick={() => setLogPhotoUrl('')}
                    className="text-[#A03818] hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-3 rounded-lg font-['Epilogue'] font-bold text-xs cork-btn-teal flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Update</span>
          </button>
        </form>
      </div>

      {/* Step 2: Final Resolution & Mark as SOLVED */}
      <div className="bg-[#FFFDF8] border-2 border-[#B8EADE] rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-[#B8EADE] pb-2">
          <CheckCircle2 className="w-4 h-4 text-[#1B4B43]" />
          <h3 className="font-['Epilogue'] font-bold text-sm text-[#1B4B43]">
            2. Mark as Solved
          </h3>
        </div>

        {resolveError && (
          <div className="p-2.5 rounded-lg bg-[#FFDBD1] border border-[#A03818] text-xs text-[#A03818] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{resolveError}</span>
          </div>
        )}

        <div className="text-xs text-[#57423C] space-y-2">
          <p className="leading-snug">
            To stamp as <strong>SOLVED</strong>, NSS operational standards require at least one <strong>Before</strong> photo (initial hazard) and one <strong>After</strong> photo (proof of remediation).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* 1. Before Photo */}
            <div className="p-3 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] space-y-2 text-center">
              <span className="text-[10px] font-mono font-bold uppercase text-[#7C695E] block">
                1. Before Photo (Initial Hazard)
              </span>
              {effectiveBeforePhoto ? (
                <div className="space-y-1.5">
                  <span className="text-[#1B4B43] font-bold bg-[#B8EADE] text-[10px] px-2 py-0.5 rounded-full inline-block">
                    ✓ Verified Before Proof
                  </span>
                  <div className="w-full h-24 mx-auto rounded overflow-hidden border border-[#DEC0B8]">
                    <img
                      src={effectiveBeforePhoto}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-0.5">
                    <label className="text-[10px] text-[#A03818] font-bold underline cursor-pointer">
                      Replace Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'before')}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowBeforeUrlInput(!showBeforeUrlInput)}
                      className="text-[10px] text-[#7C695E] hover:underline cursor-pointer"
                    >
                      URL
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[#A03818] font-bold bg-[#FFDBD1] text-[10px] px-2 py-0.5 rounded-full inline-block">
                    Missing Before Photo
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <label className="w-full py-1.5 px-2 rounded-lg bg-white border border-[#DEC0B8] text-[11px] font-bold text-[#A03818] hover:bg-[#FFF5F2] cursor-pointer flex items-center justify-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Upload Before Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'before')}
                        className="hidden"
                      />
                    </label>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomBeforePhotoUrl(demoFieldPhotos[0].url)}
                        className="text-[10px] text-[#57423C] font-semibold underline cursor-pointer"
                      >
                        + Use Demo Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBeforeUrlInput(!showBeforeUrlInput)}
                        className="text-[10px] text-[#57423C] font-semibold underline cursor-pointer"
                      >
                        + Paste URL
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showBeforeUrlInput && (
                <div className="pt-1">
                  <input
                    type="url"
                    placeholder="Paste image URL here..."
                    value={customBeforePhotoUrl}
                    onChange={(e) => setCustomBeforePhotoUrl(e.target.value)}
                    className="w-full px-2 py-1 text-[11px] bg-white border border-[#DEC0B8] rounded"
                  />
                </div>
              )}
            </div>

            {/* 2. After Photo */}
            <div className="p-3 rounded-lg bg-[#FAF6ED] border border-[#B8EADE] space-y-2 text-center">
              <span className="text-[10px] font-mono font-bold uppercase text-[#7C695E] block">
                2. After Photo (Solved Remediation)
              </span>
              {solvePhotoUrl ? (
                <div className="space-y-1.5">
                  <span className="text-[#1B4B43] font-bold bg-[#B8EADE] text-[10px] px-2 py-0.5 rounded-full inline-block">
                    ✓ Verified Solved Proof
                  </span>
                  <div className="w-full h-24 mx-auto rounded overflow-hidden border border-[#B8EADE]">
                    <img
                      src={solvePhotoUrl}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-0.5">
                    <label className="text-[10px] text-[#1B4B43] font-bold underline cursor-pointer">
                      Replace Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'after')}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAfterUrlInput(!showAfterUrlInput)}
                      className="text-[10px] text-[#7C695E] hover:underline cursor-pointer"
                    >
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setSolvePhotoUrl('')}
                      className="text-[10px] text-[#A03818] hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[#A03818] font-bold bg-[#FFDBD1] text-[10px] px-2 py-0.5 rounded-full inline-block">
                    Missing After Photo Proof
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <label className="w-full py-1.5 px-2 rounded-lg bg-white border border-[#B8EADE] text-[11px] font-bold text-[#1B4B43] hover:bg-[#B8EADE]/30 cursor-pointer flex items-center justify-center gap-1 shadow-2xs">
                      <Upload className="w-3 h-3" />
                      <span>Upload Solved Photo Proof</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'after')}
                        className="hidden"
                      />
                    </label>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSolvePhotoUrl(demoFieldPhotos[1].url)}
                        className="text-[10px] text-[#1B4B43] font-semibold underline cursor-pointer"
                      >
                        + Use Demo After Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAfterUrlInput(!showAfterUrlInput)}
                        className="text-[10px] text-[#57423C] font-semibold underline cursor-pointer"
                      >
                        + Paste URL
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showAfterUrlInput && (
                <div className="pt-1">
                  <input
                    type="url"
                    placeholder="Paste image URL here..."
                    value={solvePhotoUrl}
                    onChange={(e) => setSolvePhotoUrl(e.target.value)}
                    className="w-full px-2 py-1 text-[11px] bg-white border border-[#B8EADE] rounded"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleMarkSolved} className="space-y-3 text-xs pt-1">
          <div>
            <label className="block font-semibold text-[#1F1B17] mb-1">
              What was accomplished? (Resolution Note & Impact Metrics) *
            </label>
            <input
              type="text"
              required
              value={impactMetrics || ''}
              onChange={(e) => setImpactMetrics(e.target.value)}
              placeholder="e.g., Sidewalk debris removed, hazard taped, and pedestrian passage restored."
              className="w-full px-3 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-xs text-[#1F1B17] focus:outline-none focus:border-[#38665E]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl font-['Epilogue'] font-extrabold text-xs cork-btn-teal flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Mark as Solved & Publish to Impact Gallery</span>
          </button>
        </form>
      </div>
    </div>
  );
};
