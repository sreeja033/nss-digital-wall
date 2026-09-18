import React from 'react';
import { useApp } from '../../context/AppContext';
import { NSS_SEAL_URL } from '../../data/mockData';
import { Pushpin } from '../common/Pushpin';
import { WashiTape } from '../common/WashiTape';
import {
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  Building,
  Sparkles,
  ExternalLink,
  Users,
  MapPin,
  Lock,
} from 'lucide-react';

export const AboutTrustScreen: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <div className="h-full flex-1 flex flex-col justify-between px-4 pt-3 pb-6 max-w-xl mx-auto space-y-4">
      {/* Top Pinned Card: NSS Mandate */}
      <div className="relative bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-2xl p-4 shadow-[0_4px_14px_rgba(43,38,34,0.07)] -rotate-0.5 mt-4">
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <Pushpin color="rust" size="lg" />
        </div>
        <div className="absolute -top-2.5 left-6 -rotate-6 z-10">
          <WashiTape color="peach" width="w-16" />
        </div>
        <div className="absolute -top-2.5 right-6 rotate-6 z-10">
          <WashiTape color="yellow" width="w-16" />
        </div>

        <div className="flex flex-col items-center text-center pt-3 sm:pt-4">
          <div className="w-16 h-16 rounded-full p-1 bg-[#FFFDF8] border-2 border-[#A03818] shadow-sm mb-2">
            <img
              src={NSS_SEAL_URL}
              alt="National Service Scheme Seal"
              className="w-full h-full rounded-full object-cover"
            />
          </div>

          <span className="font-['Caveat'] text-xl text-[#A03818] font-bold block -rotate-2">
            Motto: "Not Me But You"
          </span>
          <h1 className="font-['Epilogue'] font-black text-2xl text-[#1F1B17] tracking-tight mt-0.5">
            National Service Scheme
          </h1>
          <p className="text-xs text-[#57423C] font-semibold uppercase tracking-wider mt-0.5">
            Student volunteers helping local neighborhoods
          </p>

          <p className="text-xs text-[#57423C] leading-relaxed mt-3 max-w-md">
            The National Service Scheme is a student volunteer program. College students volunteer each year to clean streets, fix hazards, and help neighbors.
          </p>
        </div>
      </div>

      {/* How the Process Works (3 Steps) */}
      <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#F1E6E0] pb-2">
          <Pushpin color="mustard" size="sm" />
          <h2 className="font-['Epilogue'] font-black text-base text-[#1F1B17]">
            How This Board Works
          </h2>
        </div>

        <div className="space-y-4 text-xs">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#FFDBD1] text-[#A03818] font-['Epilogue'] font-black flex items-center justify-center shrink-0 border border-[#A03818]/30">
              1
            </div>
            <div>
              <h3 className="font-['Epilogue'] font-bold text-sm text-[#1F1B17]">
                Report a Problem
              </h3>
              <p className="text-[#6E5A4E] mt-0.5 leading-relaxed">
                Report an issue without an account. It is free and anonymous.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#FFDDAE] text-[#7B5300] font-['Epilogue'] font-black flex items-center justify-center shrink-0 border border-[#7B5300]/30">
              2
            </div>
            <div>
              <h3 className="font-['Epilogue'] font-bold text-sm text-[#1F1B17]">
                Volunteers Take Action
              </h3>
              <p className="text-[#6E5A4E] mt-0.5 leading-relaxed">
                Student volunteers check the board, visit the site, and work to fix it.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#B8EADE] text-[#1B4B43] font-['Epilogue'] font-black flex items-center justify-center shrink-0 border border-[#1B4B43]/30">
              3
            </div>
            <div>
              <h3 className="font-['Epilogue'] font-bold text-sm text-[#1F1B17]">
                Problem Solved
              </h3>
              <p className="text-[#6E5A4E] mt-0.5 leading-relaxed">
                Volunteers post an after photo once fixed. Every solved issue stays on the board.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Privacy Reassurance */}
      <div className="bg-[#FFF8F5] border border-[#DEC0B8] rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#A03818]" />
          <h3 className="font-['Epilogue'] font-bold text-xs text-[#1F1B17] uppercase tracking-wider">
            Our Privacy Promise
          </h3>
        </div>
        <p className="text-xs text-[#57423C] leading-relaxed">
          This board is for the neighborhood. We never sell data, track you, or ask for passwords.
        </p>
      </div>

      {/* Program Officer Contact Card */}
      <div className="relative bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-4 shadow-xs space-y-2">
        <div className="absolute -top-2.5 right-6">
          <Pushpin color="rust" size="sm" />
        </div>

        <h3 className="font-['Epilogue'] font-bold text-sm text-[#1F1B17]">
          Need Help?
        </h3>

        <div className="space-y-1 text-xs text-[#57423C]">
          <div className="flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-[#A03818]" />
            <span>Community Civic Center & NSS Office</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-[#A03818]" />
            <span>nss.ward4@gov.in</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-[#A03818]" />
            <span>Helpline: +91 11 2389 4092 (Mon–Sat, 9am–5pm)</span>
          </div>
        </div>

        <div className="pt-2 border-t border-[#DEC0B8]/60 flex justify-between items-center text-xs">
          <span className="text-[#8C7A70]">See something broken?</span>
          <button
            onClick={() => navigateTo('report-problem')}
            className="font-['Epilogue'] font-bold text-[#A03818] hover:underline cursor-pointer"
          >
            Report It →
          </button>
        </div>
      </div>
    </div>
  );
};
