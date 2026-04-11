import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

const FinancialTips = ({ tips }) => {
    return (
        <div className="bg-cf-surface-high p-6 rounded">
            <h3 className="font-display text-lg font-bold mb-5 flex items-center gap-2 text-cf-on-surface">
                <Lightbulb className="text-cf-primary" size={20} />
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
                        <div className="h-7 w-7 rounded bg-cf-primary/10 text-cf-primary flex items-center justify-center font-display font-bold text-xs shrink-0">
                            {index + 1}
                        </div>
                        <p className="text-cf-on-muted text-sm mt-0.5 leading-relaxed">
                            {tip}
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default FinancialTips;
