import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProjectionChart = ({ netSavings }) => {
    // Generate 12 months of projected data
    const data = Array.from({ length: 12 }, (_, i) => {
        const month = new Date();
        month.setMonth(month.getMonth() + i);
        return {
            name: month.toLocaleString('default', { month: 'short' }),
            projected: Math.max(0, netSavings) * (i + 1)
        };
    });

    if (netSavings <= 0) {
        return (
            <div className="h-64 flex items-center justify-center text-slate-500 bg-fintech-darkCard/40 backdrop-blur-md rounded-2xl border border-white/5">
                <p>Increase net savings above $0 to view your 12-month accumulation projection.</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-fintech-darkCard/90 backdrop-blur-xl p-3 border border-fintech-accent rounded shadow-neon-cyan text-white">
                    <p className="font-bold">{label}</p>
                    <p className="text-fintech-accent">Est. Cash: <span className="font-bold">${payload[0].value.toLocaleString()}</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-80 w-full bg-fintech-darkCard/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-glass relative overflow-hidden">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-fintech-accent rounded-full inline-block shadow-neon-cyan"></span>
                12-Month Liquidity Projection
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#00F0FF" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748B" tick={{fill: '#64748B'}} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748B" tick={{fill: '#64748B'}} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                            type="monotone" 
                            dataKey="projected" 
                            stroke="#00F0FF" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorProjected)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ProjectionChart;
