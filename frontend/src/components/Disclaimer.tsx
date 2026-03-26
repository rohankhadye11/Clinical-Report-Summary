import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function Disclaimer() {
  return (
    <div className="mt-12 pt-6 border-t border-slate-200 flex items-start text-slate-500 text-sm">
      <ShieldAlert className="mr-2 flex-shrink-0 mt-0.5" size={16} />
      <p>
        <strong>Disclaimer:</strong> This summary is generated automatically by an AI system to help you understand your medical report. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult directly with your healthcare provider regarding your care.
      </p>
    </div>
  );
}