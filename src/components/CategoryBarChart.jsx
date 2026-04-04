import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CategoryBarChart = ({ categoryTotals }) => {
    // Convert expected category mapping object to array sorted by highest
    const data = Object.entries(categoryTotals)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const COLORS = ['#7000FF', '#00F0FF', '#3B82F6', '#EC4899', '#F59E0B', '#22C55E'];

    if (data.length === 0) {
        return null; // hide if no data
    }

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-fintech-darkCard/90 backdrop-blur-xl p-3 border border-fintech-secondary rounded shadow-neon-purple text-white">
                    <p className="font-bold">{payload[0].payload.name}</p>
                    <p className="text-fintech-secondary">Outflow: <span className="font-bold">${payload[0].value.toFixed(2)}</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-80 w-full bg-fintech-darkCard/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-glass mt-6 relative overflow-hidden">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-fintech-secondary rounded-full inline-block shadow-neon-purple"></span>
                Cash-Burn by Sector
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                        <XAxis type="number" stroke="#64748B" tick={{fill: '#64748B'}} axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#64748B" tick={{fill: '#CBD5E1', fontSize: 12}} width={100} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
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
