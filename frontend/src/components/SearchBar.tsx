import React, { useState } from 'react';
import { Search, HeartPulse } from 'lucide-react';

interface SearchBarProps {
  onSearch: (id: string) => void;
  loading: boolean;
  error?: string;
}

export default function SearchBar({ onSearch, loading, error }: SearchBarProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl p-8 border border-slate-100 mt-20">
      <div className="flex justify-center mb-6">
        <div className="bg-blue-100 p-4 rounded-full">
          <HeartPulse className="text-blue-600" size={40} />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Patient Portal</h1>
      <p className="text-slate-500 text-center mb-8">Enter your secure Record ID to view your visit summary.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g., patient_006.txt"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            disabled={loading}
          />
        </div>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading || !inputValue}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Accessing Secure Records...' : 'View My Records'}
        </button>
      </form>
    </div>
  );
}