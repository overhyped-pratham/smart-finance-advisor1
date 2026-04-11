import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const ExpenseChart = ({ expenses }) => {
    // Group expenses by category
    const categoryData = expenses.reduce((acc, expense) => {
        const existing = acc.find(c => c.name === expense.category);
        if (existing) {
            existing.value += Number(expense.amount);
        } else {
            acc.push({ name: expense.category, value: Number(expense.amount) });
        }
        return acc;
    }, []);

    // Design system palette
    const COLORS = ['#8ff5ff', '#d674ff', '#afffd1', '#00eefc', '#ff716c', '#a855f7', '#44484f'];

    if (!expenses || expenses.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-cf-on-muted text-sm">
                No expense data available.
            </div>
        );
    }

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass rounded p-3 shadow-glass">
                    <p className="font-display font-semibold text-cf-on-surface text-sm">{payload[0].name}</p>
                    <p className="text-cf-primary font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ${payload[0].value.toFixed(2)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={categoryData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                    >
                        {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        wrapperStyle={{ paddingTop: '20px', fontSize: '11px', color: '#8a90a0' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ExpenseChart;
