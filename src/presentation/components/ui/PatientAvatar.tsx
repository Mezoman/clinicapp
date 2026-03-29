import React from 'react';

interface PatientAvatarProps {
    name: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const getHSLColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use consistent saturation and lightness for a premium pastel feel
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 65%, 45%)`;
};

export const PatientAvatar: React.FC<PatientAvatarProps> = ({ name, size = 'md', className = '' }) => {
    const initials = name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const sizeClasses = {
        sm: 'w-8 h-8 text-[10px]',
        md: 'w-10 h-10 text-xs',
        lg: 'w-14 h-14 text-base'
    };

    const bgColor = getHSLColor(name);

    return (
        <div
            className={`flex items-center justify-center rounded-xl font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900 shrink-0 ${sizeClasses[size]} ${className}`}
            style={{ backgroundColor: bgColor }}
            role="img"
            aria-label={`أفاتار المريض: ${name}`}
        >
            {initials}
        </div>
    );
};
