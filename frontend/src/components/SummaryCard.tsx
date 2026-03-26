import React from 'react';
import { FileText } from 'lucide-react';

export default function SummaryCard({ text }: { text: string }) {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg shadow-sm mb-8">
      <div className="flex items-center mb-3">
        <FileText className="text-blue-500 mr-2" size={24} />
        <h2 className="text-lg font-semibold text-blue-900">Doctor's Note</h2>
      </div>
      <p className="text-blue-800 leading-relaxed text-lg">{text}</p>
    </div>
  );
}