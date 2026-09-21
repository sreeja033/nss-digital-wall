import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Pushpin } from '../common/Pushpin';
import { WashiTape } from '../common/WashiTape';
import {
  UserPlus,
  ArrowRight,
  Mail,
  Lock,
  User,
  MapPin,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Locate,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const CommunityRegisterScreen: React.FC = () => {
  const { registerCommunityMember, navigateTo, setUserRole } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const formatted =
              addr.suburb ||
              addr.neighbourhood ||
              addr.residential ||
              addr.road ||
              addr.city_district ||
              addr.city ||
              `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setLocation(formatted);
            try {
              localStorage.setItem('nss_user_area_location', JSON.stringify({ lat: latitude, lng: longitude, area: formatted }));
            } catch {}
          } else {
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            try {
              localStorage.setItem('nss_user_area_location', JSON.stringify({ lat: latitude, lng: longitude }));
            } catch {}
          }
        } catch {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          try {
            localStorage.setItem('nss_user_area_location', JSON.stringify({ lat: latitude, lng: longitude }));
          } catch {}
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        setErrorMsg('Could not detect GPS location. You can type your neighborhood or street manually below.');
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();
    const cleanLoc = location.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Please enter your full name (at least 2 letters).');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address (e.g. name@example.com).');
      return;
    }
    if (!cleanLoc) {
      setErrorMsg('Please enter your neighborhood, street, or ward location.');
      return;
    }
    if (cleanPass.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (cleanPass !== confirmPassword.trim()) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }
    if (!agreedToTerms) {
      setErrorMsg('Please agree to neighborhood civic guidelines to proceed.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerCommunityMember({
        fullName: cleanName,
        email: cleanEmail,
        location: cleanLoc,
        ward: cleanLoc,
        phone,
        password: cleanPass,
      });
      setIsLoading(false);
      if (res && res.success) {
        navigateTo('home');
      } else {
        setErrorMsg((res && res.error) || 'Failed to register account. Please check your information.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Failed to register account. Please try again.');
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col justify-center px-4 pt-4 pb-8 max-w-md mx-auto w-full">
      {/* Top back navigation */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={() => {
            setUserRole('community');
            navigateTo('community-login');
          }}
          className="inline-flex items-center gap-1.5 text-xs text-[#6E5A4E] hover:text-[#1F1B17] font-medium cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </button>
        <span className="text-[10.5px] font-semibold text-[#A03818] bg-[#FFDBD1]/60 px-2.5 py-0.5 rounded-full">
          New Resident
        </span>
      </div>

      {/* Main Noticeboard Paper Card */}
      <div className="relative bg-[#FFFDF8] border-3 border-[#DEC0B8] rounded-2xl p-5 sm:p-6 shadow-[0_6px_20px_rgba(43,38,34,0.08)]">
        {/* Top Pushpin */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Pushpin color="rust" size="lg" />
        </div>

        {/* Washi tape accents */}
        <div className="absolute -top-2.5 left-5 -rotate-6 z-10">
          <WashiTape color="mint" width="w-16" />
        </div>
        <div className="absolute -top-2.5 right-5 rotate-6 z-10">
          <WashiTape color="yellow" width="w-16" />
        </div>

        {/* Header */}
        <div className="text-center pt-3 pb-3 border-b border-[#E3D4BE]">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-[#FFDBD1] border border-[#A03818]/30 flex items-center justify-center text-[#A03818] shadow-xs">
            <UserPlus className="w-6 h-6" />
          </div>
          <span className="font-['Caveat'] text-xl text-[#A03818] font-bold block -rotate-2">
            Join the Bulletin Board
          </span>
          <h1 className="font-['Epilogue'] font-black text-xl sm:text-2xl text-[#1F1B17] tracking-tight">
            Register Resident Account
          </h1>
          <p className="text-xs text-[#6E5A4E] mt-1 leading-relaxed max-w-xs mx-auto">
            Create an account to pin neighborhood problems, back your neighbors&apos; reports, and track civic cleanup drives.
          </p>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-[#FFF5F2] border border-[#DEC0B8] flex items-start gap-2.5 text-xs text-[#A03818]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold leading-snug">{errorMsg}</p>
              {(errorMsg.toLowerCase().includes('already exists') || errorMsg.toLowerCase().includes('already registered')) && (
                <button
                  type="button"
                  onClick={() => {
                    setUserRole('community');
                    navigateTo('community-login');
                  }}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#A03818] underline hover:text-[#7A2A12] cursor-pointer"
                >
                  Go to Sign In &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div>
            <label className="block text-[11px] font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider mb-1">
              Your Full Name <span className="text-[#A03818]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A03818]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full pl-9 pr-3 py-2 bg-[#FFF8F5] border-2 border-[#DEC0B8] rounded-xl text-xs sm:text-sm text-[#1F1B17] focus:outline-none focus:border-[#A03818] focus:bg-[#FFFDF8] transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider mb-1">
              Email Address <span className="text-[#A03818]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A03818]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. priya@gmail.com"
                className="w-full pl-9 pr-3 py-2 bg-[#FFF8F5] border-2 border-[#DEC0B8] rounded-xl text-xs sm:text-sm text-[#1F1B17] focus:outline-none focus:border-[#A03818] focus:bg-[#FFFDF8] transition-colors"
                required
              />
            </div>
          </div>

          {/* Manual Location Input with GPS auto-detect & quick chips */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider">
                Neighborhood / Location / Address <span className="text-[#A03818]">*</span>
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#A03818] hover:underline cursor-pointer disabled:opacity-50"
              >
                {isDetectingLocation ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-[#A03818]" />
                    <span>Locating...</span>
                  </>
                ) : (
                  <>
                    <Locate className="w-3 h-3 text-[#A03818]" />
                    <span>Auto-detect GPS</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A03818]">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Type your locality, street, ward, or colony manually..."
                className="w-full pl-9 pr-3 py-2 bg-[#FFF8F5] border-2 border-[#DEC0B8] rounded-xl text-xs sm:text-sm text-[#1F1B17] focus:outline-none focus:border-[#A03818] focus:bg-[#FFFDF8] transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider mb-1">
              Mobile Phone Number <span className="text-[10px] text-[#7C695E] font-normal">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A03818]">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 bg-[#FFF8F5] border-2 border-[#DEC0B8] rounded-xl text-xs sm:text-sm text-[#1F1B17] focus:outline-none focus:border-[#A03818] focus:bg-[#FFFDF8] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider mb-1">
                Password <span className="text-[#A03818]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#A03818]">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Min 6 characters"
                  className="w-full pl-8 pr-7 py-2 bg-[#FFF8F5] border-2 border-[#DEC0B8] rounded-xl text-xs text-[#1F1B17] focus:outline-none focus:border-[#A03818] focus:bg-[#FFFDF8] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center text-[#7C695E] hover:text-[#A03818] cursor-pointer"
                  title={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider mb-1">
                Confirm Password <span className="text-[#A03818]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#A03818]">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-8 pr-2.5 py-2 bg-[#FFF8F5] border-2 border-[#DEC0B8] rounded-xl text-xs text-[#1F1B17] focus:outline-none focus:border-[#A03818] focus:bg-[#FFFDF8] transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* Guidelines checkbox */}
          <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 rounded border-[#DEC0B8] text-[#A03818] focus:ring-[#A03818] cursor-pointer"
            />
            <span className="text-[11px] text-[#57423C] leading-snug">
              I reside or work in this neighborhood and agree to report truthful, constructive civic concerns.
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-['Epilogue'] font-extrabold text-xs tracking-wide cork-btn-primary flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2 disabled:opacity-75"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isLoading ? 'Creating Account...' : 'Complete Resident Registration'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Existing account link */}
        <div className="mt-4 pt-3 border-t border-[#E3D4BE] text-center space-y-1.5">
          <p className="text-xs text-[#57423C]">
            Already have a resident profile?
          </p>
          <button
            type="button"
            onClick={() => navigateTo('community-login')}
            className="text-xs text-[#A03818] hover:text-[#7A2B12] font-bold underline cursor-pointer"
          >
            Sign In with existing account →
          </button>
        </div>
      </div>
    </div>
  );
};
