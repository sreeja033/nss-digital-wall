import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { NSS_SEAL_URL } from '../../data/mockData';
import { PRE_GENERATED_AVATAR_ICONS, isNoPicture } from '../../data/avatarIcons';
import { VolunteerAvatar } from '../common/VolunteerAvatar';
import { Pushpin } from '../common/Pushpin';
import { WashiTape } from '../common/WashiTape';
import {
  Award,
  ShieldCheck,
  Clock,
  Trophy,
  CheckCircle2,
  FileText,
  LogOut,
  MapPin,
  ExternalLink,
  Sparkles,
  Pencil,
  Camera,
  Upload,
  X,
  Check,
  Phone,
  Mail,
  User,
  Building,
  ImageOff,
  Quote,
  BadgeHelp,
} from 'lucide-react';

export const VolunteerProfileScreen: React.FC = () => {
  const { currentVolunteer, problems, logoutVolunteer, navigateTo, updateVolunteerProfile, showToast } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentVolunteer.name || '');
  const [displayName, setDisplayName] = useState(currentVolunteer.displayName || currentVolunteer.name || '');
  const [bio, setBio] = useState(currentVolunteer.bio || '');
  const [role, setRole] = useState(currentVolunteer.role || '');
  const [unit, setUnit] = useState(currentVolunteer.unit || '');
  const [sector, setSector] = useState(currentVolunteer.sector || '');
  const [cadetId, setCadetId] = useState(currentVolunteer.id || '');
  const [email, setEmail] = useState(currentVolunteer.email || '');
  const [phone, setPhone] = useState(currentVolunteer.phone || '');
  const [avatar, setAvatar] = useState(currentVolunteer.avatar || 'none');
  const [pictureMode, setPictureMode] = useState<'none' | 'icon' | 'upload'>(
    isNoPicture(currentVolunteer.avatar) ? 'none' : 'icon'
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const mySolvedProblems = problems.filter(
    (p) =>
      p.status === 'SOLVED' &&
      (p.assignedToVolunteerId === currentVolunteer.id ||
        p.assignedLead === currentVolunteer.name ||
        p.assignedVolunteers?.includes(currentVolunteer.name))
  );

  const handleOpenEdit = () => {
    setName(currentVolunteer.name || '');
    setDisplayName(currentVolunteer.displayName || currentVolunteer.name || '');
    setBio(currentVolunteer.bio || '');
    setRole(currentVolunteer.role || '');
    setUnit(currentVolunteer.unit || '');
    setSector(currentVolunteer.sector || '');
    setCadetId(currentVolunteer.id || '');
    setEmail(currentVolunteer.email || '');
    setPhone(currentVolunteer.phone || '');
    setAvatar(currentVolunteer.avatar || 'none');
    setPictureMode(isNoPicture(currentVolunteer.avatar) ? 'none' : 'icon');
    setIsEditing(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast('Image file too large. Please select a photo under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
        setPictureMode('upload');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectNoPicture = () => {
    setAvatar('none');
    setPictureMode('none');
  };

  const handleSelectIcon = (iconUrl: string) => {
    setAvatar(iconUrl);
    setPictureMode('icon');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty.');
      return;
    }

    updateVolunteerProfile({
      name: name.trim(),
      displayName: displayName.trim() || name.trim(),
      bio: bio.trim(),
      role: role.trim() || 'NSS Volunteer',
      unit: unit.trim() || 'NSS Civic Unit',
      sector: sector.trim() || 'Civic Unit Zone',
      id: cadetId.trim() || currentVolunteer.id,
      email: email.trim(),
      phone: phone.trim(),
      avatar: avatar || 'none',
    });

    setIsEditing(false);
  };

  const badges = [
    { title: 'Safety Watch', desc: 'Fixed 5 wire hazards', color: '#FFDBD1', icon: '⚡' },
    { title: 'Clean Streets', desc: 'Cleared 1,000 kg trash', color: '#FFDDAE', icon: '🗑️' },
    { title: 'Tree Planter', desc: 'Planted 40 young trees', color: '#B8EADE', icon: '🌱' },
    { title: 'Top Helper', desc: 'Top responder in our community', color: '#FCF2EB', icon: '🏅' },
  ];

  return (
    <div className="flex-1 w-full max-w-xl mx-auto px-4 pt-3 pb-6 space-y-4">
      {/* Official NSS Cadet ID Card */}
      <div className="relative bg-[#FFFDF8] border-3 border-[#38665E] rounded-2xl p-4 sm:p-5 shadow-[0_6px_20px_rgba(43,38,34,0.1)] -rotate-0.5 mt-4">
        {/* Brass Pushpin */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <Pushpin color="brass" size="lg" />
        </div>
        {/* Washi tapes */}
        <div className="absolute -top-2.5 left-6 -rotate-6 z-10">
          <WashiTape color="mint" width="w-16" />
        </div>
        <div className="absolute -top-2.5 right-6 rotate-6 z-10">
          <WashiTape color="yellow" width="w-16" />
        </div>

        {/* Card Header */}
        <div className="flex items-center justify-between border-b-2 border-[#B8EADE] pb-3 pt-3 sm:pt-3.5">
          <div className="flex items-center gap-2.5">
            <img
              src={NSS_SEAL_URL}
              alt="NSS Emblem"
              className="w-10 h-10 rounded-full border border-[#38665E]"
            />
            <div>
              <div className="font-['Epilogue'] font-black text-xs text-[#1B4B43] tracking-wider uppercase">
                National Service Scheme
              </div>
              <div className="text-[10px] font-mono text-[#57423C]">
                Volunteer Card
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenEdit}
              className="px-2.5 py-1 rounded-lg bg-[#FAF6ED] border border-[#38665E]/40 text-[#1B4B43] hover:bg-[#B8EADE]/40 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer shadow-2xs"
            >
              <Pencil className="w-3 h-3 text-[#38665E]" />
              <span>Edit Profile</span>
            </button>
            <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-[#B8EADE] text-[#1B4B43] border border-[#38665E]/30">
              ACTIVE
            </span>
          </div>
        </div>

        {/* Cadet Profile Info */}
        <div className="flex gap-4 items-center mt-4">
          <div className="relative group cursor-pointer" onClick={handleOpenEdit}>
            <VolunteerAvatar
              avatar={currentVolunteer.avatar}
              name={currentVolunteer.displayName || currentVolunteer.name}
              size="xl"
              className="border-2 border-[#38665E] shadow-sm group-hover:opacity-90 transition-opacity"
            />
            <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold">
              <Camera className="w-4 h-4 mr-0.5" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#38665E] text-white p-0.5 rounded-full shadow-xs z-10">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h1 className="font-['Epilogue'] font-black text-xl text-[#1F1B17] truncate">
                {currentVolunteer.displayName || currentVolunteer.name}
              </h1>
              {currentVolunteer.displayName && currentVolunteer.displayName !== currentVolunteer.name && (
                <span className="text-xs text-[#7C695E] font-medium truncate">
                  ({currentVolunteer.name})
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-[#A03818]">{currentVolunteer.role}</p>
            <p className="text-[11px] text-[#57423C]">{currentVolunteer.unit}</p>
            <p className="text-[10px] font-mono text-[#7C695E] mt-0.5">
              ID: {currentVolunteer.id} {currentVolunteer.sector ? `• ${currentVolunteer.sector}` : ''}
            </p>
            {currentVolunteer.phone && (
              <p className="text-[10px] text-[#57423C] flex items-center gap-1 mt-0.5">
                <Phone className="w-2.5 h-2.5 text-[#38665E]" />
                <span>{currentVolunteer.phone}</span>
              </p>
            )}
          </div>
        </div>

        {/* Bio Description Quote */}
        {currentVolunteer.bio && (
          <div className="mt-3.5 p-2.5 rounded-xl bg-[#FAF6ED] border border-[#DEC0B8] text-xs text-[#57423C] relative">
            <p className="italic leading-relaxed">"{currentVolunteer.bio}"</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#DEC0B8]">
          <div className="bg-[#FAF6ED] p-2 rounded-lg text-center border border-[#DEC0B8]">
            <div className="font-['Epilogue'] font-black text-lg text-[#1B4B43]">
              {currentVolunteer.hoursCompleted} hrs
            </div>
            <div className="text-[9px] font-bold text-[#6E5A4E] uppercase">Hours</div>
          </div>

          <div className="bg-[#FAF6ED] p-2 rounded-lg text-center border border-[#DEC0B8]">
            <div className="font-['Epilogue'] font-black text-lg text-[#1B4B43]">
              {currentVolunteer.civicWins}
            </div>
            <div className="text-[9px] font-bold text-[#6E5A4E] uppercase">Solved</div>
          </div>

          <div className="bg-[#FAF6ED] p-2 rounded-lg text-center border border-[#DEC0B8]">
            <div className="font-['Epilogue'] font-black text-lg text-[#1B4B43]">
              {currentVolunteer.drivesLed}
            </div>
            <div className="text-[9px] font-bold text-[#6E5A4E] uppercase">Drives</div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFDF8] border-2 border-[#38665E] rounded-2xl w-full max-w-md shadow-2xl p-5 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#B8EADE] pb-2.5">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#38665E]" />
                <h2 className="font-['Epilogue'] font-black text-base text-[#1B4B43]">
                  Edit Volunteer Profile
                </h2>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="w-7 h-7 rounded-full bg-[#FAF6ED] border border-[#DEC0B8] flex items-center justify-center text-[#57423C] hover:bg-[#DEC0B8]/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Profile Photo / Avatar Preference Section */}
              <div className="space-y-2 p-3 bg-[#FAF6ED] rounded-xl border border-[#DEC0B8]">
                <div className="flex items-center justify-between">
                  <label className="block font-['Epilogue'] font-bold text-[#1F1B17]">
                    Profile Picture / Avatar
                  </label>
                  <span className="text-[10px] text-[#7C695E]">
                    {isNoPicture(avatar) ? 'No picture (Initials)' : 'Avatar selected'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <VolunteerAvatar
                    avatar={avatar}
                    name={displayName || name}
                    size="lg"
                    className="shadow-xs"
                  />
                  <div className="space-y-1 flex-1">
                    <div className="font-bold text-xs text-[#1F1B17]">
                      {displayName || name}
                    </div>
                    <div className="text-[10px] text-[#7C695E]">
                      Select an icon, upload a photo, or choose No Picture
                    </div>
                  </div>
                </div>

                {/* Switcher Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={handleSelectNoPicture}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      pictureMode === 'none'
                        ? 'bg-[#1B4B43] text-[#FFFDF8] border-[#1B4B43] shadow-xs'
                        : 'bg-[#FFFDF8] text-[#57423C] border-[#DEC0B8] hover:bg-[#FAF0E1]'
                    }`}
                  >
                    <ImageOff className="w-3 h-3" />
                    <span>No Picture</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPictureMode('icon')}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      pictureMode === 'icon'
                        ? 'bg-[#1B4B43] text-[#FFFDF8] border-[#1B4B43] shadow-xs'
                        : 'bg-[#FFFDF8] text-[#57423C] border-[#DEC0B8] hover:bg-[#FAF0E1]'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Avatar Icons</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPictureMode('upload');
                      fileInputRef.current?.click();
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      pictureMode === 'upload'
                        ? 'bg-[#1B4B43] text-[#FFFDF8] border-[#1B4B43] shadow-xs'
                        : 'bg-[#FFFDF8] text-[#57423C] border-[#DEC0B8] hover:bg-[#FAF0E1]'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload</span>
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* Pre-generated Avatar Icons Grid */}
                {pictureMode === 'icon' && (
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[10px] font-bold text-[#57423C] uppercase tracking-wider block">
                      Choose from pre-generated avatar icons:
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 max-h-36 overflow-y-auto p-1.5 bg-[#FFFDF8] rounded-xl border border-[#DEC0B8]">
                      {PRE_GENERATED_AVATAR_ICONS.map((iconOpt) => (
                        <button
                          key={iconOpt.id}
                          type="button"
                          onClick={() => handleSelectIcon(iconOpt.url)}
                          title={iconOpt.label}
                          className={`p-1 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center ${
                            avatar === iconOpt.url
                              ? 'border-[#1B4B43] bg-[#B8EADE]/40 scale-105 shadow-2xs'
                              : 'border-transparent hover:border-[#DEC0B8] opacity-80 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={iconOpt.url}
                            alt={iconOpt.label}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Text Fields */}
              <div className="space-y-3">
                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#1F1B17] mb-1">
                      Full Official Name *
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-[#7C695E] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={name || ''}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="e.g. Priya Sharma"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] focus:border-[#38665E] focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1F1B17] mb-1">
                      Custom Display Name
                    </label>
                    <div className="relative">
                      <BadgeHelp className="w-3.5 h-3.5 text-[#7C695E] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={displayName || ''}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Cadet Priya"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] focus:border-[#38665E] focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-[#1F1B17]">
                      Bio Description
                    </label>
                    <span className="text-[10px] text-[#7C695E]">{(bio || '').length}/180</span>
                  </div>
                  <div className="relative">
                    <FileText className="w-3.5 h-3.5 text-[#7C695E] absolute left-3 top-2.5" />
                    <textarea
                      rows={2}
                      maxLength={180}
                      value={bio || ''}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Share your civic focus or message to the community..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] focus:border-[#38665E] focus:outline-hidden font-medium resize-none"
                    />
                  </div>
                </div>

                {/* Role and Cadet ID */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#1F1B17] mb-1">
                      Role / Designation
                    </label>
                    <input
                      type="text"
                      value={role || ''}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. NSS Lead Cadet"
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] focus:border-[#38665E] focus:outline-hidden font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#1F1B17] mb-1">
                      Cadet ID / Roll No
                    </label>
                    <input
                      type="text"
                      value={cadetId || ''}
                      onChange={(e) => setCadetId(e.target.value)}
                      placeholder="e.g. NSS-2024-ND-8492"
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] focus:border-[#38665E] focus:outline-hidden font-mono font-medium"
                    />
                  </div>
                </div>

                {/* Unit and Sector */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#1F1B17] mb-1">
                      NSS College Unit
                    </label>
                    <div className="relative">
                      <Building className="w-3.5 h-3.5 text-[#7C695E] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={unit || ''}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="e.g. NSS Ward 4 Civic Unit"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] focus:border-[#38665E] focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-[#1F1B17] mb-1">
                      Sector / Ward
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-[#7C695E] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={sector || ''}
                        onChange={(e) => setSector(e.target.value)}
                        placeholder="e.g. Ward / Zone"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] focus:border-[#38665E] focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#1F1B17] mb-1">
                      Contact Phone
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-[#7C695E] absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={phone || ''}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] focus:border-[#38665E] focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-[#1F1B17] mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-[#7C695E] absolute left-3 top-3" />
                      <input
                        type="email"
                        value={email || ''}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="cadet@nss.org"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] focus:border-[#38665E] focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#B8EADE]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#FAF6ED] border border-[#DEC0B8] text-xs font-bold text-[#57423C] hover:bg-[#DEC0B8]/30 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl font-['Epilogue'] font-bold text-xs cork-btn-teal flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NSS Certificate Progress */}
      <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#F1E6E0] pb-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#A03818]" />
            <h2 className="font-['Epilogue'] font-bold text-sm text-[#1F1B17]">
              NSS 'B' Certificate Progress
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-[#A03818]">
            {currentVolunteer.hoursCompleted}/120 hrs
          </span>
        </div>

        <div className="w-full h-3 bg-[#FAF6ED] rounded-full overflow-hidden border border-[#DEC0B8]">
          <div
            className="h-full bg-[#38665E] transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, (currentVolunteer.hoursCompleted / 120) * 100)}%` }}
          />
        </div>

        <p className="text-[11px] text-[#7C695E]">
          Complete 120 hours of approved civic action to earn your University NSS Special Service Certificate.
        </p>
      </div>

      {/* Badges Earned */}
      <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-[#F1E6E0] pb-2">
          <Sparkles className="w-4 h-4 text-[#7B5300]" />
          <h2 className="font-['Epilogue'] font-bold text-sm text-[#1F1B17]">
            Earned Badges ({currentVolunteer.badgesCount})
          </h2>
        </div>

        {currentVolunteer.badgesCount === 0 ? (
          <div className="p-3 bg-[#FAF6ED] rounded-xl border border-dashed border-[#DEC0B8] text-center text-xs text-[#6E5A4E]">
            0 badges earned yet. Complete civic drives to unlock honors.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {badges.slice(0, currentVolunteer.badgesCount).map((b) => (
              <div
                key={b.title}
                className="p-2.5 rounded-xl border border-[#DEC0B8] flex items-center gap-2.5 bg-[#FAF6ED]"
              >
                <div className="text-xl">{b.icon}</div>
                <div>
                  <div className="font-['Epilogue'] font-bold text-xs text-[#1F1B17]">
                    {b.title}
                  </div>
                  <div className="text-[10px] text-[#7C695E]">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Solved Problems Log */}
      <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#F1E6E0] pb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#1B4B43]" />
            <h3 className="font-['Epilogue'] font-bold text-sm text-[#1F1B17]">
              Solved Problems ({mySolvedProblems.length})
            </h3>
          </div>
          <button
            onClick={() => navigateTo('impact-gallery')}
            className="text-xs font-bold text-[#1B4B43] hover:underline cursor-pointer"
          >
            All Solved →
          </button>
        </div>

        {mySolvedProblems.length === 0 ? (
          <div className="p-3 bg-[#FAF6ED] rounded-xl border border-dashed border-[#DEC0B8] text-center text-xs text-[#6E5A4E]">
            0 solved problems recorded yet.
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            {mySolvedProblems.map((p) => (
              <div
                key={p.id}
                onClick={() => navigateTo('problem-detail', p.id)}
                className="p-2.5 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] hover:bg-[#F1E6E0] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-[#1F1B17]">{p.title}</div>
                  <div className="text-[10px] text-[#7C695E]">{p.location}</div>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#1B4B43]">
                  ✓ Solved
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-2">
        <button
          onClick={logoutVolunteer}
          className="w-full py-2.5 px-4 rounded-xl bg-[#FFFDF8] border-2 border-[#DEC0B8] text-xs font-['Epilogue'] font-bold text-[#A03818] hover:bg-[#FFDBD1]/50 flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
