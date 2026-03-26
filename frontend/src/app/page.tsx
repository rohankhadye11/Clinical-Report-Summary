'use client';

import { useState } from 'react';
import { Activity, Pill, HeartPulse, ArrowLeft } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import SummaryCard from '@/components/SummaryCard';
import EntityBadge from '@/components/EntityBadge';
import Disclaimer from '@/components/Disclaimer';
import { PatientRecord } from '@/types/clinical';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patientData, setPatientData] = useState<PatientRecord | null>(null);

  const handleSearch = async (recordId: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/fetch-record?id=${encodeURIComponent(recordId)}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);
      setPatientData(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while fetching records.');
    } finally {
      setLoading(false);
    }
  };

  const resetView = () => {
    setPatientData(null);
    setError('');
  };

  if (!patientData) {
    return (
      <div className="p-6">
        <SearchBar onSearch={handleSearch} loading={loading} error={error} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
        
        <button onClick={resetView} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors mb-8 font-medium">
          <ArrowLeft size={18} className="mr-2" /> Back to Search
        </button>

        <h1 className="text-3xl font-bold text-slate-800 mb-2">Your Visit Summary</h1>
        <p className="text-slate-500 mb-8">A simplified overview of your recent consultation.</p>

        {patientData.summary && <SummaryCard text={patientData.summary} />}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          {/* Symptoms */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center">
              <Activity className="text-slate-400 mr-2" size={20} /> Symptoms Noted
            </h3>
            {patientData.symptoms.length > 0 ? (
              <ul className="space-y-3">
                {patientData.symptoms.map((s, i) => (
                  <li key={i} className="flex items-start text-slate-600">
                    <span className="text-blue-500 mr-2 mt-1">•</span> {s.charAt(0).toUpperCase() + s.slice(1)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 italic">No specific symptoms noted.</p>
            )}
          </div>

          {/* Diagnoses */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center">
              <HeartPulse className="text-emerald-500 mr-2" size={20} /> Diagnoses
            </h3>
            <div className="flex flex-wrap gap-2">
              {patientData.diagnoses.length > 0 ? (
                patientData.diagnoses.map((d, i) => <EntityBadge key={i} text={d} type="Diagnosis" />)
              ) : (
                <p className="text-slate-400 italic">None noted in this summary.</p>
              )}
            </div>
          </div>

          {/* Medications */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center">
              <Pill className="text-amber-500 mr-2" size={20} /> Medications
            </h3>
            <div className="flex flex-wrap gap-2">
              {patientData.medications.length > 0 ? (
                patientData.medications.map((m, i) => <EntityBadge key={i} text={m} type="Medication" />)
              ) : (
                <p className="text-slate-400 italic">No medications prescribed.</p>
              )}
            </div>
          </div>
        </div>

        <Disclaimer />
      </div>
    </div>
  );
}