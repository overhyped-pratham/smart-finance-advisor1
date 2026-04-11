import React from 'react';
import { motion } from 'framer-motion';

const BudgetCard = ({ title, amount, icon, isAccent, trend }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded relative overflow-hidden flex flex-col justify-between transition-all duration-300 group ${
                isAccent 
                    ? 'bg-cf-surface-high text-cf-on-surface shadow-glow-tertiary' 
                    : 'bg-cf-surface-high text-cf-on-surface hover:shadow-glow-primary'
            }`}
        >
            {/* Subtle glow orb */}
            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                isAccent ? 'bg-cf-tertiary/20' : 'bg-cf-primary/15'
            }`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <p className="text-label-sm text-cf-on-muted mb-2">
                        {title}
                    </p>
                    <h3 className="text-display-md" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ${typeof amount === 'number' ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </h3>
                </div>
                <div className={`p-3 rounded ${isAccent ? 'bg-cf-tertiary/15 text-cf-tertiary' : 'bg-cf-primary/10 text-cf-primary'}`}>
                    {icon}
                </div>
            </div>
            {trend && (
                <div className="flex items-center text-sm relative z-10">
                    <span className={trend >= 0 ? 'text-cf-tertiary' : 'text-cf-error'} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {trend >= 0 ? '+' : ''}{trend}%
                    </span>
                    <span className="ml-2 text-cf-on-muted text-xs">from last month</span>
                </div>
            )}
        </motion.div>
    );
};

export default BudgetCard;
