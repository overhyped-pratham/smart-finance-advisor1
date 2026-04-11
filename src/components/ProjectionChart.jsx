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
            <div className="h-64 flex items-center justify-center text-cf-on-muted bg-cf-surface-high rounded p-6">
                <p>Increase net savings above $0 to view your 12-month accumulation projection.</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass rounded p-3 shadow-glow-primary text-cf-on-surface">
                    <p className="font-display font-bold text-sm">{label}</p>
                    <p className="text-cf-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>Est. Cash: <span className="font-bold">${payload[0].value.toLocaleString()}</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-80 w-full bg-cf-surface-high rounded p-6 shadow-glass relative overflow-hidden">
            <h3 className="font-display text-lg font-bold text-cf-on-surface mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-cf-primary rounded-full inline-block shadow-glow-primary"></span>
                12-Month Liquidity Projection
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8ff5ff" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8ff5ff" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(68,72,79,0.15)" vertical={false} />
                        <XAxis dataKey="name" stroke="#44484f" tick={{fill: '#8a90a0', fontSize: 11}} tickLine={false} axisLine={false} />
                        <YAxis stroke="#44484f" tick={{fill: '#8a90a0', fontSize: 11}} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                            type="monotone" 
                            dataKey="projected" 
                            stroke="#8ff5ff" 
                            strokeWidth={2}
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
