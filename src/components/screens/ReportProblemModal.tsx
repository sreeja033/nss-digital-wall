import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { ProblemCategory } from '../../types';
import { Pushpin } from '../common/Pushpin';
import { WashiTape } from '../common/WashiTape';
import { LocationPickerMap } from '../common/LocationPickerMap';
import {
  Camera,
  MapPin,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  X,
  Sparkles,
  Link2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Eye,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
  Bookmark,
  Trash2,
  Check,
  FileText,
  Save,
  Clock,
  RotateCcw,
  AlertCircle,
  Users,
  Map as MapIcon,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/dateUtils';

const DRAFT_STORAGE_KEY = 'community_bulletin_report_draft';

export const ReportProblemModal: React.FC = () => {
  const {
    submitReport,
    navigateTo,
    duplicateAlert,
    setDuplicateAlert,
    showToast,
    currentCommunityMember,
    isCommunityLoggedIn,
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProblemCategory>('Garbage');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [location, setLocation] = useState(() => currentCommunityMember?.location || currentCommunityMember?.ward || '');
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const userHasEditedLocation = useRef(false);
  const autoGpsTriggered = useRef(false);
  const lastGeocodeTimeRef = useRef<number>(0);
  const [landmark, setLandmark] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [anonymous, setAnonymous] = useState(true);
  const [authorName, setAuthorName] = useState(() => currentCommunityMember?.fullName || '');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Compulsory field validation calculations
  const getValidationErrors = () => {
    const errs: { [key: string]: string } = {};

    if (!title.trim()) {
      errs.title = 'Title is compulsory. Please enter what the problem is.';
    } else if (title.trim().length < 4) {
      errs.title = 'Title must be at least 4 characters long.';
    }

    if (isCustomCategory) {
      if (!customCategoryText.trim()) {
        errs.category = 'Custom category name is compulsory.';
      } else if (customCategoryText.trim().length < 2) {
        errs.category = 'Category must be at least 2 characters.';
      }
    } else if (!category) {
      errs.category = 'Please select a problem category.';
    }

    if (!description.trim()) {
      errs.description = 'Problem details are compulsory. Please describe the issue.';
    } else if (description.trim().length < 10) {
      errs.description = 'Details must be at least 10 characters long.';
    }

    if (!photoUrl) {
      errs.photo = 'Photo evidence is compulsory. Please snap a photo, upload an image, or pick a sample photo.';
    }

    if (!location.trim()) {
      errs.location = 'Location or street address is compulsory.';
    } else if (location.trim().length < 3) {
      errs.location = 'Location must be at least 3 characters.';
    }

    if (!landmark.trim()) {
      errs.landmark = 'Nearby landmark is compulsory (e.g., Near Bus Stop, Opposite Gate 2).';
    } else if (landmark.trim().length < 2) {
      errs.landmark = 'Landmark must be at least 2 characters.';
    }

    if (!anonymous && !authorName.trim()) {
      errs.authorName = 'Name is compulsory when not posting anonymously.';
    }

    return errs;
  };

  const compulsoryItems = [
    { id: 'field-title', key: 'title', label: 'Title', isFilled: Boolean(title.trim() && title.trim().length >= 4) },
    { id: 'field-category', key: 'category', label: 'Category', isFilled: Boolean(isCustomCategory ? customCategoryText.trim().length >= 2 : Boolean(category)) },
    { id: 'field-description', key: 'description', label: 'Details', isFilled: Boolean(description.trim() && description.trim().length >= 10) },
    { id: 'field-photo', key: 'photo', label: 'Photo Evidence', isFilled: Boolean(photoUrl) },
    { id: 'field-location', key: 'location', label: 'Location', isFilled: Boolean(location.trim() && location.trim().length >= 3) },
    { id: 'field-landmark', key: 'landmark', label: 'Landmark', isFilled: Boolean(landmark.trim() && landmark.trim().length >= 2) },
    { id: 'field-identity', key: 'authorName', label: 'Identity', isFilled: Boolean(anonymous || (authorName.trim() && authorName.trim().length >= 2)) },
  ];

  const filledCount = compulsoryItems.filter((i) => i.isFilled).length;
  const totalCompulsory = compulsoryItems.length;
  const allCompulsoryFilled = filledCount === totalCompulsory;

  // Draft saving states
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [draftBannerDismissed, setDraftBannerDismissed] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const isInitialMount = useRef(true);

  // Camera state & refs
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // GPS state
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Sample photo presets for quick testing
  const samplePhotos = [
    {
      label: 'Trash pile',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpZzLCsDO8sZm5pS6TutIkOGNT9zBzzeC3tXEkEo5HlsPvQsRxDxMloUI-MafM4hjrzDNnso9DoJWNbRqWS9lyv5-58Xnw09T-9qQZUdmDF9zIiGcY9pe9nPL4uN3635E-HVZkUusg2QiqUpydxJSQIRYeQMQf4McGmsW-LWFQOOscnwBAPu7UzdyaboTcBcI2cZV4iaztN3CtYqvO21THYXPtRecoRQu39FgLOCc7jbP5DIDln0sYBg',
    },
    {
      label: 'Broken light',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDnXgANniOfOHvjiCExQpSp1R9pBMksmFbfZAxJa1Qlf5iZK_w3AX4-uoSjFJOqaHzRcDpFjd5qBL8Hn91iKsoVcaj3gC4FaXdaTwbjgbtK56aumvu9OR8ZLAxwmOBh26dWjmqEgMEjP_e9ofdI0-Qg7SYuZXuYD4MnNqFPS8IsUCeMV0_n5Phe6jgeh8anbUsjfpB6wCmZs6B6rboSeBK_NyPVmi-9ZQJfG1ylQpL9PryBt85lSqPJA',
    },
    {
      label: 'Cracked sidewalk',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG7-2IMa5U2nrxLAxScYoxlN66f-aZclj4BHkjbMV9AZ9tisz4OWKz2N7zh4NWooAdfNOwseyxfG6DcjE5QSZ479fIUFOKKg_DPPkbpuf5rwQ3IgCaVU3uktCSkJzJIrT3Y1u1Luth26ex0kxdrHLdPmXesGZ8fq3qYGVCU7oh9ynqtYAmBXq7mWFXlR9LhYP0cTrnoGAR9xpuNhlKAsIrafhElZZ4NwgMNMtXylfcXUbWLq2M5LRtXw',
    },
  ];

  // Stop camera tracks cleanly on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async (facing: 'environment' | 'user' = 'environment') => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera is not supported. Please upload a photo instead.');
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      setIsCameraOpen(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access denied. Please upload a photo instead.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found. Please upload a photo instead.');
      } else {
        setCameraError('Camera not available. Please upload a photo instead.');
      }
    }
  };

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
      setPhotoUrl(dataUrl);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const flipCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reverse geocodes lat/lng into human-readable street & neighborhood details
  // Enforces Nominatim rate limit: maximum 1 request per second
  const reverseGeocodeCoords = useCallback(
    async (lat: number, lng: number) => {
      // Throttle Nominatim calls to roughly 1 per second per usage policy
      const now = Date.now();
      const elapsed = now - lastGeocodeTimeRef.current;
      if (elapsed < 1050) {
        await new Promise((res) => setTimeout(res, 1050 - elapsed));
      }
      lastGeocodeTimeRef.current = Date.now();

      try {
        let formatted = '';
        let road = '';
        let neighbourhood = '';
        let city = '';

        // 1. Try server-side endpoint with identified User-Agent and Referer headers
        try {
          const srvRes = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
          if (srvRes.ok) {
            const srvData = await srvRes.json();
            formatted = srvData.formatted_address || srvData.display_name;
            road = srvData.road || '';
            neighbourhood = srvData.neighbourhood || '';
            city = srvData.city || '';
          }
        } catch {
          // Fall back to direct Nominatim request
        }

        // 2. Direct Nominatim OpenStreetMap fallback if server response was not received
        if (!formatted) {
          const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&email=24r01a05q2@cmrithyderabad.edu.in`;
          const directRes = await fetch(nominatimUrl, {
            headers: {
              Accept: 'application/json',
            },
          });
          if (directRes.ok) {
            const data = (await directRes.json()) as any;
            const addr = data.address || {};
            road = addr.road || addr.street || addr.pedestrian || addr.footway || addr.path || '';
            neighbourhood =
              addr.suburb || addr.neighbourhood || addr.residential || addr.subdivision || addr.village || '';
            city = addr.city || addr.town || addr.municipality || addr.county || '';
            const parts = [road, neighbourhood, city].filter(Boolean);
            formatted =
              parts.length > 0
                ? parts.join(', ')
                : (data.display_name?.split(',').slice(0, 3).join(', ') || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);
          }
        }

        if (formatted) {
          if (!userHasEditedLocation.current) {
            setLocation(formatted);
            setValidationErrors((prev) => ({ ...prev, location: '' }));
          }
          if (!landmark && (neighbourhood || road || city)) {
            setLandmark(neighbourhood || road || city || 'GPS Location');
            setValidationErrors((prev) => ({ ...prev, landmark: '' }));
          }
        }
      } catch (err) {
        console.warn('Reverse geocoding error:', err);
      }
    },
    [landmark]
  );

  const detectLocationAndReverseGeocode = useCallback(
    (isManual = false) => {
      setGpsError(null);
      if (!navigator.geolocation) {
        if (isManual) {
          setGpsError('GPS not supported by your browser. Please type your location below.');
        }
        return;
      }

      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setIsLocating(false);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setDetectedCoords({ lat, lng });

          // Save in localStorage for the map to center on user's location
          try {
            localStorage.setItem('nss_user_detected_location', JSON.stringify({ lat, lng }));
          } catch {}

          // Immediate placeholder with readable coordinates
          if (!userHasEditedLocation.current && !location) {
            setLocation(`${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);
          }

          // Trigger throttled reverse-geocoding via Nominatim
          await reverseGeocodeCoords(lat, lng);
        },
        (err) => {
          setIsLocating(false);
          console.warn('Geolocation error:', err);
          if (isManual) {
            if (err.code === 1) {
              setGpsError('Location permission denied. Please type your address manually below.');
            } else if (err.code === 2) {
              setGpsError('GPS signal unavailable. Please type your address manually below.');
            } else {
              setGpsError('Location detection timed out. Please enter your address manually.');
            }
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 9000,
          maximumAge: 15000,
        }
      );
    },
    [location, reverseGeocodeCoords]
  );

  // Called when user clicks on the map or drags the pin
  const handleMapPinChange = useCallback(
    (coords: { lat: number; lng: number }) => {
      setDetectedCoords(coords);
      userHasEditedLocation.current = false;
      try {
        localStorage.setItem('nss_user_detected_location', JSON.stringify(coords));
      } catch {}
      reverseGeocodeCoords(coords.lat, coords.lng);
    },
    [reverseGeocodeCoords]
  );

  const handleDetectGPS = () => {
    detectLocationAndReverseGeocode(true);
  };

  // Auto-detect GPS location the moment the location section opens
  useEffect(() => {
    if (autoGpsTriggered.current) return;

    const el = document.getElementById('field-location');
    if (!el) {
      const timer = setTimeout(() => {
        if (!autoGpsTriggered.current && !location && !detectedCoords) {
          autoGpsTriggered.current = true;
          detectLocationAndReverseGeocode(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !autoGpsTriggered.current) {
          autoGpsTriggered.current = true;
          if (!location && !detectedCoords) {
            detectLocationAndReverseGeocode(false);
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [detectLocationAndReverseGeocode, location, detectedCoords]);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasContent = Boolean(
          parsed.title?.trim() ||
          parsed.description?.trim() ||
          parsed.location?.trim() ||
          parsed.landmark?.trim() ||
          parsed.customCategoryText?.trim() ||
          parsed.authorName?.trim() ||
          parsed.photoUrl
        );

        if (hasContent) {
          if (parsed.title) setTitle(parsed.title || '');
          if (parsed.description) setDescription(parsed.description || '');
          if (parsed.category) setCategory(parsed.category || 'Garbage');
          if (parsed.isCustomCategory !== undefined && parsed.isCustomCategory !== null) setIsCustomCategory(Boolean(parsed.isCustomCategory));
          if (parsed.customCategoryText) setCustomCategoryText(parsed.customCategoryText || '');
          if (parsed.location) setLocation(parsed.location || '');
          if (parsed.coordinates) setDetectedCoords(parsed.coordinates);
          if (parsed.landmark) setLandmark(parsed.landmark || '');
          if (parsed.urgent !== undefined && parsed.urgent !== null) setUrgent(Boolean(parsed.urgent));
          if (parsed.anonymous !== undefined && parsed.anonymous !== null) setAnonymous(Boolean(parsed.anonymous));
          if (parsed.authorName) setAuthorName(parsed.authorName || '');
          if (parsed.photoUrl) setPhotoUrl(parsed.photoUrl || '');
          if (parsed.updatedAt) setDraftSavedAt(parsed.updatedAt);
          setDraftRestored(true);
        }
      }
    } catch (err) {
      console.warn('Failed to restore draft from localStorage', err);
    }
  }, []);

  // Auto-save draft on field updates
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const hasContent = Boolean(
      title.trim() ||
      description.trim() ||
      location.trim() ||
      landmark.trim() ||
      customCategoryText.trim() ||
      authorName.trim() ||
      photoUrl
    );

    if (!hasContent) {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setDraftSavedAt(null);
      } catch {}
      return;
    }

    const timer = setTimeout(() => {
      try {
        const now = Date.now();
        const draftData = {
          title,
          description,
          category,
          isCustomCategory,
          customCategoryText,
          location,
          landmark,
          coordinates: detectedCoords,
          urgent,
          anonymous,
          authorName,
          photoUrl,
          updatedAt: now,
        };
        try {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
        } catch {
          // If storage limit reached due to photo, safely keep all text progress
          localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify({ ...draftData, photoUrl: '' })
          );
        }
        setDraftSavedAt(now);
      } catch (err) {
        console.warn('Auto-save error', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    title,
    description,
    category,
    isCustomCategory,
    customCategoryText,
    location,
    landmark,
    urgent,
    anonymous,
    authorName,
    photoUrl,
  ]);

  // Window beforeunload listener to safeguard progress if user reloads or closes browser
  useEffect(() => {
    const handleBeforeUnload = () => {
      const hasContent = Boolean(title.trim() || description.trim() || location.trim());
      if (hasContent) {
        try {
          const draftData = {
            title,
            description,
            category,
            isCustomCategory,
            customCategoryText,
            location,
            landmark,
            urgent,
            anonymous,
            authorName,
            photoUrl,
            updatedAt: Date.now(),
          };
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
        } catch {}
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [title, description, category, isCustomCategory, customCategoryText, location, landmark, urgent, anonymous, authorName, photoUrl]);

  const handleManualSaveDraft = () => {
    const hasContent = Boolean(
      title.trim() ||
      description.trim() ||
      location.trim() ||
      landmark.trim() ||
      customCategoryText.trim() ||
      authorName.trim() ||
      photoUrl
    );

    if (!hasContent) {
      showToast('Form is empty. Enter some details to save as a draft.');
      return;
    }

    try {
      const now = Date.now();
      const draftData = {
        title,
        description,
        category,
        isCustomCategory,
        customCategoryText,
        location,
        landmark,
        urgent,
        anonymous,
        authorName,
        photoUrl,
        updatedAt: now,
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      } catch {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({ ...draftData, photoUrl: '' })
        );
      }
      setDraftSavedAt(now);
      setIsManualSaving(true);
      setTimeout(() => setIsManualSaving(false), 2000);
      showToast('Draft saved! Your text progress will be waiting when you return.');
    } catch {
      showToast('Unable to write draft to local storage.');
    }
  };

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    setTitle('');
    setDescription('');
    setCategory('Garbage');
    setIsCustomCategory(false);
    setCustomCategoryText('');
    setLocation('');
    setLandmark('');
    setUrgent(false);
    setAnonymous(true);
    setAuthorName('');
    setPhotoUrl('');
    setDraftSavedAt(null);
    setDraftRestored(false);
    setShowDiscardConfirm(false);
    showToast('Draft discarded. Form cleared.');
  };

  const handleCancel = () => {
    const hasContent = Boolean(
      title.trim() ||
      description.trim() ||
      location.trim() ||
      landmark.trim()
    );
    if (hasContent) {
      showToast('Draft progress saved! You can resume anytime.');
    }
    navigateTo('home');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);

    const errs = getValidationErrors();
    setValidationErrors(errs);

    const errorKeys = Object.keys(errs);
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      const targetItem = compulsoryItems.find((i) => i.key === firstKey);
      if (targetItem) {
        const el = document.getElementById(targetItem.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      showToast('All details are compulsory! Please fill out all required fields marked with *');
      return;
    }

    const effectiveCategory = isCustomCategory
      ? customCategoryText.trim()
      : category;

    setIsSubmitting(true);
    try {
      const result = await submitReport({
        title: title.trim(),
        description: description.trim(),
        category: effectiveCategory || 'General',
        location: location.trim(),
        landmark: landmark.trim(),
        coordinates: detectedCoords || undefined,
        urgent,
        anonymous,
        photoUrl,
      });

      setIsSubmitting(false);

      // Clear saved draft upon successful report submission
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setDraftSavedAt(null);
        setDraftRestored(false);
      } catch {}

      if (result.duplicateLinked) {
        // Alert handled via context duplicateAlert
      } else if (result.problemId) {
        navigateTo('problem-detail', result.problemId);
      }
    } catch (err) {
      setIsSubmitting(false);
      showToast('Submission failed. Please try again.');
    }
  };

  return (
    <div className="pb-20 px-4 pt-3 max-w-xl mx-auto">
      {/* Duplicate Detection Alert Modal / Banner */}
      {duplicateAlert && (
        <div className="mb-4 bg-[#FFDDAE]/90 border-2 border-[#7B5300] rounded-xl p-3.5 shadow-md animate-in fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <Link2 className="w-5 h-5 text-[#7B5300] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-['Epilogue'] font-black text-sm text-[#7B5300]">
                  Matching Problem Found!
                </h4>
                <p className="text-xs text-[#57423C] mt-0.5">
                  A problem in this area was already reported:
                </p>
                <div className="bg-[#FFFDF8] border border-[#7B5300]/30 rounded p-2 mt-1.5 text-xs font-medium text-[#1F1B17]">
                  "{duplicateAlert.existingProblem.title}" — {duplicateAlert.existingProblem.location}
                </div>
                <p className="text-[11px] text-[#7B5300] mt-1 font-semibold">
                  ✓ We added your report as an agree vote on the existing problem!
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const targetId = duplicateAlert.existingProblem.id;
                setDuplicateAlert(null);
                navigateTo('problem-detail', targetId);
              }}
              className="touch-target w-8 h-8 rounded-full bg-[#FFFDF8] flex items-center justify-center text-[#7B5300] hover:bg-[#FAF6ED]"
              aria-label="Close message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => {
                const targetId = duplicateAlert.existingProblem.id;
                setDuplicateAlert(null);
                navigateTo('problem-detail', targetId);
              }}
              className="min-h-[44px] px-3.5 py-2 text-xs font-['Epilogue'] font-bold rounded-lg bg-[#7B5300] text-white flex items-center gap-1 cursor-pointer"
            >
              <span>View Problem</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Notice Sheet (Pinned Card) */}
      <div className="relative bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-2xl p-4 sm:p-5 shadow-[0_4px_16px_rgba(43,38,34,0.08)] mt-4">
        {/* Brass pushpin at top */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <Pushpin color="rust" size="lg" />
        </div>
        {/* Washi tape at right */}
        <div className="absolute -top-2.5 right-4 rotate-6 z-10">
          <WashiTape color="peach" width="w-18" />
        </div>

        {/* Top title */}
        <div className="text-center pt-3.5 sm:pt-4 pb-3 border-b border-[#E3D4BE]">
          <span className="font-['Caveat'] text-2xl text-[#A03818] font-bold block -rotate-2">
            Report an Issue
          </span>
          <h1 className="font-['Epilogue'] font-black text-2xl sm:text-3xl text-[#1F1B17] tracking-tight mt-1">
            Report a Problem
          </h1>
          <p className="text-xs text-[#6E5A4E] mt-1 max-w-sm mx-auto">
            Anonymous by default. Your post will be visible to all neighbors and volunteers.
          </p>

          {/* Draft Live Status Indicator */}
          {draftSavedAt && (
            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6ED] border border-[#DEC0B8] text-[11px] text-[#57423C] animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-[#A03818]" />
              <span className="font-medium">
                Draft auto-saved {formatRelativeTime(draftSavedAt)}
              </span>
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(true)}
                className="ml-1 text-[10px] text-[#A03818] font-bold hover:underline cursor-pointer"
                title="Discard this draft"
              >
                Discard
              </button>
            </div>
          )}
        </div>

        {/* Restored Draft Alert Banner */}
        {draftRestored && !draftBannerDismissed && (
          <div className="mt-4 mb-1 bg-[#FAF6ED] border-2 border-[#DEC0B8] rounded-xl p-3.5 shadow-xs flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FFDBD1]/70 border border-[#DEC0B8] flex items-center justify-center shrink-0 mt-0.5">
                <Bookmark className="w-4 h-4 text-[#A03818]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-['Epilogue'] font-extrabold text-xs text-[#A03818]">
                    Restored Draft Progress
                  </span>
                  {draftSavedAt && (
                    <span className="text-[10px] text-[#7C695E] font-mono">
                      • {formatRelativeTime(draftSavedAt)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#57423C] leading-tight mt-0.5">
                  Your previously entered text was automatically restored. Any new changes will continue to auto-save.
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDiscardConfirm(true)}
                    className="text-[11px] font-['Epilogue'] font-bold text-[#A03818] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Discard draft & start fresh</span>
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDraftBannerDismissed(true)}
              className="p-1 rounded-md text-[#7C695E] hover:text-[#1F1B17] hover:bg-[#E3D4BE]/40 cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Compulsory Details Progress Tracker */}
        <div className={`mt-3 p-3.5 rounded-xl border-2 transition-all ${
          allCompulsoryFilled
            ? 'bg-[#FFDBD1]/30 border-[#A03818]/40 text-[#842504]'
            : 'bg-[#FAF6ED] border-[#DEC0B8] text-[#57423C]'
        }`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              {allCompulsoryFilled ? (
                <CheckCircle2 className="w-4 h-4 text-[#A03818]" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#A03818]" />
              )}
              <span className="font-['Epilogue'] font-extrabold text-xs">
                Compulsory Details Checklist
              </span>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              allCompulsoryFilled
                ? 'bg-[#A03818] text-white'
                : 'bg-[#FFDBD1] text-[#A03818]'
            }`}>
              {filledCount} of {totalCompulsory} completed
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {compulsoryItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  const el = document.getElementById(item.id);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition-all cursor-pointer ${
                  item.isFilled
                    ? 'bg-[#FFFDF8] border-[#A03818] text-[#A03818]'
                    : formSubmitted
                    ? 'bg-[#FFDBD1]/70 border-[#A03818] text-[#A03818] animate-pulse'
                    : 'bg-[#FFFDF8] border-[#DEC0B8] text-[#7C695E] hover:border-[#A03818]'
                }`}
              >
                {item.isFilled ? (
                  <Check className="w-3 h-3 text-[#A03818] stroke-[3]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A03818]" />
                )}
                <span>{item.label}</span>
                <span className="text-[9px] text-[#A03818] font-bold">*</span>
              </button>
            ))}
          </div>

          {!allCompulsoryFilled && formSubmitted && (
            <p className="text-[11px] text-[#A03818] font-bold mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>All details marked with * are compulsory. Please fill remaining fields before posting.</span>
            </p>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Title */}
          <div id="field-title" className="scroll-mt-4">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider">
                What is the problem? <span className="text-[#A03818]">* (Compulsory)</span>
              </label>
              {title.trim().length >= 4 && (
                <span className="text-[11px] text-[#A03818] font-medium flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> Filled
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={title || ''}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationErrors.title) {
                  setValidationErrors((prev) => ({ ...prev, title: '' }));
                }
              }}
              placeholder="e.g., Broken streetlight near the bus stop"
              className={`w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#FAF6ED] border text-sm text-[#1F1B17] placeholder:text-[#9E8B80] focus:outline-none transition-colors ${
                formSubmitted && validationErrors.title
                  ? 'border-2 border-[#A03818] bg-[#FFDBD1]/20'
                  : 'border-[#DEC0B8] focus:border-[#A03818] focus:ring-1 focus:ring-[#A03818]'
              }`}
            />
            {formSubmitted && validationErrors.title && (
              <p className="text-[11px] text-[#A03818] font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{validationErrors.title}</span>
              </p>
            )}
          </div>

          {/* Category Input - Allows any type without restrictions */}
          <div id="field-category" className="scroll-mt-4">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider">
                Category / Problem Type <span className="text-[#A03818]">* (Compulsory)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  if (!isCustomCategory) {
                    setIsCustomCategory(true);
                    setCustomCategoryText('');
                  } else {
                    setIsCustomCategory(false);
                  }
                }}
                className="text-[11px] font-bold text-[#A03818] hover:underline cursor-pointer flex items-center gap-1"
              >
                {isCustomCategory ? '← Choose standard list' : '✍️ Type any custom type'}
              </button>
            </div>

            {isCustomCategory ? (
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  value={customCategoryText || ''}
                  onChange={(e) => {
                    setCustomCategoryText(e.target.value);
                    if (validationErrors.category) {
                      setValidationErrors((prev) => ({ ...prev, category: '' }));
                    }
                  }}
                  placeholder="Type any category (e.g., Stray Dogs, Noise, Broken Swing, Open Pit, Fallen Branch)..."
                  className={`w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#FAF6ED] border-2 text-sm text-[#1F1B17] placeholder:text-[#9E8B80] focus:outline-none focus:ring-1 focus:ring-[#A03818] ${
                    formSubmitted && validationErrors.category
                      ? 'border-[#A03818] bg-[#FFDBD1]/20'
                      : 'border-[#A03818]'
                  }`}
                  autoFocus
                />
                {formSubmitted && validationErrors.category && (
                  <p className="text-[11px] text-[#A03818] font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validationErrors.category}</span>
                  </p>
                )}
                <div className="flex items-center justify-between text-[11px] text-[#6E5A4E]">
                  <span>No specifications needed — enter any category or type.</span>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(false)}
                    className="text-[#7C695E] hover:text-[#1F1B17] underline cursor-pointer"
                  >
                    Use standard list
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={category || 'Garbage'}
                  onChange={(e) => {
                    if (e.target.value === '__OTHER_CUSTOM__') {
                      setIsCustomCategory(true);
                      setCustomCategoryText('');
                    } else {
                      setCategory(e.target.value as ProblemCategory);
                      if (validationErrors.category) {
                        setValidationErrors((prev) => ({ ...prev, category: '' }));
                      }
                    }
                  }}
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-sm text-[#1F1B17] focus:outline-none focus:border-[#A03818]"
                >
                  <option value="Garbage">🗑️ Trash & Litter</option>
                  <option value="Streetlights">💡 Streetlights & Dark Spots</option>
                  <option value="Roads">🚧 Roads & Sidewalks</option>
                  <option value="Water">💧 Water & Leaks</option>
                  <option value="Greenery">🌱 Trees & Parks</option>
                  <option value="School">🏫 School Zones</option>
                  <option value="Accessibility">♿ Ramps & Wheelchairs</option>
                  <option value="Sanitation">🚰 Drains & Sewage</option>
                  <option value="Electrical">⚡ Wires & Electrical</option>
                  <option value="__OTHER_CUSTOM__">✍️ Other (Type any custom category)...</option>
                </select>

                {/* Quick suggestion pills for instant 1-tap selection */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-[#7C695E] font-medium mr-0.5">Quick pick:</span>
                  {[
                    'Garbage',
                    'Streetlights',
                    'Roads',
                    'Water',
                    'Greenery',
                    'Sanitation',
                    'Electrical',
                  ].map((catName) => (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => {
                        setCategory(catName);
                        setIsCustomCategory(false);
                        if (validationErrors.category) {
                          setValidationErrors((prev) => ({ ...prev, category: '' }));
                        }
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        !isCustomCategory && category === catName
                          ? 'bg-[#A03818] text-white border-[#A03818] font-bold shadow-xs'
                          : 'bg-[#FFFDF8] text-[#57423C] border-[#DEC0B8] hover:bg-[#FAF6ED]'
                      }`}
                    >
                      {catName}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(true);
                      setCustomCategoryText('');
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-dashed border-[#A03818] text-[#A03818] bg-[#FFDBD1]/40 hover:bg-[#FFDBD1] font-bold transition-all cursor-pointer"
                  >
                    + Any other type...
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div id="field-description" className="scroll-mt-4">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider">
                Details <span className="text-[#A03818]">* (Compulsory)</span>
              </label>
              <span className={`text-[11px] font-mono ${description.trim().length >= 10 ? 'text-[#38665E] font-semibold' : 'text-[#7C695E]'}`}>
                {description.trim().length}/10 chars min
              </span>
            </div>
            <textarea
              required
              rows={3}
              value={description || ''}
              onChange={(e) => {
                setDescription(e.target.value);
                if (validationErrors.description) {
                  setValidationErrors((prev) => ({ ...prev, description: '' }));
                }
              }}
              placeholder="Describe what is broken, where it is, and why it needs fixing..."
              className={`w-full px-3 py-2.5 rounded-lg bg-[#FAF6ED] border text-sm text-[#1F1B17] placeholder:text-[#9E8B80] focus:outline-none transition-colors ${
                formSubmitted && validationErrors.description
                  ? 'border-2 border-[#A03818] bg-[#FFDBD1]/20'
                  : 'border-[#DEC0B8] focus:border-[#A03818]'
              }`}
            />
            {formSubmitted && validationErrors.description && (
              <p className="text-[11px] text-[#A03818] font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{validationErrors.description}</span>
              </p>
            )}
          </div>

          {/* Photo Evidence with Device Camera & Fallback */}
          <div id="field-photo" className="scroll-mt-4">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider">
                Photo Evidence <span className="text-[#A03818]">* (Compulsory)</span>
              </label>
              {photoUrl ? (
                <span className="text-[11px] text-[#38665E] font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Photo Attached
                </span>
              ) : (
                <span className="text-[10.5px] font-bold text-[#A03818] bg-[#FFDBD1] px-2 py-0.5 rounded-md">
                  Photo Required
                </span>
              )}
            </div>

            {/* Camera Error Message Banner */}
            {cameraError && (
              <div className="mb-2 p-2.5 rounded-lg bg-[#FFDBD1]/70 border border-[#A03818]/40 text-xs text-[#842504] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#A03818]" />
                <div className="flex-1">
                  <span>{cameraError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCameraError(null)}
                  className="text-[#842504] hover:text-black p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Live Camera Viewfinder Overlay */}
            {isCameraOpen ? (
              <div className="relative rounded-xl overflow-hidden border-2 border-[#A03818] bg-black shadow-lg">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-56 object-cover bg-black"
                />

                {/* Camera Top Bar */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                  <span className="px-2 py-1 rounded bg-black/60 text-white text-[11px] font-mono flex items-center gap-1.5 backdrop-blur-xs">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    Camera
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={flipCamera}
                      className="touch-target w-9 h-9 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center backdrop-blur-xs cursor-pointer"
                      title="Switch Camera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="touch-target w-9 h-9 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center backdrop-blur-xs cursor-pointer"
                      title="Close Camera"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Shutter Capture Controls */}
                <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3 px-4 z-10">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="min-h-[48px] px-5 py-2.5 rounded-full bg-[#FAF6ED] text-[#A03818] font-['Epilogue'] font-black text-sm flex items-center gap-2 shadow-[0_4px_14px_rgba(0,0,0,0.5)] active:scale-95 transition-all cursor-pointer border-2 border-[#A03818]"
                  >
                    <Camera className="w-5 h-5 text-[#A03818]" />
                    <span>Take Photo</span>
                  </button>
                </div>
              </div>
            ) : photoUrl ? (
              /* Display Captured/Selected Photo Preview */
              <div className="relative rounded-xl overflow-hidden border-2 border-[#DEC0B8] h-40 bg-black/5 shadow-inner">
                <img src={photoUrl} alt="Upload preview" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/65 text-white text-[10px] font-medium backdrop-blur-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Photo added ✓
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  aria-label="Remove photo"
                  className="touch-target w-9 h-9 absolute top-2 right-2 rounded-full bg-black/70 text-white hover:bg-black flex items-center justify-center cursor-pointer shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Photo Input Options: Camera / File Upload / Sample Presets */
              <div className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-colors ${
                formSubmitted && validationErrors.photo
                  ? 'border-[#A03818] bg-[#FFDBD1]/25'
                  : 'border-[#DEC0B8] bg-[#FAF6ED]/70 hover:bg-[#FAF6ED]'
              }`}>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Option 1: Live Web Camera */}
                  <button
                    type="button"
                    onClick={() => startCamera(cameraFacing)}
                    className="min-h-[48px] py-2.5 px-3 rounded-xl bg-[#FFFDF8] border-2 border-[#A03818] text-[#A03818] hover:bg-[#FFDBD1]/40 flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-98 transition-all"
                  >
                    <Camera className="w-5 h-5 text-[#A03818]" />
                    <span className="text-xs font-['Epilogue'] font-extrabold leading-tight">
                      Take Photo
                    </span>
                    <span className="text-[10px] text-[#7C695E]">Use Camera</span>
                  </button>

                  {/* Option 2: Upload or Mobile Native Camera via file picker */}
                  <label className="min-h-[48px] py-2.5 px-3 rounded-xl bg-[#FFFDF8] border border-[#DEC0B8] text-[#57423C] hover:border-[#A03818] hover:text-[#A03818] flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-98 transition-all">
                    <UploadCloud className="w-5 h-5 text-[#A03818]" />
                    <span className="text-xs font-['Epilogue'] font-bold leading-tight text-[#1F1B17]">
                      Upload Photo
                    </span>
                    <span className="text-[10px] text-[#7C695E]">From your files</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Quick Demo Photo Presets for Easy Verification */}
                <div className="mt-3 pt-2.5 border-t border-[#DEC0B8]/60">
                  <p className="text-[10px] font-semibold text-[#7C695E] mb-1.5">
                    Or choose a sample photo preset (1-click fill):
                  </p>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {samplePhotos.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setPhotoUrl(p.url);
                          if (validationErrors.photo) {
                            setValidationErrors((prev) => ({ ...prev, photo: '' }));
                          }
                        }}
                        className="touch-target min-h-[36px] text-[10px] font-semibold px-2.5 py-1 rounded-md bg-[#FFFDF8] border border-[#DEC0B8] text-[#57423C] hover:border-[#A03818] hover:text-[#A03818] active:bg-[#FFDBD1]/50 cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {formSubmitted && validationErrors.photo && !photoUrl && (
              <p className="text-[11px] text-[#A03818] font-semibold mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{validationErrors.photo}</span>
              </p>
            )}
          </div>

          {/* Location & GPS with Graceful Fallback */}
          <div id="field-location" className="scroll-mt-4">
            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
              <label className="block text-xs font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider">
                Location or Address <span className="text-[#A03818]">* (Compulsory)</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isLocating}
                  className="touch-target min-h-[44px] text-xs font-['Epilogue'] font-extrabold text-[#A03818] flex items-center gap-1 px-2 hover:bg-[#FFDBD1]/30 rounded-lg cursor-pointer transition-colors"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A03818]" />
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-[#A03818]" />
                      <span>{detectedCoords ? 'Re-detect GPS' : 'Auto-detect GPS'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowMapPicker((prev) => !prev)}
                  className={`touch-target min-h-[44px] text-xs font-['Epilogue'] font-extrabold flex items-center gap-1 px-2.5 rounded-lg cursor-pointer transition-colors ${
                    showMapPicker
                      ? 'bg-[#A03818] text-[#FFFDF8]'
                      : 'text-[#57423C] hover:bg-[#F1E6E0] border border-[#DEC0B8]'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>{showMapPicker ? 'Close Map' : 'Pick on Map'}</span>
                </button>
              </div>
            </div>

            {/* GPS Detecting Loading State */}
            {isLocating && (
              <div className="mb-2 p-2.5 rounded-xl bg-[#FFDBD1]/60 border border-[#A03818]/30 text-xs text-[#A03818] flex items-center gap-2.5 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#A03818]" />
                <div className="flex-1">
                  <p className="font-bold">Detecting your location...</p>
                  <p className="text-[11px] text-[#57423C]">
                    Fetching coordinates and looking up street name via OpenStreetMap Nominatim
                  </p>
                </div>
              </div>
            )}

            {/* GPS Coordinates Detected Banner */}
            {detectedCoords && !isLocating && (
              <div className="mb-2 p-2 rounded-lg bg-[#B8EADE]/40 border border-[#38665E]/30 text-xs text-[#1B4B43] flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#1B4B43]" />
                  <span>
                    GPS Attached: {detectedCoords.lat.toFixed(4)}° N, {detectedCoords.lng.toFixed(4)}° E
                  </span>
                </span>
                <span className="text-[10px] text-[#38665E] italic">Plotted on OpenStreetMap</span>
              </div>
            )}

            {/* GPS Error Fallback Notice */}
            {gpsError && (
              <div className="mb-2 p-2 rounded-lg bg-[#FFDDAE]/70 border border-[#7B5300]/40 text-xs text-[#7B5300] flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#7B5300]" />
                <div className="flex-1">
                  <span>{gpsError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGpsError(null)}
                  className="text-[#7B5300] hover:text-black p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Interactive Leaflet OpenStreetMap Pin Picker */}
            {showMapPicker && (
              <div className="mb-2.5 space-y-1">
                <LocationPickerMap
                  coordinates={detectedCoords}
                  onLocationChange={handleMapPinChange}
                />
                <p className="text-[11px] text-[#7C695E] flex items-center justify-between px-1">
                  <span>Click anywhere or drag the pushpin to pinpoint the issue.</span>
                  <span className="font-mono text-[10px] text-[#8C7A70]">OSM &amp; Nominatim</span>
                </p>
              </div>
            )}

            <input
              type="text"
              required
              value={location || ''}
              onChange={(e) => {
                userHasEditedLocation.current = true;
                setLocation(e.target.value);
                if (validationErrors.location) {
                  setValidationErrors((prev) => ({ ...prev, location: '' }));
                }
              }}
              placeholder="e.g., Main Street near 5th Avenue"
              className={`w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#FAF6ED] border text-sm text-[#1F1B17] placeholder:text-[#9E8B80] focus:outline-none transition-colors ${
                formSubmitted && validationErrors.location
                  ? 'border-2 border-[#A03818] bg-[#FFDBD1]/20'
                  : 'border-[#DEC0B8] focus:border-[#A03818]'
              }`}
            />
            {formSubmitted && validationErrors.location && (
              <p className="text-[11px] text-[#A03818] font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{validationErrors.location}</span>
              </p>
            )}
          </div>

          {/* Landmark Field (Compulsory) */}
          <div id="field-landmark" className="scroll-mt-4">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider">
                Nearby Landmark / Spot <span className="text-[#A03818]">* (Compulsory)</span>
              </label>
              {landmark.trim().length >= 2 && (
                <span className="text-[11px] text-[#A03818] font-medium flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> Filled
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={landmark || ''}
              onChange={(e) => {
                setLandmark(e.target.value);
                if (validationErrors.landmark) {
                  setValidationErrors((prev) => ({ ...prev, landmark: '' }));
                }
              }}
              placeholder="e.g., Near Bus Stop 12, Opposite Gate 2, Next to corner grocery"
              className={`w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#FAF6ED] border text-sm text-[#1F1B17] placeholder:text-[#9E8B80] focus:outline-none transition-colors ${
                formSubmitted && validationErrors.landmark
                  ? 'border-2 border-[#A03818] bg-[#FFDBD1]/20'
                  : 'border-[#DEC0B8] focus:border-[#A03818]'
              }`}
            />
            {formSubmitted && validationErrors.landmark && (
              <p className="text-[11px] text-[#A03818] font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{validationErrors.landmark}</span>
              </p>
            )}
            <p className="text-[11px] text-[#7C695E] mt-1">
              Helps volunteers quickly spot and verify the issue on the ground.
            </p>
          </div>

          {/* Problem Urgency Selection (Compulsory) */}
          <div id="field-urgency" className="pt-2 border-t border-[#E3D4BE] scroll-mt-4">
            <label className="block text-xs font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider mb-2">
              Problem Urgency <span className="text-[#A03818]">* (Compulsory Choice)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUrgent(false)}
                className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                  !urgent
                    ? 'bg-[#FAF6ED] border-[#A03818] shadow-xs'
                    : 'bg-[#FFFDF8] border-[#DEC0B8] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-['Epilogue'] font-extrabold text-[#1F1B17]">
                    Standard Issue
                  </span>
                  {!urgent && <Check className="w-4 h-4 text-[#A03818] stroke-[2.5]" />}
                </div>
                <p className="text-[11px] text-[#6E5A4E] mt-0.5 leading-snug">
                  Routine neighborhood repair, cleanup, or maintenance.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setUrgent(true)}
                className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                  urgent
                    ? 'bg-[#FFDBD1]/70 border-[#A03818] shadow-xs'
                    : 'bg-[#FFFDF8] border-[#DEC0B8] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-['Epilogue'] font-extrabold text-[#A03818] flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#A03818]" />
                    Urgent Hazard
                  </span>
                  {urgent && <Check className="w-4 h-4 text-[#A03818] stroke-[2.5]" />}
                </div>
                <p className="text-[11px] text-[#6E5A4E] mt-0.5 leading-snug">
                  Immediate safety risk or someone could get hurt.
                </p>
              </button>
            </div>
          </div>

          {/* Identity & Anonymous Selection (Compulsory) */}
          <div id="field-identity" className="pt-2 border-t border-[#E3D4BE] scroll-mt-4 space-y-2.5">
            <label className="block text-xs font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider">
              Reporting Identity <span className="text-[#A03818]">* (Compulsory Choice)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAnonymous(true)}
                className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                  anonymous
                    ? 'bg-[#FFF8F5] border-[#A03818] shadow-xs'
                    : 'bg-[#FFFDF8] border-[#DEC0B8] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-['Epilogue'] font-bold text-[#1F1B17] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#A03818]" />
                    Post Anonymously
                  </span>
                  {anonymous && <Check className="w-4 h-4 text-[#A03818] stroke-[2.5]" />}
                </div>
                <p className="text-[11px] text-[#6E5A4E] mt-0.5 leading-snug">
                  Your name and contact remain completely hidden.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAnonymous(false);
                  if (!authorName && currentCommunityMember) {
                    setAuthorName(currentCommunityMember.fullName);
                  }
                }}
                className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                  !anonymous
                    ? 'bg-[#FAF6ED] border-[#A03818] shadow-xs'
                    : 'bg-[#FFFDF8] border-[#DEC0B8] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-['Epilogue'] font-bold text-[#1F1B17] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#A03818]" />
                    Post with My Name
                  </span>
                  {!anonymous && <Check className="w-4 h-4 text-[#A03818] stroke-[2.5]" />}
                </div>
                <p className="text-[11px] text-[#6E5A4E] mt-0.5 leading-snug">
                  Show your resident name on the noticeboard.
                </p>
              </button>
            </div>

            {!anonymous && (
              <div className="space-y-1 pt-1">
                <label className="block text-[11px] font-['Epilogue'] font-bold text-[#1F1B17]">
                  Your Full Name <span className="text-[#A03818]">* (Compulsory when not anonymous)</span>
                </label>
                <input
                  type="text"
                  required
                  value={authorName || ''}
                  onChange={(e) => {
                    setAuthorName(e.target.value);
                    if (validationErrors.authorName) {
                      setValidationErrors((prev) => ({ ...prev, authorName: '' }));
                    }
                  }}
                  placeholder="Enter your full name"
                  className={`w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#FAF6ED] border text-sm text-[#1F1B17] focus:outline-none transition-colors ${
                    formSubmitted && validationErrors.authorName
                      ? 'border-2 border-[#A03818] bg-[#FFDBD1]/20'
                      : 'border-[#DEC0B8] focus:border-[#A03818]'
                  }`}
                />
                {formSubmitted && validationErrors.authorName && (
                  <p className="text-[11px] text-[#A03818] font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validationErrors.authorName}</span>
                  </p>
                )}
                {isCommunityLoggedIn && currentCommunityMember && (
                  <p className="text-[11px] text-[#A03818] flex items-center gap-1 font-medium pl-1">
                    <ShieldCheck className="w-3 h-3 text-[#A03818]" />
                    <span>Registered resident ({currentCommunityMember.fullName} • {currentCommunityMember.ward || 'Local Ward'})</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#E3D4BE] space-y-2">
            {!allCompulsoryFilled && (
              <div className="p-2.5 rounded-lg bg-[#FFDBD1]/60 border border-[#A03818]/40 text-xs text-[#842504] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-[#A03818] shrink-0" />
                  <span>
                    <strong>{totalCompulsory - filledCount} details left:</strong> All fields marked with * are compulsory.
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="touch-target min-h-[48px] py-2.5 px-3 rounded-xl border border-[#DEC0B8] bg-[#FAF6ED] text-xs font-['Epilogue'] font-bold text-[#57423C] hover:bg-[#F1E6E0] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleManualSaveDraft}
                disabled={isManualSaving}
                className="touch-target min-h-[48px] py-2.5 px-3 rounded-xl border border-[#DEC0B8] bg-[#FFFDF8] hover:bg-[#FAF6ED] text-xs font-['Epilogue'] font-bold text-[#57423C] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="Save draft progress to finish later"
              >
                {isManualSaving ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#38665E]" />
                    <span className="text-[#38665E]">Saved ✓</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5 text-[#A03818]" />
                    <span>Save Draft</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="touch-target flex-1 min-h-[48px] py-2.5 px-4 rounded-xl font-['Epilogue'] font-extrabold text-sm cork-btn-primary flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>{isSubmitting ? 'Posting...' : 'Post Problem'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Discard Draft Confirmation Dialog */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 bg-[#1F1B17]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-[#A03818] mb-2">
              <div className="w-8 h-8 rounded-full bg-[#FFDBD1] flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-[#A03818]" />
              </div>
              <h3 className="font-['Epilogue'] font-black text-base text-[#1F1B17]">
                Discard this draft?
              </h3>
            </div>
            <p className="text-xs text-[#57423C] leading-relaxed mb-4">
              All your entered details, location, and notes will be cleared and your saved progress deleted.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="touch-target min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DEC0B8] bg-[#FAF6ED] text-xs font-['Epilogue'] font-bold text-[#57423C] hover:bg-[#F1E6E0] cursor-pointer"
              >
                Keep Draft
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="touch-target min-h-[44px] px-4 py-2 rounded-xl bg-[#A03818] text-white text-xs font-['Epilogue'] font-extrabold hover:bg-[#842504] shadow-xs cursor-pointer"
              >
                Discard & Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

