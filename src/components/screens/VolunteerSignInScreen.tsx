import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NSS_SEAL_URL } from '../../data/mockData';
import {
  ShieldCheck,
  ArrowRight,
  KeyRound,
  Mail,
  AlertCircle,
  Lock,
} from 'lucide-react';

export const VolunteerSignInScreen: React.FC = () => {
  const {
    currentVolunteer,
    provisionedVolunteers,
    loginVolunteer,
    navigateTo,
    setUserRole,
  } = useApp();

  const [volunteerId, setVolunteerId] = useState('');
  const [idError, setIdError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdError(null);
    const trimmed = volunteerId.trim();
    if (!trimmed) {
      setIdError("Please enter your coordinator-assigned Volunteer ID");
      return;
    }

    try {
      const res = await loginVolunteer(trimmed);
      if (res && res.success) {
        navigateTo('volunteer-dashboard');
      } else {
        setIdError((res && res.error) || "This Volunteer ID isn't recognized — please check with your coordinator");
      }
    } catch (err: any) {
      setIdError(err?.message || "This Volunteer ID isn't recognized — please check with your coordinator");
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col justify-center px-4 pt-6 pb-6 max-w-md mx-auto w-full">
      {/* Main Clipboard Container */}
      <div className="relative bg-[#FFFDF8] border-3 border-[#DEC0B8] rounded-2xl p-5 sm:p-6 shadow-[0_4px_16px_rgba(43,38,34,0.08)] mt-4">
        {/* Brass Clipboard Clamp at top */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#C59B27] rounded-md shadow-md border-2 border-[#5A4106] flex items-center justify-center z-10">
          <div className="w-12 h-1.5 bg-[#5A4106]/40 rounded-full" />
        </div>

        {/* Seal and Title */}
        <div className="text-center pt-3 pb-3 border-b border-[#E3D4BE]">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full p-0.5 bg-[#FFFDF8] border-2 border-[#38665E]">
            <img
              src={NSS_SEAL_URL}
              alt="NSS Emblem"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <span className="text-[9.5px] font-mono font-bold tracking-widest text-[#38665E] uppercase">
            National Service Scheme
          </span>
          <h1 className="font-['Epilogue'] font-black text-xl text-[#1F1B17] tracking-tight">
            Volunteer Login
          </h1>
          <p className="text-xs text-[#6E5A4E] mt-1 leading-relaxed">
            Enter your coordinator-assigned Volunteer ID to access your field dashboard.
          </p>
        </div>

        {/* Error message */}
        {idError && (
          <div className="mt-3.5 p-3 rounded-xl bg-[#FFF5F2] border border-[#DEC0B8] flex items-start gap-2.5 text-xs text-[#A03818]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold leading-snug">{idError}</p>
              <button
                type="button"
                onClick={() => {
                  setUserRole('admin');
                  navigateTo('admin');
                }}
                className="text-[11px] font-bold underline text-[#1F1B17] hover:text-[#A03818] cursor-pointer inline-block mt-0.5"
              >
                Open Coordinator Roster to view or manage IDs →
              </button>
            </div>
          </div>
        )}

        {/* Login Form: Volunteer ID ONLY */}
        <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-4">
          <div>
            <label className="block text-[11px] font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider mb-1">
              Volunteer ID
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#8C7A70] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={volunteerId || ''}
                onChange={(e) => {
                  setVolunteerId(e.target.value);
                  if (idError) setIdError(null);
                }}
                placeholder="e.g. NSS-2024-ND-8492"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-xs text-[#1F1B17] focus:outline-hidden focus:border-[#38665E] font-mono font-medium"
              />
            </div>
            <p className="text-[10px] text-[#7C695E] mt-1">
              No password needed — verified directly against the active NSS roster.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl font-['Epilogue'] font-extrabold text-xs cork-btn-teal flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sign In to Volunteer Terminal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-[#E3D4BE] text-center">
          <button
            onClick={() => navigateTo('role-split')}
            className="text-xs text-[#7C695E] hover:text-[#1F1B17] cursor-pointer"
          >
            ← Return to portal selector
          </button>
        </div>
      </div>
    </div>
  );
};
