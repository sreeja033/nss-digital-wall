import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Pushpin } from '../common/Pushpin';
import { RubberStamp } from '../common/RubberStamp';
import {
  CheckCircle2,
  Camera,
  AlertTriangle,
  Send,
  Clock,
  Award,
  RotateCw,
  X,
  Smartphone,
  Sparkles,
} from 'lucide-react';

export const ActionTrackerScreen: React.FC = () => {
  const {
    problems,
    selectedProblemId,
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
  const [impactMetrics, setImpactMetrics] = useState('');
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Camera states & refs
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'progress' | 'before' | 'after'>('progress');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Dedicated native device camera inputs (capture="environment" triggers native camera directly)
  const progressCameraInputRef = useRef<HTMLInputElement>(null);
  const beforeCameraInputRef = useRef<HTMLInputElement>(null);
  const afterCameraInputRef = useRef<HTMLInputElement>(null);

  // Cleanly stop any active video tracks
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setCameraError(null);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // When live camera modal mounts or stream changes, attach to the video element
  useEffect(() => {
    if (isCameraOpen && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.warn('Live viewfinder play error:', err);
      });
    }
  }, [isCameraOpen]);

  // Open in-app live camera viewfinder
  const openLiveCamera = async (
    target: 'progress' | 'before' | 'after',
    facing: 'environment' | 'user' = 'environment'
  ) => {
    setCameraTarget(target);
    setCameraFacing(facing);
    setCameraError(null);

    // Check if getUserMedia is supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        streamRef.current = stream;
        setIsCameraOpen(true);
        return;
      } catch (err: any) {
        console.warn('Live viewfinder permission denied or unvailable:', err);
        // Fall back to native camera input directly
        triggerDeviceCamera(target);
        return;
      }
    }

    // Direct native camera trigger
    triggerDeviceCamera(target);
  };

  // Direct native device camera trigger (opens camera app on phones)
  const triggerDeviceCamera = (target: 'progress' | 'before' | 'after') => {
    if (target === 'progress') progressCameraInputRef.current?.click();
    if (target === 'before') beforeCameraInputRef.current?.click();
    if (target === 'after') afterCameraInputRef.current?.click();
  };

  // Capture frame from in-app viewfinder
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      if (cameraTarget === 'progress') setLogPhotoUrl(dataUrl);
      if (cameraTarget === 'before') setCustomBeforePhotoUrl(dataUrl);
      if (cameraTarget === 'after') setSolvePhotoUrl(dataUrl);
      stopCamera();
    }
  };

  // Switch between back/front lens
  const flipCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    openLiveCamera(cameraTarget, nextFacing);
  };

  // Handle native camera capture file
  const handleNativeCameraCapture = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'progress' | 'before' | 'after'
  ) => {
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
    e.target.value = '';
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
      <div className="pb-24 px-3 sm:px-4 pt-3 max-w-xl mx-auto space-y-4 w-full">
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="flex items-center gap-2">
              <Pushpin color="teal" size="sm" />
              <h1 className="font-['Epilogue'] font-black text-xl text-[#1F1B17]">
                Action Tracker
              </h1>
            </div>
            <p className="text-xs text-[#6E5A4E]">
              Add updates, snap photos on the spot, and mark issues solved.
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

  return (
    <div className="pb-24 px-3 sm:px-4 pt-3 max-w-xl mx-auto space-y-4 w-full">
      {/* Hidden Native Camera Inputs with capture="environment" for immediate spot camera snapping */}
      <input
        ref={progressCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleNativeCameraCapture(e, 'progress')}
        className="hidden"
      />
      <input
        ref={beforeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleNativeCameraCapture(e, 'before')}
        className="hidden"
      />
      <input
        ref={afterCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleNativeCameraCapture(e, 'after')}
        className="hidden"
      />

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
            Snap on-the-spot camera photos, post progress updates, and mark issues solved.
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

      {/* Progress Log Timeline */}
      <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#F1E6E0] pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#7C695E]" />
            <h3 className="font-['Epilogue'] font-bold text-sm text-[#1F1B17]">
              Field Progress Activity ({activeProblem.updates.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#7C695E]">Verified Log</span>
        </div>

        {activeProblem.updates.length === 0 ? (
          <p className="text-xs text-[#6E5A4E] italic py-2 text-center">
            No updates recorded yet. Snap an on-the-spot camera photo and post progress below!
          </p>
        ) : (
          <div className="space-y-3">
            {activeProblem.updates.map((update) => (
              <div
                key={update.id}
                className="p-3 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-['Epilogue'] font-bold text-[#1B4B43] bg-[#B8EADE] px-2 py-0.5 rounded">
                    {update.tag || 'UPDATE'}
                  </span>
                  <span className="text-[#7C695E] font-mono">{update.timestamp}</span>
                </div>
                <p className="text-xs text-[#1F1B17]">{update.description}</p>
                {update.photoUrl && (
                  <div className="w-full max-w-xs h-32 rounded-lg overflow-hidden border border-[#DEC0B8] mt-1.5">
                    <img
                      src={update.photoUrl}
                      alt="Update"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="text-[10px] text-[#7C695E] pt-1">
                  Logged by: <strong>{update.author}</strong> ({update.role})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 1: Log Verified Field Update - STRICTLY CAMERA ONLY */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-[#57423C] mb-1">Type of Update</label>
              <select
                value={logTag || 'FIELD ACTION'}
                onChange={(e) => setLogTag(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-xs"
              >
                <option value="FIELD ACTION">Field Action</option>
                <option value="SAFETY PERIMETER">Safety Warning</option>
                <option value="MUNICIPAL TICKET">City Report</option>
                <option value="CLEANUP SQUAD">Cleanup Drive</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#57423C] mb-1">
                Take Photo On The Spot (Camera)
              </label>
              {logPhotoUrl ? (
                <div className="p-2 rounded-xl bg-[#FAF6ED] border border-[#B8EADE] flex items-center gap-2.5">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#B8EADE] shrink-0 bg-black/5">
                    <img src={logPhotoUrl} alt="Captured update" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#1B4B43] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Photo captured on spot
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => openLiveCamera('progress')}
                        className="text-[11px] text-[#1B4B43] font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Retake</span>
                      </button>
                      <span className="text-[#DEC0B8]">•</span>
                      <button
                        type="button"
                        onClick={() => setLogPhotoUrl('')}
                        className="text-[11px] text-[#A03818] hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => openLiveCamera('progress')}
                    className="touch-target min-h-[42px] w-full py-2 px-3 rounded-xl bg-[#FAF6ED] border-2 border-[#1B4B43] text-xs font-['Epilogue'] font-bold text-[#1B4B43] flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-[#E8F8F4] active:scale-98 shadow-xs"
                  >
                    <Camera className="w-4 h-4 text-[#1B4B43]" />
                    <span>Open Live Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerDeviceCamera('progress')}
                    className="touch-target min-h-[36px] w-full py-1.5 px-3 rounded-xl bg-white border border-[#DEC0B8] text-[11px] font-['Epilogue'] font-semibold text-[#57423C] flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#FAF6ED] active:scale-98"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#A03818]" />
                    <span>Device Camera (Snap on Spot)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="touch-target min-h-[44px] w-full py-2.5 px-3 rounded-xl font-['Epilogue'] font-bold text-xs cork-btn-teal flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Update</span>
          </button>
        </form>
      </div>

      {/* Step 2: Final Resolution & Mark as SOLVED - STRICTLY CAMERA ONLY */}
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
            To stamp as <strong>SOLVED</strong>, NSS operational standards require at least one <strong>Before</strong> photo (initial hazard) and one <strong>After</strong> photo (remediation proof snapped on the spot with camera).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* 1. Before Photo */}
            <div className="p-3.5 rounded-xl bg-[#FAF6ED] border border-[#DEC0B8] space-y-2.5 text-center">
              <span className="text-[10px] font-mono font-bold uppercase text-[#7C695E] block">
                1. Before Photo (Initial Hazard)
              </span>
              {effectiveBeforePhoto ? (
                <div className="space-y-2">
                  <span className="text-[#1B4B43] font-bold bg-[#B8EADE] text-[10px] px-2 py-0.5 rounded-full inline-block">
                    ✓ Verified Before Proof
                  </span>
                  <div className="w-full h-28 mx-auto rounded-lg overflow-hidden border border-[#DEC0B8] bg-black/5">
                    <img
                      src={effectiveBeforePhoto}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => openLiveCamera('before')}
                      className="touch-target min-h-[36px] w-full px-2.5 py-1 rounded-lg bg-white border border-[#DEC0B8] text-[11px] text-[#A03818] font-bold hover:bg-[#FFF5F2] cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#A03818]" />
                      <span>Retake Before Photo (Live Camera)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerDeviceCamera('before')}
                      className="touch-target min-h-[32px] w-full px-2 py-1 rounded-lg bg-transparent text-[10px] text-[#57423C] font-semibold hover:underline cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Smartphone className="w-3 h-3 text-[#A03818]" />
                      <span>Device Camera</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[#A03818] font-bold bg-[#FFDBD1] text-[10px] px-2 py-0.5 rounded-full inline-block">
                    Missing Before Photo
                  </span>
                  <p className="text-[11px] text-[#6E5A4E]">
                    Snap an on-the-spot photo of the initial hazard.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => openLiveCamera('before')}
                      className="touch-target min-h-[42px] w-full py-2 px-3 rounded-xl bg-white border-2 border-[#A03818] text-xs font-['Epilogue'] font-bold text-[#A03818] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:bg-[#FFF8F5] transition-all"
                    >
                      <Camera className="w-4 h-4 text-[#A03818]" />
                      <span>Open Live Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerDeviceCamera('before')}
                      className="touch-target min-h-[36px] w-full py-1.5 px-3 rounded-xl bg-white border border-[#DEC0B8] text-[11px] font-['Epilogue'] font-semibold text-[#57423C] flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#FAF6ED]"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-[#A03818]" />
                      <span>Device Camera (Snap on Spot)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. After Photo */}
            <div className="p-3.5 rounded-xl bg-[#FAF6ED] border border-[#B8EADE] space-y-2.5 text-center">
              <span className="text-[10px] font-mono font-bold uppercase text-[#7C695E] block">
                2. After Photo (Solved Remediation)
              </span>
              {solvePhotoUrl ? (
                <div className="space-y-2">
                  <span className="text-[#1B4B43] font-bold bg-[#B8EADE] text-[10px] px-2 py-0.5 rounded-full inline-block">
                    ✓ Verified Solved Proof
                  </span>
                  <div className="w-full h-28 mx-auto rounded-lg overflow-hidden border border-[#B8EADE] bg-black/5">
                    <img
                      src={solvePhotoUrl}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => openLiveCamera('after')}
                      className="touch-target min-h-[36px] w-full px-2.5 py-1 rounded-lg bg-white border border-[#B8EADE] text-[11px] text-[#1B4B43] font-bold hover:bg-[#E8F8F4] cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#1B4B43]" />
                      <span>Retake Solved Photo (Live Camera)</span>
                    </button>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => triggerDeviceCamera('after')}
                        className="text-[10px] text-[#57423C] font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <Smartphone className="w-3 h-3 text-[#1B4B43]" />
                        <span>Device Camera</span>
                      </button>
                      <span className="text-[#DEC0B8]">•</span>
                      <button
                        type="button"
                        onClick={() => setSolvePhotoUrl('')}
                        className="text-[10px] text-[#A03818] hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[#A03818] font-bold bg-[#FFDBD1] text-[10px] px-2 py-0.5 rounded-full inline-block">
                    Missing After Photo Proof
                  </span>
                  <p className="text-[11px] text-[#6E5A4E]">
                    Snap an on-the-spot camera photo showing the fixed condition.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => openLiveCamera('after')}
                      className="touch-target min-h-[42px] w-full py-2 px-3 rounded-xl bg-white border-2 border-[#1B4B43] text-xs font-['Epilogue'] font-bold text-[#1B4B43] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:bg-[#F0FAF7] transition-all"
                    >
                      <Camera className="w-4 h-4 text-[#1B4B43]" />
                      <span>Open Live Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerDeviceCamera('after')}
                      className="touch-target min-h-[36px] w-full py-1.5 px-3 rounded-xl bg-white border border-[#DEC0B8] text-[11px] font-['Epilogue'] font-semibold text-[#57423C] flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#FAF6ED]"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-[#1B4B43]" />
                      <span>Device Camera (Snap on Spot)</span>
                    </button>
                  </div>
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
            className="touch-target min-h-[46px] w-full py-2.5 px-4 rounded-xl font-['Epilogue'] font-extrabold text-xs cork-btn-teal flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Mark as Solved & Publish to Impact Gallery</span>
          </button>
        </form>
      </div>

      {/* Live In-App Camera Viewfinder Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 pb-safe pt-safe animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="w-full max-w-md flex items-center justify-between text-white py-2">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#B8EADE]" />
              <div>
                <span className="font-['Epilogue'] font-bold text-xs uppercase tracking-wider block">
                  {cameraTarget === 'progress'
                    ? 'Spot Camera: Progress Update'
                    : cameraTarget === 'before'
                    ? 'Spot Camera: Before Hazard'
                    : 'Spot Camera: Solved Remediation'}
                </span>
                <span className="text-[10px] text-white/70">Point at field site and tap shutter</span>
              </div>
            </div>
            <button
              onClick={stopCamera}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Viewfinder Display */}
          <div className="relative w-full max-w-md flex-1 max-h-[60vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-[#1B4B43]">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />

            {/* Target reticle */}
            <div className="absolute inset-8 border border-white/40 rounded-xl pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-[#B8EADE]" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-[#B8EADE]" />
              </div>
              <div className="text-center">
                <span className="bg-black/60 text-white text-[10px] px-2.5 py-1 rounded-full font-mono">
                  FIELD VERIFICATION
                </span>
              </div>
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-[#B8EADE]" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-[#B8EADE]" />
              </div>
            </div>
          </div>

          {/* Bottom Shutter Controls */}
          <div className="w-full max-w-md py-4 flex items-center justify-around">
            {/* Flip Lens */}
            <button
              type="button"
              onClick={flipCamera}
              className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95"
              title="Flip Front/Rear Lens"
            >
              <RotateCw className="w-5 h-5" />
              <span className="text-[8px] mt-0.5">Flip</span>
            </button>

            {/* Main Shutter Button */}
            <button
              type="button"
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full bg-white border-4 border-[#1B4B43] flex items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer"
              title="Take Photo"
            >
              <div className="w-16 h-16 rounded-full bg-[#1B4B43] flex items-center justify-center">
                <Camera className="w-7 h-7 text-white" />
              </div>
            </button>

            {/* Direct Device Camera Alternative */}
            <button
              type="button"
              onClick={() => {
                stopCamera();
                triggerDeviceCamera(cameraTarget);
              }}
              className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95"
              title="Switch to Native Device Camera"
            >
              <Smartphone className="w-5 h-5" />
              <span className="text-[8px] mt-0.5">Device</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
