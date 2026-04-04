import React from 'react';
import { motion } from 'framer-motion';

const BudgetCard = ({ title, amount, icon, isAccent, trend }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl relative overflow-hidden backdrop-blur-xl ${isAccent ? 'bg-fintech-secondary/20 text-white border-fintech-accent shadow-neon-cyan' : 'bg-fintech-darkCard/60 text-white border-white/5 hover:border-fintech-secondary/50 hover:shadow-neon-purple'} border flex flex-col justify-between transition-all duration-300`}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className={`text-sm font-medium ${isAccent ? 'text-green-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {title}
                    </p>
                    <h3 className="text-3xl font-bold mt-1">
                        ${typeof amount === 'number' ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </h3>
                </div>
                <div className={`p-3 rounded-full ${isAccent ? 'bg-white/20' : 'bg-slate-50 dark:bg-slate-800 text-fintech-secondary'}`}>
                    {icon}
                </div>
            </div>
            {trend && (
                <div className="flex items-center text-sm">
                    <span className={trend >= 0 ? (isAccent ? 'text-white' : 'text-fintech-accent') : 'text-red-500'}>
                        {trend >= 0 ? '+' : ''}{trend}%
                    </span>
                    <span className={`ml-2 ${isAccent ? 'text-green-100' : 'text-slate-400'}`}>from last month</span>
                </div>
            )}
        </motion.div>
    );
};

export default BudgetCard;
