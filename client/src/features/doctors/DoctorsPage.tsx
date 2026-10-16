import React, { useEffect, useState, useCallback } from 'react';
import { Search, Stethoscope, Star, Clock, Mail, CheckCircle2 } from 'lucide-react';
import { doctorsApi } from '../../api';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { Pagination } from '../../components/shared/Pagination';
import { extractError, formatCurrency } from '../../lib/utils';
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
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Medical Faculty & Practitioners</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              Verified Doctors
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Clinical specialists, departmental affiliations, consulting schedules, and qualifications
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search doctor by name, clinical specialization, or department..."
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
              <div className="col-span-3 card p-16 text-center text-slate-400">
                <Stethoscope className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-base font-semibold text-slate-700">No medical doctors found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria</p>
              </div>
            )}
            {doctors.map((doctor) => (
              <div
                key={doctor._id}
                className="card overflow-hidden hover:shadow-card-hover transition-all duration-200 group flex flex-col justify-between"
              >
                {/* Header Top Accent */}
                <div className="h-1.5 bg-gradient-to-r from-navy-900 via-teal-600 to-cyan-500" />
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-3.5 mb-4">
                      <div className="w-13 h-13 rounded-2xl bg-navy-950 border border-navy-800 flex items-center justify-center text-cyan-300 font-bold text-base flex-shrink-0 shadow-xs">
                        {getInitials(doctor.userId.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-navy-950 text-base leading-snug truncate">
                          {doctor.userId.name}
                        </h3>
                        <p className="text-xs text-teal-700 font-semibold mt-0.5">{doctor.specialization}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{doctor.departmentId.name}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                      {doctor.bio || doctor.qualification}
                    </p>

                    <div className="grid grid-cols-2 gap-2.5 mb-4">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Star className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[11px] text-slate-500 font-medium">Experience</span>
                        </div>
                        <p className="text-sm font-bold text-navy-950">{doctor.experience} Years</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                          <span className="text-[11px] text-slate-500 font-medium">Standard Fee</span>
                        </div>
                        <p className="text-sm font-bold text-navy-950">{formatCurrency(doctor.consultationFee)}</p>
                      </div>
                    </div>

                    {doctor.schedule.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Clock className="w-3.5 h-3.5 text-cyan-600" />
                          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Weekly Consulting Hours</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {doctor.schedule.map((s, i) => (
                            <span key={i} className="text-[11px] px-2.5 py-0.5 bg-navy-50 text-navy-900 border border-navy-100 rounded-full font-medium font-mono">
                              {DAY_LABELS[s.day]} {s.startTime}–{s.endTime}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{doctor.userId.email}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Pagination currentPage={page} totalPages={Math.ceil(total / limit) || 1} total={total} limit={limit} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
};

