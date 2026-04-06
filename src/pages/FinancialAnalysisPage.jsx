import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import InvestmentCard from '../components/InvestmentCard';
import FinancialTips from '../components/FinancialTips';
import ProjectionChart from '../components/ProjectionChart';
import CategoryBarChart from '../components/CategoryBarChart';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const FinancialAnalysisPage = () => {
    const { budget, totalExpenses, netSavings, expenses } = useFinance();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Dynamic categorizations
    const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
        return acc;
    }, {});

    // Dynamic investments based on net savings
    const getDynamicInvestments = () => {
        if (netSavings <= 0) {
            return [
                { ticker: 'HYSA', name: 'High-Yield Savings', desc: 'Before investing in the market, prioritize safely storing any extra cash here to build a 3-6 month emergency fund.' },
                { ticker: 'BIL', name: 'SPDR Bloomberg 1-3 Month T-Bill', desc: 'An extremely low-risk cash equivalent that protects principal while waiting for cash flow to turn positive.' },
                { ticker: 'VT', name: 'Vanguard Total World ETF', desc: 'If starting small, fractional shares provide maximum diversification across global stocks with a single purchase.' }
            ];
        } else if (netSavings < 500) {
            return [
                { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', desc: 'Provides broad exposure to the 500 largest US companies, offering steady historical growth with moderate risk for long-term investors.' },
                { ticker: 'AGG', name: 'iShares US Aggregate Bond', desc: 'Offers regular income and stability through a diversified portfolio of high-quality US bonds, balancing out equity volatility.' },
                { ticker: 'AAPL', name: 'Apple Inc.', desc: 'A resilient blue-chip stock with a massive cash reserve and consistent revenue streams, making it a relatively safe individual stock pick.' }
            ];
        } else {
            return [
                { ticker: 'VTI', name: 'Vanguard Total Stock ETF', desc: 'Captures the entire US stock market, providing foundational stability while giving you exposure to mid and small cap growth.' },
                { ticker: 'MSFT', name: 'Microsoft Corp.', desc: 'An entrenched blue-chip technology company with highly diversified revenue streams, representing strong resilience in a moderate-risk portfolio.' },
                { ticker: 'VXUS', name: 'Vanguard Total Intl ETF', desc: 'Adds critical geographic diversification to your portfolio, ensuring your growing wealth is protected from localized market volatility.' }
            ];
        }
    };
    
    const investments = getDynamicInvestments();

    // Dynamic tips based on spending
    const generateTips = () => {
        const tips = [];
        
        // Tip based on spending habits
        const safeBudget = budget > 0 ? budget : (totalExpenses > 0 ? totalExpenses : 1);
        const highestCategory = Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b, '');
        if (highestCategory && categoryTotals[highestCategory] > safeBudget * 0.4) {
            tips.push(`Your spending on ${highestCategory} is quite high (${((categoryTotals[highestCategory]/safeBudget)*100).toFixed(0)}%). Consider reviewing subscriptions or finding cheaper alternatives in this category.`);
        } else {
            tips.push(`Your expenses are generally well-distributed. Continue tracking small discretionary purchases to maintain this balance.`);
        }

        // Tip based on savings potential
        if (budget > 0 && netSavings > budget * 0.2) {
            tips.push(`You have a strong savings rate! Consider automating your monthly investments to maximize compound interest.`);
        } else if (budget > 0 && netSavings > 0) {
            tips.push(`You are saving money, but try applying the 50/30/20 rule to increase your savings rate to at least 20% of your budget.`);
        } else if (budget > 0) {
            tips.push(`You are currently spending more than or equal to your budget. Prioritize cutting non-essential expenses to build a safety net.`);
        } else {
            tips.push(`You haven't defined a monthly budget. Consider setting one to better track your savings goals and visualize your financial health!`);
        }

        // Tip for long-term planning
        tips.push(`Before heavily investing in the stock market, ensure you have built a liquid emergency fund that can cover 3-6 months of essential living expenses.`);

        return tips;
    };

    return (
        <div className="flex h-screen overflow-hidden bg-fintech-bg dark:bg-fintech-darkBg">
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            
            <div className={`${sidebarOpen ? 'fixed inset-y-0 left-0 z-30 transform translate-x-0 transition duration-200' : 'fixed inset-y-0 left-0 z-30 transform -translate-x-full transition duration-200'} md:relative md:translate-x-0`}>
                <Sidebar />
            </div>

            <main className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                
                <div className="p-6 md:p-8 mt-16 md:mt-0 max-w-4xl mx-auto w-full">
                    <div className="flex justify-between items-end mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-fintech-primary dark:text-white mb-2">Financial Summary & Recommendations</h1>
                            <p className="text-slate-500 dark:text-slate-400">AI-generated report based on your monthly data.</p>
                        </div>
                    </div>

                    {(!budget || budget === 0) && (!expenses || expenses.length === 0) ? (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 flex items-start gap-4 text-yellow-800 dark:text-yellow-200">
                            <AlertCircle className="shrink-0" />
                            <div>
                                <h3 className="font-bold text-lg mb-1">No Budget or Expenses Defined</h3>
                                <p>Please go to the Expenses page to enter your monthly budget or expenses to see your analysis.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Monthly Overview */}
                            <section>
                                <h2 className="text-2xl font-bold mb-4 dark:text-white">Monthly Overview:</h2>
                                <div className="bg-white dark:bg-fintech-darkCard rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                    <ul className="space-y-3 text-lg font-medium dark:text-slate-200">
                                        <li className="flex gap-2">
                                            <span className="text-slate-500 w-32">• Budget:</span> 
                                            <span>${(Number(budget) || 0).toFixed(2)}</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-slate-500 w-32">• Total Expenses:</span> 
                                            <span>${totalExpenses.toFixed(2)}</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-slate-500 w-32">• Net Savings:</span> 
                                            <span className={netSavings >= 0 ? 'text-fintech-accent' : 'text-red-500'}>
                                                ${netSavings.toFixed(2)}
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            </section>

                            {/* Expense Breakdown */}
                            <section>
                                <h2 className="text-2xl font-bold mb-4 dark:text-white">Analysis & Breakdown:</h2>
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="bg-fintech-darkCard/40 backdrop-blur-xl rounded-2xl p-6 shadow-glass border border-white/5 relative overflow-hidden">
                                        <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
                                            <span className="w-2 h-6 bg-pink-500 rounded-full inline-block shadow-[0_0_10px_rgba(236,72,153,0.8)]"></span>
                                            Cash-Outflow Summary
                                        </h3>
                                        {Object.keys(categoryTotals).length === 0 ? (
                                            <p className="text-slate-500">No expenses recorded.</p>
                                        ) : (
                                            <ul className="space-y-3 text-lg font-medium dark:text-slate-200">
                                                {Object.entries(categoryTotals).map(([cat, total]) => (
                                                    <li key={cat} className="flex gap-2">
                                                        <span className="text-slate-500 w-32">• {cat}:</span> 
                                                        <span>${total.toFixed(2)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <CategoryBarChart categoryTotals={categoryTotals} />
                                    <ProjectionChart netSavings={netSavings} />
                                </div>
                            </section>

                            {/* Investment Recommendations */}
                            <section>
                                <h2 className="text-2xl font-bold mb-4 dark:text-white">Investment Recommendations (Moderate Risk):</h2>
                                <div className="space-y-4 text-lg dark:text-slate-200">
                                    {investments.map((inv, idx) => (
                                        <p key={idx} className="font-medium">{idx + 1}. {inv.name} ({inv.ticker}): <span className="font-normal text-slate-600 dark:text-slate-400">{inv.desc}</span></p>
                                    ))}
                                </div>
                                
                                {/* Also displaying as cards for better UI, while keeping the text above strictly compliant */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                    {investments.map((inv, idx) => (
                                        <InvestmentCard 
                                            key={idx}
                                            ticker={inv.ticker} 
                                            name={inv.name} 
                                            description={inv.desc}
                                            delay={idx + 1}
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* Financial Tips */}
                            <section className="pb-12">
                                <h2 className="text-2xl font-bold mb-4 dark:text-white">Financial Tips:</h2>
                                <div className="space-y-3 text-lg font-medium dark:text-slate-200 mb-6 bg-white dark:bg-fintech-darkCard rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                                    {generateTips().map((tip, index) => (
                                        <p key={index} className="flex gap-2">
                                            <span className="text-fintech-accent">•</span> 
                                            <span className="font-normal">{tip}</span>
                                        </p>
                                    ))}
                                </div>
                                
                                {/* Enhanced UI Version */}
                                <FinancialTips tips={generateTips()} />
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default FinancialAnalysisPage;
