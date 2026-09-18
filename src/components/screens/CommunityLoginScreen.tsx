import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Pushpin } from '../common/Pushpin';
import { WashiTape } from '../common/WashiTape';
import {
  Users,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  UserPlus,
} from 'lucide-react';

export const CommunityLoginScreen: React.FC = () => {
  const { loginCommunityMember, navigateTo, setUserRole } = useApp();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    setIsLoading(true);
    try {
      const res = await loginCommunityMember(emailOrPhone, password);
      setIsLoading(false);
      if (res && res.success) {
        navigateTo('home');
      } else {
        setErrorMsg((res && res.error) || 'Failed to sign in. Please verify your credentials.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Failed to sign in. Please try again.');
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col justify-center px-4 pt-4 pb-8 max-w-md mx-auto w-full">
      {/* Top back navigation */}
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
        <span className="text-[10.5px] font-semibold text-[#A03818] bg-[#FFDBD1]/60 px-2.5 py-0.5 rounded-full">
          Resident Portal
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
          <WashiTape color="yellow" width="w-16" />
        </div>
        <div className="absolute -top-2.5 right-5 rotate-6 z-10">
          <WashiTape color="peach" width="w-16" />
        </div>

        {/* Header Branding */}
        <div className="text-center pt-3 pb-3 border-b border-[#E3D4BE]">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-[#FFDBD1] border border-[#A03818]/30 flex items-center justify-center text-[#A03818] shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <span className="font-['Caveat'] text-xl text-[#A03818] font-bold block -rotate-2">
            Welcome, Neighbor!
          </span>
          <h1 className="font-['Epilogue'] font-black text-xl sm:text-2xl text-[#1F1B17] tracking-tight">
            Community Member Sign In
          </h1>
          <p className="text-xs text-[#6E5A4E] mt-1 leading-relaxed max-w-xs mx-auto">
            Sign in to track issues you have reported, upvote local fixes, and stay notified on neighborhood progress.
          </p>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="mt-3.5 p-3 rounded-xl bg-[#FFF5F2] border border-[#DEC0B8] flex items-start gap-2.5 text-xs text-[#A03818]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold leading-snug">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-4">
          <div>
            <label className="block text-[11px] font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider mb-1">
              Email Address or Mobile Phone
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A03818]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="name@example.com or 98234 56789"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FFF8F5] border-2 border-[#DEC0B8] rounded-xl text-xs sm:text-sm text-[#1F1B17] focus:outline-none focus:border-[#A03818] focus:bg-[#FFFDF8] transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-['Epilogue'] font-bold text-[#1F1B17] uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A03818]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-10 py-2.5 bg-[#FFF8F5] border-2 border-[#DEC0B8] rounded-xl text-xs sm:text-sm text-[#1F1B17] focus:outline-none focus:border-[#A03818] focus:bg-[#FFFDF8] transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7C695E] hover:text-[#A03818] cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-['Epilogue'] font-extrabold text-xs tracking-wide cork-btn-primary flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2 disabled:opacity-75"
          >
            <Users className="w-4 h-4" />
            <span>{isLoading ? 'Signing In...' : 'Sign In as Neighbor'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Register CTA */}
        <div className="mt-4 pt-3.5 border-t border-[#E3D4BE] text-center space-y-2">
          <button
            type="button"
            onClick={() => navigateTo('community-register')}
            className="w-full py-2.5 px-4 rounded-xl font-['Epilogue'] font-extrabold text-xs bg-[#FFF8F5] border-2 border-[#A03818] text-[#A03818] hover:bg-[#FFDBD1]/50 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register New Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
