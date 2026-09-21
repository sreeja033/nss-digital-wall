import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NSS_SEAL_URL } from '../../data/mockData';
import { Pushpin } from '../common/Pushpin';
import { WashiTape } from '../common/WashiTape';
import {
  ShieldCheck,
  ArrowRight,
  KeyRound,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
} from 'lucide-react';

export const AdminLoginScreen: React.FC = () => {
  const { loginAdmin, navigateTo, setUserRole } = useApp();

  const [officerId, setOfficerId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmedPin = passcode.trim();

    if (!trimmedPin) {
      setErrorMsg('Please enter your Programme Officer passcode or PIN.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginAdmin(trimmedPin, officerId.trim() || 'OFFICER-NSS-01');
      setIsLoading(false);
      if (res && res.success) {
        navigateTo('admin');
      } else {
        setErrorMsg((res && res.error) || 'Invalid Officer Passcode or ID. Please check your credentials.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Failed to authenticate officer.');
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col justify-center px-4 pt-4 pb-8 max-w-md mx-auto w-full">
      {/* Top back link */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={() => {
            setUserRole('community');
            navigateTo('role-split');
          }}
          className="inline-flex items-center gap-1.5 text-xs text-[#6E5A4E] hover:text-[#1F1B17] font-medium cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Role Selection</span>
        </button>
        <span className="text-[10px] font-mono text-[#7C695E] bg-[#F1E6E0] px-2 py-0.5 rounded">
          Restricted Portal
        </span>
      </div>

      {/* Main Official Clipboard / Dossier Container */}
      <div className="relative bg-[#FFFDF8] border-3 border-[#DEC0B8] rounded-2xl p-5 sm:p-6 shadow-[0_6px_20px_rgba(43,38,34,0.09)]">
        {/* Brass Clipboard Clip at top */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#C59B27] rounded-md shadow-md border-2 border-[#5A4106] flex items-center justify-center z-10">
          <div className="w-14 h-1.5 bg-[#5A4106]/40 rounded-full" />
        </div>

        {/* Top Pushpin Accent */}
        <div className="absolute -top-2.5 right-6 z-10">
          <Pushpin color="navy" size="sm" />
        </div>

        {/* Washi tape accent */}
        <div className="absolute -top-2 left-5 -rotate-6 z-10">
          <WashiTape color="blue" width="w-16" />
        </div>

        {/* Seal and Title */}
        <div className="text-center pt-4 pb-3 border-b border-[#E3D4BE]">
          <div className="w-14 h-14 mx-auto mb-2 rounded-full p-0.5 bg-[#FFFDF8] border-2 border-[#1D4ED8] shadow-xs">
            <img
              src={NSS_SEAL_URL}
              alt="NSS Emblem"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF3FF] border border-[#93C5FD] text-[#1D4ED8] text-[10px] font-['Epilogue'] font-bold uppercase tracking-wider mb-1">
            <Lock className="w-2.5 h-2.5" />
            <span>Official NSS Officer Access</span>
          </div>
          <h1 className="font-['Epilogue'] font-black text-xl sm:text-2xl text-[#1F1B17] tracking-tight">
            Programme Officer Login
          </h1>
          <p className="text-xs text-[#6E5A4E] mt-1 leading-relaxed max-w-xs mx-auto">
            Authorized portal for unit coordinators, faculty officers, and task moderators to assign problems and manage cadet rosters.
          </p>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="mt-3.5 p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-start gap-2.5 text-xs text-[#1E40AF]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold leading-snug">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-4">
          <div>
            <label className="block text-[11px] font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider mb-1">
              Officer ID or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7C695E]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={officerId}
                onChange={(e) => setOfficerId(e.target.value)}
                placeholder="e.g. OFFICER-NSS-01 or coordinator@nss.org"
                className="w-full pl-9 pr-3 py-2.5 bg-[#F8FAFC] border-2 border-[#DEC0B8] rounded-xl text-xs sm:text-sm font-mono text-[#1F1B17] focus:outline-none focus:border-[#1D4ED8] focus:bg-[#FFFDF8] transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider">
                Officer Security PIN / Passcode
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7C695E]">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter 4-digit PIN or password"
                className="w-full pl-9 pr-10 py-2.5 bg-[#F8FAFC] border-2 border-[#DEC0B8] rounded-xl text-xs sm:text-sm font-mono text-[#1F1B17] focus:outline-none focus:border-[#1D4ED8] focus:bg-[#FFFDF8] transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7C695E] hover:text-[#1F1B17] cursor-pointer"
                title={showPassword ? 'Hide passcode' : 'Show passcode'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-['Epilogue'] font-extrabold text-xs tracking-wide bg-[#1D4ED8] hover:bg-[#1E40AF] text-white border-2 border-[#1E3A8A] flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2 disabled:opacity-75 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isLoading ? 'Authenticating...' : 'Authenticate & Open Panel'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
