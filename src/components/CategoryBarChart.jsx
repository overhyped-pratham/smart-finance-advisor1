import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CategoryBarChart = ({ categoryTotals }) => {
    // Convert expected category mapping object to array sorted by highest
    const data = Object.entries(categoryTotals)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Design system signal colors
    const COLORS = ['#d674ff', '#8ff5ff', '#00eefc', '#afffd1', '#ff716c', '#a855f7'];

    if (data.length === 0) {
        return null; // hide if no data
    }

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass rounded p-3 shadow-glow-secondary text-cf-on-surface">
                    <p className="font-display font-bold text-sm">{payload[0].payload.name}</p>
                    <p className="text-cf-secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>Outflow: <span className="font-bold">${payload[0].value.toFixed(2)}</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-80 w-full bg-cf-surface-high rounded p-6 shadow-glass mt-6 relative overflow-hidden">
            <h3 className="font-display text-lg font-bold text-cf-on-surface mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-cf-secondary rounded-full inline-block shadow-glow-secondary"></span>
                Cash-Burn by Sector
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(68,72,79,0.15)" horizontal={true} vertical={false} />
                        <XAxis type="number" stroke="#44484f" tick={{fill: '#8a90a0', fontSize: 11}} axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#44484f" tick={{fill: '#f1f3fc', fontSize: 12}} width={100} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: 'rgba(68,72,79,0.10)'}} content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={18}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CategoryBarChart;
