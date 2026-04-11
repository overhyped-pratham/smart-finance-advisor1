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
        <div className="flex h-screen overflow-hidden bg-cf-bg">
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
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
                        className="flex justify-between items-end mb-8 pb-4"
                    >
                        <div>
                            <h1 className="text-display-md text-cf-on-surface mb-2 flex items-center gap-3">
                                <Brain className="text-cf-primary" />
                                AI-Powered Insights
                            </h1>
                            <p className="text-cf-on-muted text-sm">
                                Analyze financial news sentiment, get market analysis, and stock predictions.
                            </p>
                        </div>
                    </motion.div>

                    <SentimentAnalyzer />

                    {/* Section divider — tonal shift instead of line */}
                    <div className="my-12 relative flex items-center justify-center">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-cf-outline/15 to-transparent"></div>
                        <span className="absolute bg-cf-bg px-4 text-label-sm text-cf-on-muted">Market Analysis</span>
                    </div>

                    <MarketAnalyzer />

                    <div className="my-12 relative flex items-center justify-center">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-cf-outline/15 to-transparent"></div>
                        <span className="absolute bg-cf-bg px-4 text-label-sm text-cf-on-muted">Stock Prediction</span>
                    </div>

                    <ZerodhaPredictor />

                    <div className="my-12 relative flex items-center justify-center">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-cf-outline/15 to-transparent"></div>
                        <span className="absolute bg-cf-bg px-4 text-label-sm text-cf-on-muted">Automated Scanner</span>
                    </div>

                    <DailyScanner />
                </div>
            </main>
        </div>
    );
};

export default AIInsightsPage;
