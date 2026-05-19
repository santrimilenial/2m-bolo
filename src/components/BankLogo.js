import React from 'react';
import { Wallet, Landmark, Building2, Smartphone } from 'lucide-react';

const LOGO_MAP = {
    'BCA': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg',
    'MANDIRI': 'https://upload.wikimedia.org/wikipedia/id/8/87/Bank_Mandiri_logo.svg',
    'BRI': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_2020.svg',
    'DANA': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg',
};

export default function BankLogo({ accountType }) {
    const key = String(accountType).toUpperCase().trim();
    
    // Pattern Matching for Images
    let matchedLogo = null;
    if (key === 'MANDIRI CV') matchedLogo = '/logos/mandiri-cv.jpg';
    else if (key.includes('BCA')) matchedLogo = LOGO_MAP['BCA'];
    else if (key.includes('MANDIRI')) matchedLogo = LOGO_MAP['MANDIRI'];
    else if (key.includes('BRI')) matchedLogo = LOGO_MAP['BRI'];
    else if (key.includes('DANA')) matchedLogo = LOGO_MAP['DANA'];

    if (matchedLogo) {
        // Fix for Mandiri CV image having too much whitespace padding
        const isMandiriCV = matchedLogo === '/logos/mandiri-cv.jpg';
        
        return (
            <div className="bg-white px-2 py-1 flex items-center justify-center rounded-sm w-[4.5rem] h-6 shadow-[0_0_8px_rgba(255,255,255,0.1)] border border-neutral-200 overflow-hidden">
                <img 
                    src={matchedLogo} 
                    alt={`${accountType} Logo`} 
                    className="h-full w-full object-contain" 
                />
            </div>
        );
    }
    
    // Pattern Matching for Text-based Brands
    if (key.includes('JENIUS')) {
        return (
            <div className="flex items-center justify-center px-2 h-6 bg-white border border-[#00B4D8]/30 rounded-sm w-[4.5rem] shadow-sm">
                <span className="text-[11px] font-black tracking-tighter text-[#00B4D8]">jenius</span>
            </div>
        );
    }

    if (key.includes('SHOPEE') || key.includes('SPAY')) {
        return (
            <div className="flex items-center justify-center space-x-1 px-2 h-6 bg-[#EE4D2D]/10 border border-[#EE4D2D]/30 rounded-sm min-w-[4.5rem]">
                <Smartphone size={10} className="text-[#EE4D2D]" />
                <span className="text-[9px] font-black uppercase tracking-tighter text-[#EE4D2D]">Shopee</span>
            </div>
        );
    }

    if (key.includes('CASH') || key.includes('TUNAI')) {
        return (
            <div className="flex items-center justify-center space-x-1 px-2 h-6 bg-pos-panel border border-pos-cyan/30 rounded-sm w-[4.5rem]">
                <Wallet size={12} className="text-pos-cyan" />
                <span className="text-[9px] font-black uppercase tracking-tighter text-pos-cyan">CASH</span>
            </div>
        );
    }

    // Default Bank Fallback
    return (
        <div className="flex items-center justify-center space-x-1 px-2 h-6 bg-pos-base border border-pos-border rounded-sm min-w-[4.5rem]">
            <Building2 size={10} className="text-neutral-400" />
            <span className="text-[9px] font-bold uppercase tracking-tighter text-neutral-300">
                {accountType.length > 8 ? accountType.substring(0, 8) + '.' : accountType}
            </span>
        </div>
    );
}
