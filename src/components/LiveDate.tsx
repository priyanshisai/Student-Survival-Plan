'use client';
import { useState, useEffect } from 'react';

export default function LiveDate() {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col md:flex-row md:gap-2 items-center justify-center mb-2" >
      <span className="text-slate-800 font-mono">
        {now.toLocaleTimeString()}
      </span>
            <span className="text-md font-semibold text-slate-200">
        {now.toLocaleDateString()}
      </span>
        </div>
    );
}