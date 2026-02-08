export default function AttendancePage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-slate-500 mb-6">
        <span className="text-sm">管理</span>
        <span className="text-sm">/</span>
        <span className="text-sm font-bold text-slate-800">出勤・勤怠管理</span>
      </div>

      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 italic">Attendance</h2>
        <p className="text-slate-500">当日の出勤確認と当欠・遅刻の記録を行います。</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-20 text-center">
        <p className="text-slate-400">ここにカレンダーとリストを実装します</p>
      </div>
    </div>
  );
}