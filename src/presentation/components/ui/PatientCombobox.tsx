import { useState, useRef, useEffect } from 'react';
import { User, Search, Loader2 } from 'lucide-react';
import { app } from '../../../application/container';
import { PatientDTO } from '../../../application/dtos/patient.dto';

interface PatientComboboxProps {
    value: { fullName: string; id?: string };
    onSelect: (patient: PatientDTO) => void;
    label?: string;
    placeholder?: string;
}

export const PatientCombobox = ({ value, onSelect, label = "المريض", placeholder = "ابحث عن مريض..." }: PatientComboboxProps) => {
    const [search, setSearch] = useState(value.fullName || '');
    const [results, setResults] = useState<readonly PatientDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSearch(value.fullName || '');
    }, [value.fullName]);

    useEffect(() => {
        if (search.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            const result = await app.patientService.getPatients({ search: search });
            if (result.success) {
                setResults(result.data.patients);
            }
            setLoading(false);
            setShowResults(true);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (term: string) => {
        setSearch(term);
    };

    return (
        <div className="relative" ref={containerRef}>
            <label className="text-xs font-black text-secondary-900 mb-2 block mr-1 flex items-center gap-2 dark:text-white">
                <User className="w-3 h-3 text-primary-500" />
                {label}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => search.length >= 2 && setShowResults(true)}
                    className="w-full bg-secondary-50 border-2 border-secondary-50 rounded-2xl px-5 py-3.5 pr-12 outline-none focus:border-primary-500 focus:bg-white transition-all font-bold text-secondary-900 dark:bg-secondary-800 dark:border-secondary-700 dark:text-white"
                    placeholder={placeholder}
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                {loading && <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500 animate-spin" />}
            </div>

            {showResults && results.length > 0 && (
                <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-secondary-100 overflow-hidden z-[60] dark:bg-secondary-900 dark:border-secondary-800">
                    {results.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                                onSelect(p);
                                setSearch(p.fullName);
                                setShowResults(false);
                            }}
                            className="w-full flex items-center justify-between p-4 hover:bg-primary-50 transition-colors border-b border-secondary-50 last:border-0 text-right dark:hover:bg-secondary-800 dark:border-secondary-800"
                        >
                            <div>
                                <p className="font-bold text-secondary-900 dark:text-white">{p.fullName}</p>
                                <p className="text-xs text-secondary-500">{p.phone}</p>
                            </div>
                            <div className="p-1 px-3 bg-primary-100 text-primary-600 rounded-full text-[10px] font-black dark:bg-primary-900/30">مريض حالي</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
