import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShieldCheck } from 'lucide-react';

const InvestmentCard = ({ ticker, name, description, delay }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay * 0.1 }}
            className="p-5 bg-fintech-darkCard/60 backdrop-blur-xl rounded-2xl shadow-glass border border-white/5 hover:border-fintech-accent/50 hover:shadow-neon-cyan transition-all duration-300 relative overflow-hidden group"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg text-fintech-secondary">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg dark:text-white">{ticker}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{name}</p>
                    </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 px-2 py-1 flex items-center gap-1 rounded text-xs text-fintech-accent font-medium">
                    <ShieldCheck size={14} /> Moderate Risk
                </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
};

export default InvestmentCard;
