import React from 'react';
import { useApp } from '../../context/AppContext';
import { Pushpin } from '../common/Pushpin';
import { RubberStamp } from '../common/RubberStamp';
import { WashiTape } from '../common/WashiTape';
import { Trophy, CheckCircle2, Trees, Sparkles, MapPin, ThumbsUp, Eye, ArrowRight } from 'lucide-react';

export const ImpactGalleryScreen: React.FC = () => {
  const { problems, navigateTo } = useApp();

  const solvedProblems = problems.filter((p) => p.status === 'SOLVED');
  const trashClearedKg =
    solvedProblems.filter((p) => p.category === 'Garbage' || p.category === 'Sanitation').length * 45;
  const treesPlanted = solvedProblems.filter((p) => p.category === 'Greenery').length * 6;

  return (
    <div className="flex-1 w-full max-w-xl mx-auto px-4 pt-3 pb-6 space-y-4">
      {/* Header Banner */}
      <div className="relative bg-[#FFFDF8] border-2 border-[#B8EADE] rounded-2xl p-4 sm:p-5 shadow-[0_4px_14px_rgba(43,38,34,0.07)] -rotate-0.5 mt-4">
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <Pushpin color="teal" size="lg" />
        </div>
        <div className="absolute -top-2.5 left-4 -rotate-6 z-10">
          <WashiTape color="mint" width="w-16" />
        </div>
        <div className="absolute -top-2.5 right-4 rotate-6 z-10">
          <WashiTape color="yellow" width="w-16" />
        </div>

        <div className="text-center pt-3 sm:pt-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#B8EADE]/70 text-[#1B4B43] text-xs font-['Epilogue'] font-black uppercase tracking-wider mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>Solved Issues</span>
          </div>

          <h1 className="font-['Epilogue'] font-black text-2xl sm:text-3xl text-[#1F1B17] tracking-tight">
            Neighborhood Wins
          </h1>
          <p className="text-xs sm:text-sm text-[#57423C] max-w-md mx-auto mt-1 leading-relaxed">
            Photos prove every fix. Here is what neighbors and volunteers solved together.
          </p>

          {/* Outcome Ticker */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#B8EADE]">
            <div className="bg-[#FAF6ED] p-2 rounded-lg border border-[#DEC0B8]">
              <div className="font-['Epilogue'] font-black text-base sm:text-lg text-[#1B4B43]">
                {trashClearedKg} kg
              </div>
              <div className="text-[10px] font-semibold text-[#6E5A4E]">Trash Cleared</div>
            </div>
            <div className="bg-[#FAF6ED] p-2 rounded-lg border border-[#DEC0B8]">
              <div className="font-['Epilogue'] font-black text-base sm:text-lg text-[#1B4B43]">
                {treesPlanted}
              </div>
              <div className="text-[10px] font-semibold text-[#6E5A4E]">Trees Planted</div>
            </div>
            <div className="bg-[#FAF6ED] p-2 rounded-lg border border-[#DEC0B8]">
              <div className="font-['Epilogue'] font-black text-base sm:text-lg text-[#1B4B43]">
                {solvedProblems.length}
              </div>
              <div className="text-[10px] font-semibold text-[#6E5A4E]">Problems Fixed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Solved Project Cards */}
      <div className="space-y-4">
        {solvedProblems.length === 0 ? (
          <div className="bg-[#FFFDF8] border-2 border-dashed border-[#B8EADE] rounded-2xl p-8 text-center space-y-2">
            <Pushpin color="teal" size="md" />
            <h3 className="font-['Epilogue'] font-black text-base text-[#1F1B17]">
              0 Solved Problems Yet
            </h3>
            <p className="text-xs text-[#57423C] max-w-sm mx-auto leading-relaxed">
              When NSS volunteers complete civic resolutions and upload verified before & after photo proof, they will be celebrated here on the Wins Wall.
            </p>
            <button
              onClick={() => navigateTo('problem-wall')}
              className="mt-2 touch-target min-h-[44px] px-4 py-2 rounded-xl bg-[#1B4B43] text-white text-xs font-['Epilogue'] font-extrabold shadow-xs cursor-pointer"
            >
              Explore Open Problems
            </button>
          </div>
        ) : (
          solvedProblems.map((item, idx) => (
          <div
            key={item.id}
            onClick={() => navigateTo('problem-detail', item.id)}
            style={{ transform: `rotate(${idx % 2 === 0 ? -0.8 : 0.8}deg)` }}
            className="relative bg-[#FFFDF8] border-2 border-[#B8EADE] rounded-2xl p-4 sm:p-5 shadow-[0_6px_16px_rgba(43,38,34,0.08)] hover:shadow-lg transition-all cursor-pointer group"
          >
            {/* Top Pushpin */}
            <div className="absolute -top-3 left-8">
              <Pushpin color="teal" size="md" />
            </div>

            {/* Top Bar: SOLVED Stamp + Outcome Metric */}
            <div className="flex items-center justify-between gap-2 mb-2 pt-1">
              <RubberStamp status="SOLVED" size="sm" />
              <span className="text-xs font-['Epilogue'] font-black text-[#1B4B43] bg-[#B8EADE]/70 px-2.5 py-0.5 rounded-full border border-[#38665E]/30">
                {item.impactMetrics || 'Fixed'}
              </span>
            </div>

            {/* Title & Location */}
            <h3 className="font-['Epilogue'] font-black text-base sm:text-lg text-[#1F1B17] leading-tight group-hover:text-[#1B4B43] transition-colors">
              {item.title}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-[#7C695E] mt-1 mb-3">
              <MapPin className="w-3.5 h-3.5 text-[#A03818]" />
              <span>{item.location}</span>
            </div>

            {/* Before and After Polaroid Split */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-['Epilogue'] font-bold text-[#A03818] uppercase">
                  <span>Before</span>
                  <span className="text-[9px] opacity-70">Reported</span>
                </div>
                <div className="h-28 sm:h-36 rounded-xl overflow-hidden border-2 border-[#DEC0B8] shadow-xs bg-[#FAF6ED]">
                  <img
                    src={item.beforePhotoUrl || item.photoUrl}
                    alt="Before condition"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-['Epilogue'] font-bold text-[#1B4B43] uppercase">
                  <span>After</span>
                  <span className="text-[9px] font-extrabold text-[#1B4B43]">✓ Fixed</span>
                </div>
                <div className="h-28 sm:h-36 rounded-xl overflow-hidden border-2 border-[#B8EADE] shadow-xs bg-[#FAF6ED]">
                  <img
                    src={item.solvedPhotoUrl || item.photoUrl}
                    alt="Solved outcome"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-[#57423C] leading-relaxed mt-3">
              {item.description}
            </p>

            {/* Footer details */}
            <div className="mt-3 pt-2.5 border-t border-[#F1E6E0] flex items-center justify-between text-xs text-[#7C695E]">
              <span className="font-semibold text-[#1B4B43]">
                Fixed by student volunteers
              </span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 font-['Epilogue'] font-bold text-[#A03818]">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{item.upvotes}</span>
                </span>
                <span className="flex items-center gap-1 text-[#A03818]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{item.adoptersCount}</span>
                </span>
              </div>
            </div>
          </div>
        )))}
      </div>
    </div>
  );
};
