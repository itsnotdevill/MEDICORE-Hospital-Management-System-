import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Heart, AlertTriangle, CalendarDays } from 'lucide-react';
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

  if (loading) return <PageLoader />;
  if (!patient) return <div className="text-center py-20 text-gray-400">Patient not found</div>;

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => navigate('/patients')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Patients
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient card */}
        <div className="lg:col-span-1">
          <div className="card overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-[#1e3a5f] to-teal-500" />
            <div className="p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-2xl font-bold mb-4">
                  {patient.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <h1 className="text-xl font-bold text-gray-900">{patient.name}</h1>
                <p className="text-sm text-gray-500">{patient.patientId}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">{calculateAge(patient.dob)} yrs · {patient.gender}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">DOB: {formatDate(patient.dob)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">{patient.phone}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">{patient.address}</span>
                </div>
                {patient.bloodGroup && (
                  <div className="flex items-center gap-3 text-sm">
                    <Heart className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="font-semibold text-red-600">{patient.bloodGroup}</span>
                  </div>
                )}
              </div>

              {patient.allergies.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">Allergies</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {patient.allergies.map((a, i) => (
                      <span key={i} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-semibold text-gray-500 mb-1">Emergency Contact</p>
                <p className="text-sm font-medium text-gray-900">{patient.emergencyContact.name}</p>
                <p className="text-xs text-gray-500">{patient.emergencyContact.phone} · {patient.emergencyContact.relation}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Appointment History</h2>
            </div>
            {appointments.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                No appointments yet
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {appointments.map((apt) => (
                  <div key={apt._id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                          {apt.appointmentId}
                        </span>
                        <StatusBadge status={apt.type} />
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {typeof apt.doctorId === 'object' ? (apt.doctorId as any).name : 'Dr.'}
                      </p>
                      <p className="text-xs text-gray-400">
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
