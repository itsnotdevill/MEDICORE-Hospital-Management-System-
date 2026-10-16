import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Heart, AlertTriangle, CalendarDays, ShieldCheck } from 'lucide-react';
import { patientsApi, appointmentsApi } from '../../api';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDate, calculateAge, extractError } from '../../lib/utils';
import type { Patient, Appointment } from '../../types';
import toast from 'react-hot-toast';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      patientsApi.getById(id),
      appointmentsApi.getAll({ patientId: id, limit: 10 }),
    ])
      .then(([pRes, aRes]) => {
        setPatient((pRes.data as any).data);
        setAppointments((aRes.data as any).data);
      })
      .catch((err) => toast.error(extractError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader label="Loading patient medical chart..." />;
  if (!patient) {
    return (
      <div className="card p-12 text-center text-slate-400">
        <User className="w-12 h-12 mx-auto text-slate-300 mb-2" />
        <p className="text-base font-semibold text-slate-700">Patient chart not found</p>
        <button onClick={() => navigate('/patients')} className="btn-secondary mt-4">
          Return to Patients Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#101B2D] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#19B8C9]" /> Back to Patients Directory
        </button>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Verified EHR Profile
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Master Card */}
        <div className="lg:col-span-1">
          <div className="card overflow-hidden">
            <div className="h-2.5 bg-gradient-to-r from-[#101B2D] via-[#17263D] to-[#19B8C9]" />
            <div className="p-6">
              <div className="flex flex-col items-center text-center pb-6 border-b border-[#E3E9F0]">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#101B2D] to-[#17263D] border-2 border-[#19B8C9]/40 shadow-card flex items-center justify-center text-[#19B8C9] text-2xl font-bold mb-3.5">
                  {patient.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <h1 className="text-xl font-bold text-[#172337] tracking-tight">{patient.name}</h1>
                <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200 mt-1.5">
                  {patient.patientId}
                </span>
              </div>

              <div className="py-5 space-y-3.5 border-b border-[#E3E9F0]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" /> Age & Gender
                  </span>
                  <span className="font-semibold text-slate-800">
                    {calculateAge(patient.dob)} yrs · {patient.gender}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-slate-400" /> Date of Birth
                  </span>
                  <span className="font-semibold text-slate-800">{formatDate(patient.dob)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" /> Phone
                  </span>
                  <span className="font-semibold text-slate-800">{patient.phone}</span>
                </div>

                <div className="flex items-start justify-between text-xs pt-1">
                  <span className="text-slate-500 font-medium flex items-center gap-2 flex-shrink-0">
                    <MapPin className="w-4 h-4 text-slate-400" /> Address
                  </span>
                  <span className="font-medium text-slate-700 text-right max-w-[180px] truncate">
                    {patient.address}
                  </span>
                </div>

                {patient.bloodGroup && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 font-medium flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500" /> Blood Group
                    </span>
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {patient.bloodGroup}
                    </span>
                  </div>
                )}
              </div>

              {/* Medical Allergies Banner */}
              {patient.allergies.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50/80 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Clinical Allergies</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {patient.allergies.map((a, i) => (
                      <span key={i} className="text-xs bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded-full">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              <div className="mt-4 p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E3E9F0]">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Primary Emergency Contact
                </p>
                <p className="text-sm font-bold text-[#172337]">{patient.emergencyContact.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {patient.emergencyContact.phone} • {patient.emergencyContact.relation}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical History & Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#172337]">Appointment History</h2>
                <p className="text-xs text-slate-500 mt-0.5">Chronological record of clinic and hospital consultations</p>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                {appointments.length} Consultations
              </span>
            </div>

            {appointments.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">No appointments recorded for this patient yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Future OPD schedules will be listed here</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E3E9F0]">
                {appointments.map((apt) => (
                  <div key={apt._id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC]/75 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {apt.appointmentId}
                        </span>
                        <StatusBadge status={apt.type} />
                      </div>
                      <p className="text-sm font-bold text-[#172337]">
                        {typeof apt.doctorId === 'object' ? (apt.doctorId as any).name : 'Attending Physician'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(apt.date)} at {apt.timeSlot}
                      </p>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

