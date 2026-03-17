import { Building2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0F1A] overflow-hidden">
      {/* ── Background Effects ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-600/20 rounded-full blur-[80px] animate-bounce duration-[3000ms]" />
      
      {/* ── Logo Section ── */}
      <div className="relative mb-12">
        {/* Radar/Scan effect */}
        <div className="absolute inset-[-40px] border border-blue-500/20 rounded-full animate-ping opacity-20" />
        <div className="absolute inset-[-20px] border border-blue-400/30 rounded-full animate-pulse opacity-30" />
        
        {/* Main Logo Card */}
        <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-[28px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-700/50 backdrop-blur-xl group">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-[28px]" />
          <div className="relative bg-blue-600 rounded-2xl p-5 shadow-[0_0_30px_rgba(37,99,235,0.4)] animate-bounce">
            <Building2 size={56} className="text-white" />
          </div>
        </div>
      </div>

      {/* ── Text Section ── */}
      <div className="flex flex-col items-center">
        <div className="overflow-hidden mb-3">
          <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">PGL</span>
            <span className="text-white/90">CRM</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:0s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:0.4s]" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200/60">
            Hệ thống đang khởi tạo
          </span>
        </div>
      </div>

      {/* ── Bottom Progress ── */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-64 h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-600 animate-progress w-full" />
      </div>
      
      <div className="absolute bottom-8 left-0 w-full text-center">
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest opacity-50">
          Phúc Gia Laboratory &copy; 2026
        </p>
      </div>
    </div>
  );
}
