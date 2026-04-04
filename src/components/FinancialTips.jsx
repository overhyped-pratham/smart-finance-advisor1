import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

const FinancialTips = ({ tips }) => {
    return (
        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-fintech-darkCard dark:to-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                <Lightbulb className="text-yellow-500" />
                Financial Tips
            </h3>
            <div className="space-y-4">
                {tips.map((tip, index) => (
                    <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.15 }}
                        className="flex gap-4 items-start"
                    >
                        <div className="h-8 w-8 rounded-full bg-fintech-accent/10 text-fintech-accent flex items-center justify-center font-bold text-sm shrink-0">
                            {index + 1}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm mt-1 leading-relaxed">
                            {tip}
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default FinancialTips;
