'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ChevronLeft } from 'lucide-react';
import { getFilteredAttendance, updateShiftStatus } from './actions';

export default function AttendancePage() {
  const router = useRouter();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // 日付などは一旦ダミーで飛ばす
      const result = await getFilteredAttendance('2024-01-01', 'all');
      if (result) {
        setShifts(result.shifts || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
        DEBUG MODE {loading && <RefreshCw className="animate-spin" />}
      </h1>

      <div className="space-y-4">
        {shifts.length > 0 ? (
          shifts.map((shift: any) => (
            <div key={shift.id} className="p-4 bg-white text-slate-900 rounded-2xl">
              <pre className="text-[10px] overflow-auto">
                {JSON.stringify(shift, null, 2)}
              </pre>
            </div>
          ))
        ) : (
          <div className="text-slate-500 font-bold uppercase tracking-widest text-center py-20 border-2 border-dashed border-slate-700 rounded-3xl">
            {loading ? 'Now Connecting...' : 'No Data in DB'}
          </div>
        )}
      </div>
    </div>
  );
}