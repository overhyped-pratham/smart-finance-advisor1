import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SentimentAnalyzer from '../components/SentimentAnalyzer';
import MarketAnalyzer from '../components/MarketAnalyzer';
import ZerodhaPredictor from '../components/ZerodhaPredictor';
import DailyScanner from '../components/DailyScanner';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

const AIInsightsPage = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-between items-end mb-8 border-b border-white/5 pb-4"
                    >
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                                <Brain className="text-fintech-accent" />
                                AI-Powered Insights
                            </h1>
                            <p className="text-slate-400">
                                Analyze financial news sentiment and get market analysis.
                            </p>
                        </div>
                    </motion.div>



                    <SentimentAnalyzer />

                    {/* Divider */}
                    <div className="my-12 border-t border-white/5 relative">
                        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-fintech-darkBg px-4 text-slate-600 text-sm">Market Analysis</span>
                    </div>

                    <MarketAnalyzer />

                    {/* Divider */}
                    <div className="my-12 border-t border-white/5 relative">
                        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-fintech-darkBg px-4 text-slate-600 text-sm">Zerodha API</span>
                    </div>

                    <ZerodhaPredictor />

                    {/* Divider */}
                    <div className="my-12 border-t border-white/5 relative">
                        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-fintech-darkBg px-4 text-slate-600 text-sm">Automated Scanner</span>
                    </div>

                    <DailyScanner />
                </div>
            </main>
        </div>
    );
};

export default AIInsightsPage;
