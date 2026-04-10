import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, PieChart, Shield } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen flex flex-col bg-fintech-bg dark:bg-fintech-darkBg">
            {/* Nav */}
            <nav className="p-6 flex justify-between items-center max-w-7xl w-full mx-auto">
                <div className="text-2xl font-bold text-fintech-primary dark:text-white">Smart Finance</div>
                <div className="flex gap-4">
                    <Link to="/expenses" className="text-slate-600 dark:text-slate-300 font-medium hover:text-fintech-primary dark:hover:text-white mt-2">
                        Features
                    </Link>
                    <Link to="/dashboard" className="bg-fintech-primary text-white dark:bg-fintech-accent dark:text-white px-5 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition-all">
                        Dashboard
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-12 pb-24 relative z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fintech-accent/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-fintech-secondary/20 rounded-full blur-[100px] pointer-events-none"></div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-3xl relative z-10"
                >
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight drop-shadow-md">
                        Smart Financial <br className="hidden md:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-fintech-accent via-blue-400 to-fintech-secondary drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]">Planning Made Simple</span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
                        Track expenses, calculate savings, and get AI-powered investment recommendations tailored for your financial future.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/expenses" className="bg-fintech-accent text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-colors shadow-lg flex items-center gap-2 w-full sm:w-auto justify-center">
                            Start Tracking <ArrowRight size={20} />
                        </Link>
                        <Link to="/dashboard" className="bg-white dark:bg-fintech-darkCard text-fintech-primary dark:text-white border border-slate-200 dark:border-slate-800 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm w-full sm:w-auto justify-center flex">
                            Open Dashboard
                        </Link>
                    </div>
                </motion.div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl w-full relative z-10">
                    <FeatureCard
                        icon={<PieChart size={32} className="text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />}
                        title="Expense Tracking"
                        desc="Easily categorize and monitor your daily spending patterns."
                    />
                    <FeatureCard
                        icon={<BarChart3 size={32} className="text-fintech-accent group-hover:text-cyan-200 transition-colors duration-300" />}
                        title="Budget Analysis"
                        desc="Real-time calculation of your net savings based on intuitive logic."
                    />
                    <FeatureCard
                        icon={<Shield size={32} className="text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />}
                        title="Investment Recommendations"
                        desc="Get curated, moderate-risk assets to grow your wealth safely."
                    />
                </div>
            </main>

            {/* CTA */}
            <footer className="py-16 bg-white dark:bg-fintech-darkCard border-t border-slate-200 dark:border-slate-800 text-center">
                <h2 className="text-3xl font-bold text-fintech-primary dark:text-white mb-6">Take Control of Your Finances Today</h2>
                <Link to="/expenses" className="bg-fintech-primary text-white dark:bg-white dark:text-fintech-primary px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all inline-block">
                    Get Started Free
                </Link>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <motion.div 
        whileHover={{ y: -5, scale: 1.02 }}
        className="group bg-white/5 dark:bg-fintech-darkCard/30 backdrop-blur-xl p-8 rounded-3xl shadow-glass border border-white/10 dark:border-white/5 text-left transition-all duration-500 hover:border-white/20 relative overflow-hidden"
    >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-[40px] group-hover:bg-white/10 transition-colors duration-500"></div>
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/40 dark:to-slate-800/10 backdrop-blur-md w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/10">
            {icon}
        </div>
        <h3 className="text-xl font-extrabold text-fintech-primary dark:text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all duration-300">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </motion.div>
);

export default LandingPage;
