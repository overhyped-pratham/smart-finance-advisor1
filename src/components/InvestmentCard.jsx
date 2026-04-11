import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShieldCheck } from 'lucide-react';

const InvestmentCard = ({ ticker, name, description, delay }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay * 0.1 }}
            className="p-5 bg-cf-surface-high rounded relative overflow-hidden group hover:shadow-glow-primary transition-all duration-300"
        >
            {/* Subtle hover glow */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-cf-primary/10 rounded-full blur-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="flex items-start justify-between mb-3 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-cf-secondary/15 p-2 rounded text-cf-secondary">
                        <TrendingUp size={18} />
                    </div>
                    <div>
                        <h4 className="font-display font-bold text-lg text-cf-on-surface">{ticker}</h4>
                        <p className="text-label-sm text-cf-on-muted">{name}</p>
                    </div>
                </div>
                <div className="bg-cf-tertiary/10 text-cf-tertiary px-2 py-1 flex items-center gap-1 rounded text-[10px] font-semibold uppercase tracking-wider">
                    <ShieldCheck size={12} /> Moderate
                </div>
            </div>
            <p className="text-sm text-cf-on-muted leading-relaxed relative z-10">
                {description}
            </p>
        </motion.div>
    );
};

export default InvestmentCard;
