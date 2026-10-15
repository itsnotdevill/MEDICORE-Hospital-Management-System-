import React, { useEffect, useState, useCallback } from 'react';
import { Search, Stethoscope, Star, Clock } from 'lucide-react';
import { doctorsApi } from '../../api';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { Pagination } from '../../components/shared/Pagination';
import { extractError } from '../../lib/utils';
import toast from 'react-hot-toast';

interface DoctorCard {
  _id: string;
  userId: { _id: string; name: string; email: string; phone?: string; isActive: boolean };
  departmentId: { _id: string; name: string };
  specialization: string;
  qualification: string;
  experience: number;
  consultationFee: number;
  schedule: { day: string; startTime: string; endTime: string }[];
  bio?: string;
}

const DAY_LABELS: Record<string, string> = {
  MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun',
};

export const DoctorsPage: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 9;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doctorsApi.getAll({ page, limit });
      const data = (res.data as any).data as DoctorCard[];
      const filtered = search
        ? data.filter(
            (d) =>
              d.userId.name.toLowerCase().includes(search.toLowerCase()) ||
              d.specialization.toLowerCase().includes(search.toLowerCase()) ||
              d.departmentId.name.toLowerCase().includes(search.toLowerCase())
          )
        : data;
      setDoctors(filtered);
      setTotal((res.data as any).pagination.total);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Doctors</h1>
          <p className="page-subtitle">View all doctor profiles and schedules</p>
        </div>
      </div>

      <div className="card mb-6 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, specialization or department..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-input pl-9"
          />
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.length === 0 && (
              <div className="col-span-3 card p-12 text-center text-gray-400">
                No doctors found
              </div>
            )}
            {doctors.map((doctor) => (
              <div key={doctor._id} className="card overflow-hidden hover:shadow-card-hover transition-all duration-200 group animate-slide-up">
                {/* Header banner */}
                <div className="h-2 bg-gradient-to-r from-[#1e3a5f] to-[#0d9488]" />
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#1e4f8a] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {getInitials(doctor.userId.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{doctor.userId.name}</h3>
                      <p className="text-sm text-teal-600 font-medium">{doctor.specialization}</p>
                      <p className="text-xs text-gray-400">{doctor.departmentId.name}</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                    {doctor.bio || doctor.qualification}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs text-gray-500">Experience</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{doctor.experience} years</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Stethoscope className="w-3.5 h-3.5 text-teal-500" />
                        <span className="text-xs text-gray-500">Fee</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">₹{doctor.consultationFee}</p>
                    </div>
                  </div>

                  {doctor.schedule.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500 font-medium">Schedule</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {doctor.schedule.map((s, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-[#1e3a5f]/10 text-[#1e3a5f] rounded-full font-medium">
                            {DAY_LABELS[s.day]} {s.startTime}–{s.endTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-5 pb-4">
                  <p className="text-xs text-gray-400">{doctor.userId.email}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Pagination currentPage={page} totalPages={Math.ceil(total / limit)} total={total} limit={limit} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
};
