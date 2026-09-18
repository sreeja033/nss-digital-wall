import React from 'react';
import { useApp } from '../../context/AppContext';
import { NSS_SEAL_URL } from '../../data/mockData';
import { Pushpin } from '../common/Pushpin';
import { WashiTape } from '../common/WashiTape';
import { ArrowRight, ShieldCheck, CheckCircle2, Sparkles, MapPin, Users } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const { navigateTo, problems } = useApp();

  const solvedCount = problems.filter((p) => p.status === 'SOLVED').length;

  return (
    <div className="h-full flex-1 flex flex-col justify-between px-4 py-3 max-w-sm mx-auto">
      {/* Top Noticeboard Header */}
      <div className="flex flex-col items-center text-center">
        {/* Official NSS Seal - enlarged */}
        <div className="mb-2 inline-block">
          <div className="w-16 h-16 rounded-full p-1 bg-[#FFFDF8] border-2 border-[#A03818] shadow-[0_3px_10px_rgba(43,38,34,0.12)]">
            <img
              src={NSS_SEAL_URL}
              alt="National Service Scheme Seal"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFDBD1]/70 border border-[#A03818]/30 text-[#A03818] text-[10.5px] font-['Epilogue'] font-bold uppercase tracking-wider">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Community Board</span>
          </div>
          <h1 className="font-['Epilogue'] font-black text-2xl text-[#1F1B17] tracking-tight leading-tight">
            Neighborhood Board
          </h1>
          <p className="font-sans text-xs text-[#57423C] max-w-xs mx-auto leading-snug">
            A digital wall to post local issues Anonymously.NSS volunteers will see them,select them and work to get them fixed.
          </p>
        </div>
      </div>

      {/* Pinned Feature Cards (Slightly rotated paper notes) */}
      <div className="space-y-2.5 w-full py-0.5">
        {/* Card 1: Post Anonymously */}
        <div className="relative bg-[#FFFDF8] border-2 border-[#E3D4BE] rounded-xl py-2.5 px-3 shadow-[0_2px_8px_rgba(43,38,34,0.05)] -rotate-1 transition-transform hover:rotate-0">
          <div className="absolute -top-2 left-5">
            <Pushpin color="rust" size="sm" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#FFDBD1] border border-[#A03818]/40 flex items-center justify-center text-[#A03818] shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="font-['Epilogue'] font-bold text-xs text-[#1F1B17] leading-tight">
                Post Anonymously
              </h2>
              <p className="text-[11px] text-[#6E5A4E] mt-0.5 leading-tight">
                Snap. Pin. Post.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Volunteers Act */}
        <div className="relative bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl py-2.5 px-3 shadow-[0_2px_8px_rgba(43,38,34,0.05)] rotate-1 transition-transform hover:rotate-0">
          <div className="absolute -top-2 right-5">
            <Pushpin color="mustard" size="sm" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#FFDDAE] border border-[#7B5300]/40 flex items-center justify-center text-[#7B5300] shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="font-['Epilogue'] font-bold text-xs text-[#1F1B17] leading-tight">
                Volunteers Act
              </h2>
              <p className="text-[11px] text-[#6E5A4E] mt-0.5 leading-tight">
                Locals claim it and fix it.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Before & After */}
        <div className="relative bg-[#FFFDF8] border-2 border-[#B8EADE] rounded-xl py-2.5 px-3 shadow-[0_2px_8px_rgba(43,38,34,0.05)] -rotate-0.5 transition-transform hover:rotate-0">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            <Pushpin color="teal" size="sm" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#B8EADE]/80 border border-[#1B4B43]/40 flex items-center justify-center text-[#1B4B43] shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="font-['Epilogue'] font-bold text-xs text-[#1F1B17] leading-tight">
                Before &amp; After
              </h2>
              <p className="text-[11px] text-[#6E5A4E] mt-0.5 leading-tight">
                Photos prove the fix.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Stats Banner with Washi Tapes */}
      <div className="relative bg-[#FFF8F5] border border-[#DEC0B8] rounded-xl py-2 px-3 text-center w-full shadow-2xs">
        <div className="absolute -top-1.5 -left-1.5 rotate-[-8deg]">
          <WashiTape color="mint" width="w-12" />
        </div>
        <div className="absolute -top-1.5 -right-1.5 rotate-[6deg]">
          <WashiTape color="peach" width="w-12" />
        </div>
        <div className="grid grid-cols-3 divide-x divide-[#DEC0B8]">
          <div>
            <div className="font-['Epilogue'] font-black text-sm text-[#A03818]">{solvedCount}</div>
            <div className="text-[9px] font-semibold text-[#6E5A4E] uppercase tracking-wider">Solved</div>
          </div>
          <div>
            <div className="font-['Epilogue'] font-black text-sm text-[#7B5300]">1</div>
            <div className="text-[9px] font-semibold text-[#6E5A4E] uppercase tracking-wider">Volunteers</div>
          </div>
          <div>
            <div className="font-['Epilogue'] font-black text-sm text-[#1B4B43]">100%</div>
            <div className="text-[9px] font-semibold text-[#6E5A4E] uppercase tracking-wider">Private</div>
          </div>
        </div>
      </div>

      {/* Action Buttons & Footer */}
      <div className="space-y-1.5 w-full">
        <button
          onClick={() => navigateTo('role-split')}
          className="w-full py-3 px-4 rounded-xl font-['Epilogue'] font-extrabold text-xs tracking-wide cork-btn-primary flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Users className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Choose Your Role</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <p className="text-center text-[10.5px] text-[#6E5A4E]">
          Select whether you are a Neighbor or a Volunteer to proceed.
        </p>

        <p className="text-center text-[12px] text-[#8C7A70] pb-1">
          Run by NSS volunteers • Not Me But You
        </p>
      </div>
    </div>
  );
};
