import React from 'react';

const AiTeacherIcon: React.FC = () => {
    return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-40 h-40 mx-auto">
            <g>
                {/* Antenna */}
                <line x1="100" y1="25" x2="100" y2="10" stroke="#6366f1" strokeWidth="3" />
                <circle cx="100" cy="8" r="5" fill="#818cf8" />

                {/* Head */}
                <rect x="60" y="25" width="80" height="60" rx="20" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="3" />
                
                {/* Eyes */}
                <circle cx="85" cy="55" r="8" fill="#4f46e5" />
                <circle cx="115" cy="55" r="8" fill="#4f46e5" />
                <circle cx="88" cy="52" r="2" fill="white" />
                <circle cx="118" cy="52" r="2" fill="white" />

                {/* Body */}
                <path d="M 70 85 C 65 95, 60 110, 60 130 L 140 130 C 140 110, 135 95, 130 85 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="3" />
                
                {/* Center Circle on Body */}
                <circle cx="100" cy="110" r="12" fill="#818cf8" stroke="#6366f1" strokeWidth="2.5" />
                <path d="M 95 110 L 100 115 L 105 105" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

            </g>
        </svg>
    );
};

export default AiTeacherIcon;
