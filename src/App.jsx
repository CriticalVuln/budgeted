import React, { useState, useMemo, useEffect } from 'react';
import {
    LayoutDashboard,
    Wallet,
    Target,
    CheckCircle2,
    Plus,
    Trash2,
    X,
    CreditCard,
    DollarSign,
    PiggyBank,
    Calendar,
    AlertCircle,
    Sun,
    Moon,
    User,
    Users,
    Banknote,
    ArrowUpRight,
    Edit2,
    ChevronDown,
    ChevronUp,
    Archive,
    Filter,
    MessageSquare,
    Sparkles,
    Settings,
    Copy,
    TrendingUp,
    Home,
    RefreshCw,
    CircleHelp,
    Bell,
    Clock,
    TrendingDown,
    Palette,
    CheckCheck
} from 'lucide-react';

import Investments from './Investments';
import usePersistentState from './hooks/usePersistentState';

// --- Constants ---
const BILL_CATEGORIES = [
    'Rent/Mortgage', 'Utilities', 'Groceries', 'Leisure', 'Insurance',
    'Subscription', 'Transportation', 'Health', 'Other'
];

const TRANSACTION_CATEGORIES = [
    'Groceries', 'Gas', 'Utilities', 'Dining', 'Entertainment', 'Shopping', 'Travel', 'Health', 'Transportation', 'Subscription', 'Misc'
];


// Color mapping for categories in the stacked chart
const CATEGORY_COLORS = {
    'Rent/Mortgage': '#A8DADC',   // Seafoam (Neutral/Base)
    'Utilities': '#457b9d',       // Muted Blue
    'Groceries': '#2A9D8F',       // Teal (Positive/Neutral)
    'Leisure': '#e9c46a',         // Sand/Yellow
    'Insurance': '#EF8354',       // Coral (Expense)
    'Subscription': '#2A9D8F',    // Teal
    'Transportation': '#e76f51',  // Burnt Sienna
    'Health': '#EF8354',          // Coral (Expense)
    'Other': '#8d99ae',           // Muted Grey
    'Misc': '#8d99ae',            // Muted Grey
    'Gas': '#e76f51',             // Burnt Sienna
    'Dining': '#e9c46a',          // Sand/Yellow
    'Entertainment': '#f4a261',   // Muted Orange
    'Shopping': '#e76f51',        // Burnt Sienna
    'Travel': '#2A9D8F'           // Teal
};

// Color Palettes for theming
const COLOR_PALETTES = {
    default: {
        name: 'Default',
        primary: '#2A9D8F',
        secondary: '#A8DADC',
        accent: '#EF8354',
        negative: '#EF8354',
        preview: ['#2A9D8F', '#A8DADC', '#EF8354', '#e9c46a'],
        className: '' // No extra class needed for default
    },
    cerulean: {
        name: 'Cerulean',
        primary: '#3E92CC',
        secondary: '#7EC8E3',
        accent: '#F7B267',
        negative: '#F28482',
        preview: ['#3E92CC', '#7EC8E3', '#F28482', '#1D3557'],
        className: 'theme-cerulean'
    },
    sage: {
        name: 'Sage',
        primary: '#8A9A5B',
        secondary: '#E6D5B8',
        accent: '#D4A574',
        negative: '#E07A5F',
        preview: ['#8A9A5B', '#E6D5B8', '#E07A5F', '#4A403A'],
        className: 'theme-sage'
    },
    forest: {
        name: 'Forest',
        primary: '#7FB989',
        secondary: '#D4B483',
        accent: '#D4B483',
        negative: '#D17C64',
        preview: ['#7FB989', '#D4B483', '#D17C64', '#182620'],
        className: 'theme-forest'
    },
};


const RECURRING_FREQUENCIES = [
    'Weekly', 'Bi-weekly', 'Monthly', 'Yearly'
];

const ALL_CATEGORIES = Array.from(new Set([...BILL_CATEGORIES, ...TRANSACTION_CATEGORIES]));

const INCOME_SOURCES = [
    'Salary', 'Freelance', 'Investment', 'Gift', 'Alyssa', 'Other'
];

// Internal System Date - Persistent Anchor
// Internal System Date - Updated to reflect current time
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
};

// Helper to calculate next due date based on frequency
const calculateNextDueDate = (currentDateStr, frequency) => {
    const date = new Date(currentDateStr + 'T00:00:00');
    switch (frequency) {
        case 'Weekly': date.setDate(date.getDate() + 7); break;
        case 'Bi-weekly': date.setDate(date.getDate() + 14); break;
        case 'Monthly': date.setMonth(date.getMonth() + 1); break;
        case 'Yearly': date.setFullYear(date.getFullYear() + 1); break;
        default: break;
    }
    return formatDate(date);
};

// --- Custom Hooks ---

// --- Custom Hooks ---


// --- Shared UI Components ---

const Card = ({ children, title, action, leftAction, className = "" }) => (
    <div className={`bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] transition-all duration-500 ease-in-out hover:shadow-md h-full overflow-hidden ${className}`} style={{ boxShadow: '0 4px 6px -1px var(--shadow-color)' }}>
        <div className="relative flex items-center justify-between mb-4 min-h-[1.5rem]">
            <div className="relative z-10 flex-shrink-0">
                {leftAction}
            </div>
            <h3 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center w-full pointer-events-none">{title}</h3>
            <div className="relative z-10 flex-shrink-0">
                {action}
            </div>
        </div>
        {children}
    </div>
);
const YearDropdown = ({ value, onChange, years = [2024, 2025, 2026], label = "Year" }) => (
    <select
        id={`year-select-${label.toLowerCase().replace(/\s+/g, '-')}`}
        name={`year-select-${label.toLowerCase().replace(/\s+/g, '-')}`}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2 py-1 text-[10px] font-black text-[var(--text-body)] outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all cursor-pointer appearance-none"
    >
        {years.map(year => (
            <option key={year} value={year}>{year}</option>
        ))}
    </select>
);

const ProgressBar = ({ progress, color = "bg-[var(--primary)]" }) => (
    <div className="w-full bg-[var(--border)] rounded-full h-2 overflow-hidden transition-colors duration-500 ease-in-out">
        <div
            className={`h-2 rounded-full transition-all duration-700 ease-out ${color}`}
            style={{ width: `${Math.min(100, progress)}%` }}
        ></div>
    </div>
);

const SpendingCategoryBars = ({ categories, limits = {} }) => {
    const sorted = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8); // Show more categories now that they are progress bars

    return (
        <div className="space-y-4 mt-6 pt-6 border-t border-[var(--border)] transition-colors duration-500">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Category Budgets</h4>
            {sorted.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic">No spending recorded yet this month.</p>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {sorted.map(([cat, amount]) => {
                        const limit = limits[cat] || 0;
                        const progress = limit > 0 ? (amount / limit) * 100 : 0;
                        const isOver = limit > 0 && amount > limit;

                        return (
                            <div key={cat} className="space-y-1.5">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{cat}</span>
                                        <span className={`text-xs font-bold ${isOver ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                            ${amount.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">/ {limit > 0 ? `$${limit.toLocaleString()}` : 'No Limit'}</span>
                                        </span>
                                    </div>
                                    {limit > 0 && (
                                        <span className={`text-[10px] font-black ${isOver ? 'text-rose-500' : 'text-slate-400'}`}>
                                            {Math.round(progress)}%
                                        </span>
                                    )}
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isOver ? 'bg-rose-500' : ''}`}
                                        style={{
                                            width: `${Math.min(100, progress || (amount > 0 ? 100 : 0))}%`,
                                            backgroundColor: !isOver ? (CATEGORY_COLORS[cat] || '#cbd5e1') : undefined
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[var(--text-heading)]/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--bg-card)] w-full max-w-md rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 transition-colors duration-500 ease-in-out" style={{ boxShadow: '0 25px 50px -12px var(--shadow-color)' }}>
                <div className="flex justify-between items-center p-6 border-b border-[var(--border)] transition-colors duration-500 shrink-0">
                    <h3 className="text-xl font-bold text-[var(--text-heading)]">{title}</h3>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors duration-300">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

// Toast Notification System
const ToastContainer = ({ toasts, removeToast }) => {
    if (toasts.length === 0) return null;
    return (
        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right-4 duration-300 min-w-[280px] max-w-[360px] ${toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-700/50 text-emerald-100' :
                        toast.type === 'error' ? 'bg-rose-900/90 border-rose-700/50 text-rose-100' :
                            toast.type === 'warning' ? 'bg-amber-900/90 border-amber-700/50 text-amber-100' :
                                'bg-slate-900/90 border-slate-700/50 text-slate-100'
                        }`}
                >
                    <div className="shrink-0">
                        {toast.type === 'success' && <CheckCheck size={16} />}
                        {toast.type === 'error' && <AlertCircle size={16} />}
                        {toast.type === 'warning' && <AlertCircle size={16} />}
                        {toast.type === 'info' && <Bell size={16} />}
                    </div>
                    <p className="text-sm font-medium flex-1">{toast.message}</p>
                    <button onClick={() => removeToast(toast.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
};

const MoneyFlowChart = ({ income, bills, transactions = [], selectedYear }) => {
    const [hoveredData, setHoveredData] = useState(null);

    const visibleData = useMemo(() => {
        // Build all 12 months for the selected year
        const timeline = [];
        for (let month = 0; month < 12; month++) {
            timeline.push({
                year: selectedYear,
                month: month,
                in: 0,
                out: 0,
                label: new Date(selectedYear, month).toLocaleDateString('en-US', { month: 'short' }),
                monthIdx: month
            });
        }

        // Aggregate income for the selected year
        income.forEach(i => {
            if (!i.date) return;
            const d = new Date(i.date + 'T00:00:00');
            if (d.getFullYear() === selectedYear) {
                timeline[d.getMonth()].in += i.amount;
            }
        });

        // Aggregate bills for the selected year
        bills.forEach(b => {
            if (!b.paid) return;
            const dateStr = b.paidDate || b.due;
            if (!dateStr) return;
            const d = new Date(dateStr + 'T00:00:00');
            if (d.getFullYear() === selectedYear) {
                timeline[d.getMonth()].out += b.amount;
            }
        });

        // Aggregate transactions for the selected year
        transactions.forEach(t => {
            if (!t.date) return;
            const d = new Date(t.date + 'T00:00:00');
            if (d.getFullYear() === selectedYear) {
                timeline[d.getMonth()].out += t.amount;
            }
        });

        return timeline;
    }, [income, bills, transactions, selectedYear]);

    const maxIn = Math.max(...visibleData.map(d => d.in), 100);
    const maxOut = Math.max(...visibleData.map(d => d.out), 100);

    const height = 200;
    const overallMax = Math.max(maxIn, maxOut);
    const scale = (height / 2 - 30) / overallMax;

    // Calculate averages only from months that have data
    const averages = useMemo(() => {
        const monthsWithIn = visibleData.filter(m => m.in > 0);
        const monthsWithOut = visibleData.filter(m => m.out > 0);

        return {
            in: monthsWithIn.length > 0 ? monthsWithIn.reduce((sum, m) => sum + m.in, 0) / monthsWithIn.length : 0,
            out: monthsWithOut.length > 0 ? monthsWithOut.reduce((sum, m) => sum + m.out, 0) / monthsWithOut.length : 0
        };
    }, [visibleData]);

    // Fixed coordinate system width
    const viewWidth = 1000;
    const padding = 40;
    const plotWidth = viewWidth - (padding * 2);
    const count = visibleData.length;
    // Calculate bar layout
    // If we have 1 item, center it. If multiple, space them.
    const itemWidth = count > 0 ? Math.min(plotWidth / count, 100) : plotWidth;
    const barWidth = Math.min(40, (itemWidth * 0.4)); // Max bar width 40, or 40% of slot

    // Helper to get center X of a slot
    const getSlotX = (i) => padding + (i * itemWidth) + (itemWidth / 2);

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${viewWidth} ${height}`} className="w-full h-48 overflow-visible" preserveAspectRatio="none">
                <line x1="0" y1={height / 2} x2="100%" y2={height / 2} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="1" />

                {/* Average lines */}
                {averages.in > 0 && (
                    <>
                        <line
                            x1={padding} y1={(height / 2) - (averages.in * scale)}
                            x2={viewWidth - padding} y2={(height / 2) - (averages.in * scale)}
                            stroke="#A8DADC" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-50"
                        />
                        <text x={viewWidth - padding} y={(height / 2) - (averages.in * scale) - 8} textAnchor="end" className="text-[11px] font-bold fill-[#A8DADC] uppercase">Avg In: ${averages.in.toLocaleString(undefined, { maximumFractionDigits: 0 })}</text>
                    </>
                )}
                {averages.out > 0 && (
                    <>
                        <line
                            x1={padding} y1={(height / 2) + (averages.out * scale)}
                            x2={viewWidth - padding} y2={(height / 2) + (averages.out * scale)}
                            stroke="#FDBA74" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-50"
                        />
                        <text x={viewWidth - padding} y={(height / 2) + (averages.out * scale) + 14} textAnchor="end" className="text-[11px] font-bold fill-[#FDBA74] uppercase">Avg Out: ${averages.out.toLocaleString(undefined, { maximumFractionDigits: 0 })}</text>
                    </>
                )}

                {visibleData.map((month, i) => {
                    const centerX = getSlotX(i);
                    const incomeX = centerX - barWidth - 2;
                    const expenseX = centerX + 2;

                    const incomeHeight = Math.max(month.in * scale, month.in > 0 ? 4 : 0);
                    const expenseHeight = Math.max(month.out * scale, month.out > 0 ? 4 : 0);
                    // month.label already contains short month and 2-digit year, no need to reformat
                    // const monthName = new Date(0, month.monthIdx).toLocaleDateString('en-US', { month: 'short' });

                    return (
                        <g key={i} className="group">
                            {month.in > 0 && (
                                <rect
                                    x={incomeX} y={(height / 2) - incomeHeight} width={barWidth} height={incomeHeight}
                                    className="fill-[#2A9D8F] transition-all duration-300 hover:brightness-110 cursor-pointer" rx="2"
                                    onMouseEnter={() => setHoveredData({ x: incomeX + barWidth / 2, y: (height / 2) - incomeHeight, value: month.in, label: month.label, type: 'Income' })}
                                    onMouseLeave={() => setHoveredData(null)}
                                />
                            )}
                            {month.out > 0 && (
                                <rect
                                    x={expenseX} y={height / 2} width={barWidth} height={expenseHeight}
                                    className="fill-[#EF8354] transition-all duration-300 hover:brightness-110 cursor-pointer" rx="2"
                                    onMouseEnter={() => setHoveredData({ x: expenseX + barWidth / 2, y: (height / 2) + expenseHeight, value: month.out, label: month.label, type: 'Expenses' })}
                                    onMouseLeave={() => setHoveredData(null)}
                                />
                            )}
                            <text x={centerX} y={height + 15} className="text-xs font-bold fill-slate-400 uppercase" textAnchor="middle">{month.label}</text>
                        </g>
                    );
                })}

                {hoveredData && (
                    <g transform={`translate(${hoveredData.x}, ${hoveredData.y})`} className="pointer-events-none transition-all duration-200 ease-out z-50">
                        <rect x="-70" y={hoveredData.type === 'Income' ? "-60" : "10"} width="140" height="55" rx="10" className="fill-slate-800 dark:fill-slate-100 shadow-xl opacity-95" />
                        <text x="0" y={hoveredData.type === 'Income' ? "-42" : "28"} textAnchor="middle" className="fill-slate-300 dark:fill-slate-500 text-xs font-bold uppercase tracking-wider">{hoveredData.label} Total</text>
                        <text x="0" y={hoveredData.type === 'Income' ? "-22" : "48"} textAnchor="middle" className="fill-white dark:fill-slate-900 text-lg font-bold">${hoveredData.value.toLocaleString()}</text>
                    </g>
                )}
            </svg>
        </div >
    );
};

const IncomeSavingsLineChart = ({ income, bills, transactions = [], selectedYear }) => {
    const [hoveredData, setHoveredData] = useState(null);

    const visibleData = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Determine how many months to show
        // If viewing current year, only show up to current month
        // If viewing past year, show all 12 months
        const maxMonth = selectedYear === currentYear ? currentMonth : 11;

        // Build months for the selected year (only up to current month if current year)
        const buckets = [];
        for (let month = 0; month <= maxMonth; month++) {
            buckets.push({
                year: selectedYear,
                month: month,
                in: 0,
                out: 0,
                income: 0,
                saved: 0,
                label: new Date(selectedYear, month).toLocaleDateString('en-US', { month: 'short' }),
                monthIdx: month
            });
        }

        // Aggregate income for the selected year
        income.forEach(i => {
            if (!i.date) return;
            const d = new Date(i.date + 'T00:00:00');
            if (d.getFullYear() === selectedYear && d.getMonth() <= maxMonth) {
                buckets[d.getMonth()].in += i.amount;
            }
        });

        // Aggregate bills for the selected year
        bills.forEach(b => {
            if (!b.paid) return;
            const dateStr = b.paidDate || b.due;
            if (!dateStr) return;
            const d = new Date(dateStr + 'T00:00:00');
            if (d.getFullYear() === selectedYear && d.getMonth() <= maxMonth) {
                buckets[d.getMonth()].out += b.amount;
            }
        });

        // Aggregate transactions for the selected year
        transactions.forEach(t => {
            if (!t.date) return;
            const d = new Date(t.date + 'T00:00:00');
            if (d.getFullYear() === selectedYear && d.getMonth() <= maxMonth) {
                buckets[d.getMonth()].out += t.amount;
            }
        });

        return buckets.map(b => ({ ...b, income: b.in, saved: b.in - b.out }));
    }, [income, bills, transactions, selectedYear]);

    // Calculate scale centered around zero
    const maxVal = Math.max(...visibleData.map(d => Math.max(d.income, d.saved)), 100);
    const minSaved = Math.min(...visibleData.map(d => d.saved), 0);
    const absMax = Math.max(maxVal, Math.abs(minSaved)); // Use symmetric scale around 0

    const height = 200;
    const width = 1000;
    const padding = 40;
    const chartHeight = height - 2 * padding;

    // Y=0 is at the center of the chart area
    const getY = (val) => {
        // Scale value so that absMax maps to top/bottom edge, 0 maps to center
        const centerY = height / 2;
        const scale = (chartHeight / 2) / (absMax || 1);
        return centerY - (val * scale); // Positive goes up (lower Y), negative goes down
    };

    const getX = (i) => {
        const availableWidth = width - (padding * 2);
        const count = visibleData.length;
        if (count <= 1) return padding;
        const interval = Math.min(availableWidth / (count - 1), 100);
        return padding + (i * interval);
    };

    const pointsIncome = visibleData.map((d, i) => `${getX(i)},${getY(d.income)}`).join(' ');
    const pointsSaved = visibleData.map((d, i) => `${getX(i)},${getY(d.saved)}`).join(' ');

    // Area path strings: fill from line to zero baseline
    const zeroY = getY(0);
    const areaPointsIncome = pointsIncome + ` ${getX(visibleData.length - 1)},${zeroY} ${getX(0)},${zeroY}`;
    const areaPointsSaved = pointsSaved + ` ${getX(visibleData.length - 1)},${zeroY} ${getX(0)},${zeroY}`;

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2A9D8F" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#2A9D8F" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="savedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#A8DADC" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#A8DADC" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Zero baseline in the middle */}
                <line x1="0" y1={zeroY} x2="100%" y2={zeroY} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="1" />

                {/* Area Fills */}
                <polyline fill="url(#incomeGradient)" points={areaPointsIncome} stroke="none" />
                <polyline fill="url(#savedGradient)" points={areaPointsSaved} stroke="none" />

                {/* Lines */}
                <polyline fill="none" stroke="#2A9D8F" strokeWidth="3" points={pointsIncome} strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md" />
                <polyline fill="none" stroke="#A8DADC" strokeWidth="3" points={pointsSaved} strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md opacity-80" />

                {visibleData.map((d, i) => (
                    <g key={i} className="group cursor-pointer"
                        onMouseEnter={() => setHoveredData({ x: getX(i), yIncome: getY(d.income), ySaved: getY(d.saved), income: d.income, saved: d.saved, label: d.label })}
                        onMouseLeave={() => setHoveredData(null)}>
                        <circle cx={getX(i)} cy={getY(d.income)} r="4" className="fill-[#2A9D8F] transition-all duration-300 group-hover:r-6" />
                        <circle cx={getX(i)} cy={getY(d.saved)} r="4" className="fill-[#A8DADC] transition-all duration-300 group-hover:r-6" />
                        {/* Invisible hit area */}
                        <rect x={getX(i) - 10} y="0" width="20" height={height} className="fill-transparent" />
                    </g>
                ))}

                {hoveredData && (
                    <g transform={`translate(${hoveredData.x}, 0)`} className="pointer-events-none transition-all duration-200 ease-out z-50">
                        <line x1="0" y1="0" x2="0" y2={height} stroke="currentColor" className="text-slate-300 dark:text-slate-600" strokeWidth="1" strokeDasharray="4 4" />
                        <rect x="-75" y="5" width="150" height="80" rx="10" className="fill-slate-900 dark:fill-slate-50 shadow-xl" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} />
                        <text x="0" y="28" textAnchor="middle" className="fill-slate-400 dark:fill-slate-500 text-[11px] font-bold uppercase tracking-wider">{hoveredData.label}</text>
                        <text x="-60" y="50" className="fill-[#2A9D8F] text-sm font-bold">In: ${hoveredData.income.toLocaleString()}</text>
                        <text x="-60" y="72" className="fill-[#A8DADC] text-sm font-bold">Saved: ${hoveredData.saved.toLocaleString()}</text>
                    </g>
                )}
            </svg>
        </div>
    );
};

const CategoryBreakdownChart = ({ bills, transactions = [] }) => {
    const [hoveredData, setHoveredData] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [hiddenCategories, setHiddenCategories] = useState(new Set());
    const [selectedPeriod, setSelectedPeriod] = useState('yearly'); // 'yearly' or 'YYYY-MM'

    const handleMouseMove = (e) => {
        if (!hoveredData) return;
        setMousePos({
            x: e.clientX,
            y: e.clientY
        });
    };

    // 1. Calculate Monthly Aggregates (to get available months and base data)
    const rawData = useMemo(() => {
        const dates = [
            ...bills.filter(b => b.paid).map(b => b.paidDate || b.due),
            ...transactions.map(t => t.date)
        ].filter(Boolean).sort();

        if (dates.length === 0) return [];

        const minDate = new Date(dates[0] + 'T00:00:00');
        const startYear = minDate.getFullYear();
        const startMonth = minDate.getMonth();

        const maxDataDate = new Date(dates[dates.length - 1] + 'T00:00:00');
        const finalDate = new Date(Math.max(TODAY, maxDataDate));
        const limitYear = finalDate.getFullYear();
        const limitMonth = finalDate.getMonth();

        const timeline = [];
        let currYear = startYear;
        let currMonth = startMonth;

        while (currYear < limitYear || (currYear === limitYear && currMonth <= limitMonth)) {
            const monthKey = `${currYear}-${String(currMonth + 1).padStart(2, '0')}`;
            timeline.push({
                key: monthKey,
                categories: {},
                label: new Date(currYear, currMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            });
            currMonth++;
            if (currMonth > 11) {
                currMonth = 0;
                currYear++;
            }
        }

        const getBucketIndex = (dateStr) => {
            if (!dateStr) return -1;
            const d = new Date(dateStr + 'T00:00:00');
            const totalMonths = (d.getFullYear() - startYear) * 12 + (d.getMonth() - startMonth);
            return (totalMonths >= 0 && totalMonths < timeline.length) ? totalMonths : -1;
        };

        bills.forEach(b => {
            if (!b.paid) return;
            const idx = getBucketIndex(b.paidDate || b.due);
            if (idx !== -1) {
                const cat = b.category || 'Other';
                timeline[idx].categories[cat] = (timeline[idx].categories[cat] || 0) + b.amount;
            }
        });

        transactions.forEach(t => {
            const idx = getBucketIndex(t.date);
            if (idx !== -1) {
                const cat = t.category || 'Misc';
                timeline[idx].categories[cat] = (timeline[idx].categories[cat] || 0) + t.amount;
            }
        });

        return timeline;
    }, [bills, transactions]);

    // 2. Filter and Aggregate for current selection
    const chartData = useMemo(() => {
        const totals = {};
        let grandTotal = 0;

        rawData.forEach(month => {
            if (selectedPeriod === 'yearly' || selectedPeriod === month.key) {
                Object.entries(month.categories).forEach(([cat, amount]) => {
                    if (!hiddenCategories.has(cat)) {
                        totals[cat] = (totals[cat] || 0) + amount;
                        grandTotal += amount;
                    }
                });
            }
        });

        const sortedData = Object.entries(totals)
            .map(([cat, amount]) => ({
                cat,
                amount,
                percent: grandTotal > 0 ? (amount / grandTotal) * 100 : 0,
                color: CATEGORY_COLORS[cat] || '#cbd5e1'
            }))
            .sort((a, b) => b.amount - a.amount);

        return { slices: sortedData, grandTotal };
    }, [rawData, selectedPeriod, hiddenCategories]);

    // Pie Layout Logic
    const size = 300;
    const center = size / 2;
    const radius = size * 0.4;
    const innerRadius = radius * 0.6; // For donut look

    const getCoordinatesForPercent = (percent) => {
        // Subtract 0.25 to start at 12 o'clock instead of 3 o'clock
        const x = Math.cos(2 * Math.PI * (percent - 0.25));
        const y = Math.sin(2 * Math.PI * (percent - 0.25));
        return [x, y];
    };

    let cumulativePercent = 0;

    const toggleCategory = (cat) => {
        const next = new Set(hiddenCategories);
        if (next.has(cat)) next.delete(cat);
        else next.add(cat);
        setHiddenCategories(next);
    };

    const trendData = useMemo(() => {
        if (!hoveredData || selectedPeriod !== 'yearly') return [];
        return rawData.map(month => ({
            amount: month.categories[hoveredData.cat] || 0
        }));
    }, [hoveredData, selectedPeriod, rawData]);

    const trendAvg = useMemo(() => {
        if (trendData.length === 0) return 0;
        return trendData.reduce((sum, d) => sum + d.amount, 0) / trendData.length;
    }, [trendData]);

    return (
        <div className="w-full flex flex-col items-center relative" onMouseMove={handleMouseMove}>
            {hoveredData && selectedPeriod === 'yearly' && trendData.length > 1 && (
                <div
                    className="fixed z-[999] pointer-events-none"
                    style={{
                        left: mousePos.x + 20,
                        top: mousePos.y + 20
                    }}
                >
                    <div className="bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-700/50 min-w-[200px]">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{hoveredData.cat}</p>
                            <p className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Avg: ${trendAvg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        </div>
                        <svg width="180" height="80" className="overflow-visible">
                            {(() => {
                                const max = Math.max(...trendData.map(d => d.amount), 1);
                                const points = trendData.map((d, i) => {
                                    const x = (i / (trendData.length - 1)) * 180;
                                    const y = 70 - (d.amount / max) * 60;
                                    return `${x},${y}`;
                                }).join(' ');
                                return (
                                    <>
                                        <polyline
                                            fill="none"
                                            stroke={hoveredData.color}
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            points={points}
                                            className="drop-shadow-lg"
                                        />
                                        {/* Reference average line */}
                                        <line
                                            x1="0" y1={70 - (trendAvg / max) * 60}
                                            x2="180" y2={70 - (trendAvg / max) * 60}
                                            stroke="currentColor"
                                            className="text-slate-700"
                                            strokeWidth="1"
                                            strokeDasharray="4 4"
                                        />
                                    </>
                                );
                            })()}
                        </svg>
                        <div className="mt-2 flex justify-between text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                            <span>{rawData[0].label}</span>
                            <span>{rawData[rawData.length - 1].label}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Header / Dropdown Area */}
            <div className="w-full flex justify-end mb-4">
                <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2A9D8F] transition-all"
                >
                    <option value="yearly">Full Year Breakdown</option>
                    {[...rawData].reverse().map(month => (
                        <option key={month.key} value={month.key}>{month.label}</option>
                    ))}
                </select>
            </div>

            <div className="relative group">
                {chartData.grandTotal > 0 ? (
                    <svg viewBox={`0 0 ${size} ${size}`} className="w-64 h-64 overflow-visible drop-shadow-2xl">
                        {chartData.slices.map((slice, i) => {
                            const [startX, startY] = getCoordinatesForPercent(cumulativePercent);

                            // If it's a 100% slice, the end point is the same as the start point,
                            // which causes SVG arcs to disappear. We slightly adjust to 99.99%.
                            const slicePercent = slice.percent >= 100 ? 99.99 : slice.percent;
                            cumulativePercent += slicePercent / 100;

                            const [endX, endY] = getCoordinatesForPercent(cumulativePercent);

                            const largeArcFlag = slicePercent > 50 ? 1 : 0;

                            const pathData = [
                                `M ${center + startX * radius} ${center + startY * radius}`,
                                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${center + endX * radius} ${center + endY * radius}`,
                                `L ${center + endX * innerRadius} ${center + endY * innerRadius}`,
                                `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${center + startX * innerRadius} ${center + startY * innerRadius}`,
                                'Z'
                            ].join(' ');

                            return (
                                <path
                                    key={i}
                                    d={pathData}
                                    fill={slice.color}
                                    className="transition-all duration-300 hover:opacity-100 opacity-90 cursor-pointer hover:scale-105 origin-center"
                                    onMouseEnter={() => setHoveredData(slice)}
                                    onMouseLeave={() => setHoveredData(null)}
                                />
                            );
                        })}
                        {/* Center Text */}
                        <g className="pointer-events-none">
                            <text x={center} y={center - 8} textAnchor="middle" className="text-[10px] uppercase font-black fill-slate-400 tracking-widest">
                                {hoveredData ? hoveredData.cat : 'Total Spending'}
                            </text>
                            <text x={center} y={center + 15} textAnchor="middle" className="text-xl font-black fill-slate-800 dark:fill-white">
                                ${(hoveredData ? hoveredData.amount : chartData.grandTotal).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </text>
                        </g>
                    </svg>
                ) : (
                    <div className="w-64 h-64 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-32 h-32 rounded-full border-4 border-dashed border-slate-200 dark:border-slate-800 mb-4 opacity-50" />
                        <span className="text-xs font-bold uppercase tracking-widest">No data for this period</span>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-8 max-w-md">
                {Object.keys(CATEGORY_COLORS).map(cat => {
                    const isHidden = hiddenCategories.has(cat);
                    const slice = chartData.slices.find(s => s.cat === cat);
                    if (selectedPeriod !== 'yearly' && !slice && !isHidden) return null; // Hide categories with no data in specific month

                    return (
                        <button
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            onMouseEnter={() => setHoveredData(slice)}
                            onMouseLeave={() => setHoveredData(null)}
                            className={`flex items-center gap-2 px-2 py-1 rounded-full border transition-all duration-300 ${isHidden
                                ? 'border-transparent opacity-40 grayscale'
                                : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50'
                                }`}
                        >
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }}></div>
                            <span className={`text-[10px] text-slate-500 font-bold uppercase tracking-tighter ${isHidden ? 'line-through' : ''}`}>
                                {cat} {slice && <span className="opacity-60 ml-1">({slice.percent.toFixed(0)}%)</span>}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};



const FinancialFlowSankey = ({ income, bills, transactions, contributions, goals, selectedYear, portfolioValue = 0 }) => {
    const { nodes, links, totalVolume } = useMemo(() => {
        const getYear = dateStr => dateStr ? parseInt(dateStr.split('-')[0]) : null;

        const yearIncome = income.filter(i => getYear(i.date) === selectedYear);
        const yearBills = bills.filter(b => b.paid && getYear(b.paidDate || b.due) === selectedYear);
        const yearTransactions = transactions.filter(t => getYear(t.date) === selectedYear);
        const yearContributions = contributions.filter(c => getYear(c.date) === selectedYear);

        const incomeBySource = {};
        yearIncome.forEach(i => {
            const source = i.source || 'Other';
            incomeBySource[source] = (incomeBySource[source] || 0) + i.amount;
        });

        const spendingByCategory = {};
        yearBills.forEach(b => {
            const cat = b.category || 'Other';
            spendingByCategory[cat] = (spendingByCategory[cat] || 0) + b.amount;
        });
        yearTransactions.forEach(t => {
            const cat = t.category || 'Misc';
            spendingByCategory[cat] = (spendingByCategory[cat] || 0) + t.amount;
        });

        const savingsByGoal = {};
        let originalRetirementContribution = 0;

        yearContributions.forEach(c => {
            const goal = goals.find(g => g.id === c.goalId);
            if (goal) {
                savingsByGoal[goal.name] = (savingsByGoal[goal.name] || 0) + c.amount;
                if (goal.name.toLowerCase().includes('retirement')) {
                    originalRetirementContribution += c.amount;
                }
            }
        });

        let investmentGap = 0;

        // OVERRIDE: Update "Retirement" goal with actual Portfolio Value if it exists
        if (portfolioValue > 0) {
            Object.keys(savingsByGoal).forEach(key => {
                if (key.toLowerCase().includes('retirement')) {
                    if (portfolioValue > savingsByGoal[key]) {
                        investmentGap = portfolioValue - savingsByGoal[key];
                        savingsByGoal[key] = portfolioValue;
                    }
                    // If portfolio value is somehow less than contributions (loss), we just show portfolio value.
                    // The gap is negative, effectively lost money.
                    // But for the Sankey flow, Input must equal Output.
                    // If Input (Income) > Output (Spending + Reduced Portfolio), we have "Unallocated".
                    // If Input (Income) < Output (Spending + Increased Portfolio), we need extra Source.
                    else if (portfolioValue < savingsByGoal[key]) {
                        savingsByGoal[key] = portfolioValue;
                        // Note: We don't necessarily show 'Loss' as a node unless we want to.
                        // For now, simpler to just start with the new value.
                    }
                }
            });

            // If the key doesn't exist yet (no contributions this year) but we have a portfolio value, add it
            const retirementKey = goals.find(g => g.name.toLowerCase().includes('retirement'))?.name;
            if (retirementKey && !savingsByGoal[retirementKey]) {
                investmentGap = portfolioValue;
                savingsByGoal[retirementKey] = portfolioValue;
            }
        }

        const totalIncome = Object.values(incomeBySource).reduce((a, b) => a + b, 0);
        const totalFixed = yearBills.reduce((a, b) => a + b.amount, 0);
        const totalVariable = yearTransactions.reduce((a, b) => a + b.amount, 0);
        const totalSavings = Object.values(savingsByGoal).reduce((a, b) => a + b, 0);

        const totalOutflow = totalFixed + totalVariable + totalSavings;

        // Total Volume is the max of In or Out for scaling
        // Inputs = Total Income + Investment Gap (Growth/Past Savings)
        const totalInputs = totalIncome + investmentGap;
        const totalVolume = Math.max(totalInputs, totalOutflow, 1);

        const nodesList = [];
        const linksList = [];

        // Level 0: Sources
        Object.entries(incomeBySource).forEach(([source, val]) => {
            nodesList.push({ id: `src-${source}`, label: source, level: 0, value: val, color: '#2A9D8F' });
            linksList.push({ source: `src-${source}`, target: 'master-income', value: val, color: 'rgba(42, 157, 143, 0.2)' });
        });



        // Level 1: Master
        nodesList.push({ id: 'master-income', label: 'Total Flow', level: 1, value: totalVolume, color: '#2A9D8F' });

        // Level 2: Allocation
        nodesList.push({ id: 'alloc-fixed', label: 'Fixed Bills', level: 2, value: totalFixed, color: '#EF8354' });
        nodesList.push({ id: 'alloc-variable', label: 'Lifestyle', level: 2, value: totalVariable, color: '#e9c46a' });
        nodesList.push({ id: 'alloc-savings', label: 'Asset Growth', level: 2, value: totalSavings, color: '#A8DADC' });

        // Ensure links reflect the proportional flow
        // We use the ACTUAL totals for links, not weighted ratios, because the master node holds the sum.
        if (totalVolume > 0) {
            if (totalFixed > 0) linksList.push({ source: 'master-income', target: 'alloc-fixed', value: totalFixed, color: 'rgba(239, 131, 84, 0.2)' });
            if (totalVariable > 0) linksList.push({ source: 'master-income', target: 'alloc-variable', value: totalVariable, color: 'rgba(233, 196, 106, 0.2)' });
            if (totalSavings > 0) linksList.push({ source: 'master-income', target: 'alloc-savings', value: totalSavings, color: 'rgba(168, 218, 220, 0.2)' });
        }

        // Level 3: Destinations
        Object.entries(spendingByCategory).forEach(([cat, val]) => {
            const isBill = yearBills.some(b => b.category === cat);
            const targetId = `dest-${cat}`;
            const groupId = isBill ? 0 : 1;
            nodesList.push({ id: targetId, label: cat, level: 3, value: val, color: CATEGORY_COLORS[cat] || '#cbd5e1', groupId });
            linksList.push({
                source: isBill ? 'alloc-fixed' : 'alloc-variable',
                target: targetId,
                value: val,
                color: `${CATEGORY_COLORS[cat] || '#cbd5e1'}33`
            });
        });

        Object.entries(savingsByGoal).forEach(([goalName, val]) => {
            const targetId = `goal-${goalName}`;
            nodesList.push({ id: targetId, label: goalName, level: 3, value: val, color: '#10b981', groupId: 2 });
            linksList.push({ source: 'alloc-savings', target: targetId, value: val, color: 'rgba(16, 185, 129, 0.2)' });
        });

        return { nodes: nodesList, links: linksList, totalVolume };
    }, [income, bills, transactions, contributions, goals, selectedYear, portfolioValue]);

    // Calculate dynamic height
    const maxNodesInLevel = Math.max(...[0, 1, 2, 3].map(lvl => nodes.filter(n => n.level === lvl).length));
    const minNodeSpacing = 60;
    const paddingY = 60;
    const requiredHeight = (maxNodesInLevel * minNodeSpacing) + (paddingY * 2);
    const height = Math.max(500, requiredHeight);

    const width = 1200;
    const nodeWidth = 12;
    const paddingLeft = 190;
    const paddingRight = 190;
    const levelSpacing = (width - paddingLeft - paddingRight) / 3;

    const vizNodes = useMemo(() => {
        const levels = [0, 1, 2, 3];
        const result = {};

        levels.forEach(lvl => {
            const levelNodes = nodes.filter(n => n.level === lvl).sort((a, b) => {
                if (a.level === 3 && b.level === 3 && a.groupId !== b.groupId) {
                    return (a.groupId || 0) - (b.groupId || 0);
                }
                return b.value - a.value;
            });

            const maxNodes = Math.max(...levels.map(lvl => nodes.filter(n => n.level === lvl).length));
            const maxSpacing = Math.max(0, (maxNodes - 1) * 30);
            const availableContentHeight = Math.max(10, height - (paddingY * 2) - maxSpacing);

            levelNodes.forEach(node => {
                // Height proportional to value relative to totalVolume
                const ratio = node.value / totalVolume;
                let nodeHeight = ratio * availableContentHeight;
                nodeHeight = Math.max(nodeHeight, 4);

                result[node.id] = {
                    ...node,
                    x: paddingLeft + lvl * levelSpacing,
                    y: 0,
                    height: nodeHeight,
                    sourceY: 0,
                    targetY: 0
                };
            });

            // Vertically center the group
            const groupHeight = levelNodes.reduce((sum, n) => sum + result[n.id].height, 0) + (levelNodes.length - 1) * 30;
            let startY = (height - groupHeight) / 2;

            levelNodes.forEach(node => {
                const n = result[node.id];
                n.y = startY;
                n.sourceY = startY;
                n.targetY = startY;
                startY += n.height + 30;
            });
        });

        return result;
    }, [nodes, totalVolume, height]);

    const vizLinks = useMemo(() => {
        return links.map(link => {
            const source = vizNodes[link.source];
            const target = vizNodes[link.target];
            if (!source || !target) return null;

            const linkHeight = (link.value / source.value) * source.height;

            const sy = source.sourceY;
            const ty = target.targetY;

            source.sourceY += linkHeight;
            target.targetY += linkHeight;

            const x0 = source.x + nodeWidth;
            const x1 = target.x;
            const xi = (x0 + x1) / 2;

            const path = `M ${x0} ${sy} C ${xi} ${sy}, ${xi} ${ty}, ${x1} ${ty} v ${linkHeight} C ${xi} ${ty + linkHeight}, ${xi} ${sy + linkHeight}, ${x0} ${sy + linkHeight} Z`;

            return { ...link, path, height: linkHeight };
        }).filter(Boolean);
    }, [links, vizNodes, nodeWidth]);

    if (totalVolume <= 1) {
        return (
            <div className="min-h-[350px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Banknote className="text-slate-300 mb-4" size={48} />
                <p className="text-slate-400 font-medium">Add income and expenses to see your cash flow.</p>
            </div>
        );
    }

    // --- Magnifying Glass Logic ---
    const [zoomState, setZoomState] = useState({ x: 0, y: 0, active: false });
    const svgRef = React.useRef(null);

    const handleMouseMove = (e) => {
        if (!svgRef.current) return;
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
        setZoomState({ x: svgP.x, y: svgP.y, active: true });
    };

    const handleMouseLeave = () => {
        setZoomState(prev => ({ ...prev, active: false }));
    };

    // Helper to render chart content (nodes + links)
    const renderChartContent = () => (
        <>
            {vizLinks.map((link, i) => (
                <path
                    key={i}
                    d={link.path}
                    fill={link.color}
                    className="transition-all duration-300 hover:fill-opacity-50 cursor-help"
                >
                    <title>{`${link.value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}`}</title>
                </path>
            ))}
            {Object.values(vizNodes).map(node => (
                <g key={node.id} className="group">
                    <rect
                        x={node.x}
                        y={node.y}
                        width={nodeWidth}
                        height={node.height}
                        fill={node.color}
                        rx="2"
                        className="shadow-sm"
                    />
                    <text
                        x={node.level < 2 ? node.x - 12 : node.x + nodeWidth + 12}
                        y={node.y + node.height / 2 - 2}
                        textAnchor={node.level < 2 ? "end" : "start"}
                        alignmentBaseline="auto"
                        className="text-xs font-black uppercase tracking-widest fill-slate-500 dark:fill-slate-400 transition-colors group-hover:fill-slate-900 dark:group-hover:fill-white"
                    >
                        {node.label}
                    </text>
                    <text
                        x={node.level < 2 ? node.x - 12 : node.x + nodeWidth + 12}
                        y={node.y + node.height / 2 + 10}
                        textAnchor={node.level < 2 ? "end" : "start"}
                        className="text-[11px] font-bold fill-slate-300 dark:fill-slate-600"
                    >
                        ${node.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </text>
                </g>
            ))}
        </>
    );

    if (totalVolume <= 1) {
        return (
            <div className="min-h-[350px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Banknote className="text-slate-300 mb-4" size={48} />
                <p className="text-slate-400 font-medium">Add income and expenses to see your cash flow.</p>
            </div>
        );
    }

    return (
        <div className="w-full relative pb-6 overflow-hidden rounded-xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800">
            <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                className="w-full cursor-none"
                style={{ height: `${height}px` }}
                preserveAspectRatio="xMidYMid meet"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <defs>
                    <clipPath id="glass-clip">
                        <circle cx={zoomState.x} cy={zoomState.y} r={150} />
                    </clipPath>
                    {/* Optional: Drop shadow for the glass rim */}
                    <filter id="glass-shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.3" />
                    </filter>
                </defs>

                {/* 1. Base Layer: Normal Chart */}
                {renderChartContent()}

                {/* 2. Magnifying Glass Overlay */}
                {zoomState.active && (
                    <g className="pointer-events-none">
                        {/* The zoomed content, clipped to the circle */}
                        <g clipPath="url(#glass-clip)">
                            <g transform={`translate(${zoomState.x}, ${zoomState.y}) scale(2) translate(-${zoomState.x}, -${zoomState.y})`}>
                                {/* Background for the glass to hide underlying elements and simulate proper lens */}
                                <rect x={zoomState.x - 150} y={zoomState.y - 150} width="300" height="300" fill="var(--bg-card)" opacity="0.95" />
                                {renderChartContent()}
                            </g>
                        </g>

                        {/* The glass rim/border */}
                        <circle
                            cx={zoomState.x}
                            cy={zoomState.y}
                            r={150}
                            fill="none"
                            stroke="var(--border)"
                            strokeWidth="4"
                            style={{ filter: 'url(#glass-shadow)' }}
                        />
                        <circle
                            cx={zoomState.x}
                            cy={zoomState.y}
                            r={150}
                            fill="none"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="1"
                        />
                    </g>
                )}
            </svg>
        </div>
    );
};


const CategoryTrendsLineChart = ({ bills, transactions = [] }) => {
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [hiddenCategories, setHiddenCategories] = useState(new Set());

    const { timeline, categories } = useMemo(() => {
        const dates = [
            ...bills.filter(b => b.paid).map(b => b.paidDate || b.due),
            ...transactions.map(t => t.date)
        ].filter(Boolean).sort();

        if (dates.length === 0) return { timeline: [], categories: [] };

        const minDate = new Date(dates[0] + 'T00:00:00');
        const startYear = minDate.getFullYear();
        const startMonth = minDate.getMonth();

        const finalDate = new Date(TODAY);
        const limitYear = finalDate.getFullYear();
        const limitMonth = finalDate.getMonth();

        const localTimeline = [];
        let currYear = startYear;
        let currMonth = startMonth;

        while (currYear < limitYear || (currYear === limitYear && currMonth <= limitMonth)) {
            const monthKey = `${currYear}-${String(currMonth + 1).padStart(2, '0')}`;
            localTimeline.push({
                key: monthKey,
                cats: {},
                label: new Date(currYear, currMonth).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            });
            currMonth++;
            if (currMonth > 11) {
                currMonth = 0;
                currYear++;
            }
        }

        const getBucketIndex = (dateStr) => {
            if (!dateStr) return -1;
            const d = new Date(dateStr + 'T00:00:00');
            const totalMonths = (d.getFullYear() - startYear) * 12 + (d.getMonth() - startMonth);
            return (totalMonths >= 0 && totalMonths < localTimeline.length) ? totalMonths : -1;
        };

        const activeCats = new Set();

        bills.forEach(b => {
            if (!b.paid) return;
            const idx = getBucketIndex(b.paidDate || b.due);
            if (idx !== -1) {
                const cat = b.category || 'Other';
                localTimeline[idx].cats[cat] = (localTimeline[idx].cats[cat] || 0) + b.amount;
                activeCats.add(cat);
            }
        });

        transactions.forEach(t => {
            const idx = getBucketIndex(t.date);
            if (idx !== -1) {
                const cat = t.category || 'Misc';
                localTimeline[idx].cats[cat] = (localTimeline[idx].cats[cat] || 0) + t.amount;
                activeCats.add(cat);
            }
        });

        return { timeline: localTimeline, categories: Array.from(activeCats).sort() };
    }, [bills, transactions]);

    const maxVal = useMemo(() => {
        let max = 100;
        timeline.forEach(m => {
            Object.entries(m.cats).forEach(([cat, val]) => {
                if (!hiddenCategories.has(cat) && val > max) max = val;
            });
        });
        return max * 1.1;
    }, [timeline, hiddenCategories]);

    const width = 800;
    const height = 300;
    const padding = 40;

    const getX = (index) => padding + (index * (width - padding * 2)) / (timeline.length - 1 || 1);
    const getY = (val) => height - padding - (val * (height - padding * 2)) / maxVal;

    const toggleCategory = (cat) => {
        const next = new Set(hiddenCategories);
        if (next.has(cat)) next.delete(cat);
        else next.add(cat);
        setHiddenCategories(next);
    };

    if (timeline.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-400 font-medium">No spending data to visualize trends.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="relative h-[300px] w-full">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                        <g key={i}>
                            <line x1={padding} y1={getY(maxVal * p)} x2={width - padding} y2={getY(maxVal * p)} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="4 4" />
                            <text x={padding - 10} y={getY(maxVal * p)} textAnchor="end" alignmentBaseline="middle" className="text-[10px] fill-slate-400 font-bold">
                                ${Math.round(maxVal * p).toLocaleString()}
                            </text>
                        </g>
                    ))}

                    {/* Timeline Labels */}
                    {timeline.map((m, i) => {
                        // Only show every Nth label if too many
                        if (timeline.length > 12 && i % Math.ceil(timeline.length / 12) !== 0 && i !== timeline.length - 1) return null;
                        return (
                            <text key={i} x={getX(i)} y={height - padding + 20} textAnchor="middle" className="text-[10px] fill-slate-400 font-bold">
                                {m.label}
                            </text>
                        );
                    })}

                    {/* Category Lines */}
                    {categories.map(cat => {
                        if (hiddenCategories.has(cat)) return null;
                        const color = CATEGORY_COLORS[cat] || '#cbd5e1';
                        const points = timeline.map((m, i) => `${getX(i)},${getY(m.cats[cat] || 0)}`).join(' ');

                        return (
                            <g key={cat} className="transition-opacity duration-300">
                                <polyline
                                    fill="none"
                                    stroke={color}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    points={points}
                                    className="drop-shadow-sm opacity-80"
                                />
                                {timeline.map((m, i) => (
                                    <circle
                                        key={i}
                                        cx={getX(i)}
                                        cy={getY(m.cats[cat] || 0)}
                                        r="4"
                                        fill={color}
                                        className="cursor-pointer hover:r-6 transition-all"
                                        onMouseEnter={(e) => setHoveredPoint({ cat, month: m.label, amount: m.cats[cat] || 0, x: e.clientX, y: e.clientY })}
                                        onMouseLeave={() => setHoveredPoint(null)}
                                    />
                                ))}
                            </g>
                        );
                    })}
                </svg>

                {/* Tooltip */}
                {hoveredPoint && (
                    <div
                        className="fixed z-[100] bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl pointer-events-none animate-in fade-in zoom-in-95 duration-200"
                        style={{ left: hoveredPoint.x + 15, top: hoveredPoint.y - 45 }}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[hoveredPoint.cat] || '#cbd5e1' }} />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{hoveredPoint.cat}</span>
                        </div>
                        <div className="text-sm font-bold">${hoveredPoint.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{hoveredPoint.month}</div>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${hiddenCategories.has(cat)
                            ? 'border-slate-100 dark:border-slate-800 opacity-40grayscale'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm'}`}
                    >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] || '#cbd5e1' }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">{cat}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};


const MonthlyCashBackChart = ({ transactions, selectedYear }) => {
    const [hoveredData, setHoveredData] = useState(null);

    const monthlyData = useMemo(() => {
        // Build all 12 months for the selected year
        const months = [];
        for (let month = 0; month < 12; month++) {
            months.push({
                year: selectedYear,
                month: month,
                amount: 0,
                label: new Date(selectedYear, month, 1).toLocaleDateString('en-US', { month: 'short' })
            });
        }

        // Aggregate cash back by month for the selected year
        transactions.forEach(t => {
            if (!t.date || !t.cashBackEarned) return;
            const d = new Date(t.date + 'T00:00:00');
            if (d.getFullYear() === selectedYear) {
                const monthIdx = d.getMonth();
                months[monthIdx].amount += t.cashBackEarned;
            }
        });

        return months;
    }, [transactions, selectedYear]);

    const maxVal = Math.max(...monthlyData.map(d => d.amount), 0.5);

    const height = 200;
    const viewWidth = 1000;
    const padding = 40;
    const plotWidth = viewWidth - (padding * 2);
    const count = monthlyData.length;
    const itemWidth = count > 0 ? Math.min(plotWidth / count, 100) : plotWidth;
    const barWidth = Math.min(40, (itemWidth * 0.6));
    const scale = (height / 2 - 30) / maxVal;

    const getSlotX = (i) => padding + (i * itemWidth) + (itemWidth / 2);

    const avgCashBack = useMemo(() => {
        const monthsWithData = monthlyData.filter(m => m.amount > 0);
        if (monthsWithData.length === 0) return 0;
        return monthsWithData.reduce((sum, m) => sum + m.amount, 0) / monthsWithData.length;
    }, [monthlyData]);

    const avgLineY = (height / 2) - (avgCashBack * scale);

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${viewWidth} ${height}`} className="w-full h-48 overflow-visible" preserveAspectRatio="none">
                <line x1="0" y1={height / 2} x2="100%" y2={height / 2} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="1" />

                {/* Average line */}
                {avgCashBack > 0 && (
                    <g>
                        <line
                            x1={padding} y1={avgLineY}
                            x2={viewWidth - padding} y2={avgLineY}
                            stroke="#A8DADC" strokeWidth="1.5" strokeDasharray="6 4"
                            className="opacity-50"
                        />
                        <text x={viewWidth - padding} y={avgLineY - 8} textAnchor="end" className="text-[11px] font-bold fill-[#A8DADC] uppercase">Avg: ${avgCashBack.toFixed(2)}</text>
                    </g>
                )}

                {monthlyData.map((month, i) => {
                    const centerX = getSlotX(i);
                    const barX = centerX - barWidth / 2;
                    const barHeight = Math.max(month.amount * scale, month.amount > 0 ? 4 : 0);

                    return (
                        <g key={i} className="group">
                            <rect
                                x={barX}
                                y={(height / 2) - barHeight}
                                width={barWidth}
                                height={barHeight}
                                className="fill-[#2A9D8F] transition-all duration-300 hover:brightness-110 cursor-pointer"
                                rx="2"
                                onMouseEnter={() => setHoveredData({ x: centerX, y: (height / 2) - barHeight, value: month.amount, label: month.label })}
                                onMouseLeave={() => setHoveredData(null)}
                            />
                            <text x={centerX} y={height + 15} className="text-xs font-bold fill-slate-400 uppercase" textAnchor="middle">{month.label}</text>
                        </g>
                    );
                })}

                {hoveredData && (
                    <g transform={`translate(${hoveredData.x}, ${hoveredData.y})`} className="pointer-events-none transition-all duration-200 ease-out z-50">
                        <rect x="-50" y="-55" width="100" height="45" rx="8" className="fill-slate-800 dark:fill-slate-100 shadow-xl opacity-95" />
                        <text x="0" y="-37" textAnchor="middle" className="fill-slate-300 dark:fill-slate-500 text-[9px] font-bold uppercase tracking-wider">{hoveredData.label}</text>
                        <text x="0" y="-20" textAnchor="middle" className="fill-white dark:fill-slate-900 text-sm font-bold">${hoveredData.value.toFixed(2)}</text>
                    </g>
                )}
            </svg>
        </div>
    );
};

const MonthlyIncomeChart = ({ income, selectedYear }) => {
    const [hoveredData, setHoveredData] = useState(null);

    const monthlyData = useMemo(() => {
        // Build all 12 months for the selected year
        const months = [];
        for (let month = 0; month < 12; month++) {
            months.push({
                year: selectedYear,
                month: month,
                amount: 0,
                label: new Date(selectedYear, month, 1).toLocaleDateString('en-US', { month: 'short' })
            });
        }

        // Aggregate income by month for the selected year
        income.forEach(i => {
            if (!i.date) return;
            const d = new Date(i.date + 'T00:00:00');
            if (d.getFullYear() === selectedYear) {
                const monthIdx = d.getMonth();
                months[monthIdx].amount += i.amount;
            }
        });

        return months;
    }, [income, selectedYear]);

    // Calculate average only from months that have data
    const avgIncome = useMemo(() => {
        const monthsWithData = monthlyData.filter(m => m.amount > 0);
        if (monthsWithData.length === 0) return 0;
        return monthsWithData.reduce((sum, m) => sum + m.amount, 0) / monthsWithData.length;
    }, [monthlyData]);

    const maxVal = Math.max(...monthlyData.map(d => d.amount), avgIncome, 100);

    // Match MoneyFlowChart structure exactly
    const height = 200;
    const viewWidth = 1000;
    const padding = 40;
    const plotWidth = viewWidth - (padding * 2);
    const count = monthlyData.length;
    const itemWidth = count > 0 ? Math.min(plotWidth / count, 100) : plotWidth;
    const barWidth = Math.min(40, (itemWidth * 0.6));
    const scale = (height / 2 - 30) / maxVal;

    const getSlotX = (i) => padding + (i * itemWidth) + (itemWidth / 2);

    // Calculate average line Y position
    const avgLineY = (height / 2) - (avgIncome * scale);

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${viewWidth} ${height}`} className="w-full h-48 overflow-visible" preserveAspectRatio="none">
                {/* Grey baseline in the middle */}
                <line x1="0" y1={height / 2} x2="100%" y2={height / 2} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="1" />

                {/* Average income line */}
                {avgIncome > 0 && (
                    <g>
                        <line
                            x1={padding}
                            y1={avgLineY}
                            x2={viewWidth - padding}
                            y2={avgLineY}
                            stroke="#2A9D8F"
                            strokeWidth="2"
                            strokeDasharray="6 4"
                            className="opacity-70"
                        />
                        <text
                            x={viewWidth - padding}
                            y={avgLineY - 8}
                            textAnchor="end"
                            className="text-[11px] font-bold fill-[#A8DADC] uppercase"
                        >
                            Avg: ${avgIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </text>
                    </g>
                )}

                {monthlyData.map((month, i) => {
                    const centerX = getSlotX(i);
                    const barX = centerX - barWidth / 2;
                    const barHeight = Math.max(month.amount * scale, month.amount > 0 ? 4 : 0);

                    return (
                        <g key={i} className="group">
                            {/* Bar extends UP from baseline (positive) */}
                            <rect
                                x={barX}
                                y={(height / 2) - barHeight}
                                width={barWidth}
                                height={barHeight}
                                className="fill-[#2A9D8F] transition-all duration-300 hover:brightness-110 cursor-pointer"
                                rx="2"
                                onMouseEnter={() => setHoveredData({ x: centerX, y: (height / 2) - barHeight, value: month.amount, label: 'In', month: month.label })}
                                onMouseLeave={() => setHoveredData(null)}
                            />
                            {/* Month label below */}
                            <text x={centerX} y={height + 15} className="text-xs font-bold fill-slate-400 uppercase" textAnchor="middle">{month.label}</text>
                        </g>
                    );
                })}

                {/* Hover tooltip */}
                {hoveredData && (
                    <g transform={`translate(${hoveredData.x}, ${hoveredData.y})`} className="pointer-events-none transition-all duration-200 ease-out z-50">
                        <rect x="-55" y="-55" width="110" height="45" rx="8" className="fill-slate-800 dark:fill-slate-100 shadow-xl opacity-95" />
                        <text x="0" y="-37" textAnchor="middle" className="fill-slate-300 dark:fill-slate-500 text-[9px] font-bold uppercase tracking-wider">{hoveredData.label}</text>
                        <text x="0" y="-20" textAnchor="middle" className="fill-white dark:fill-slate-900 text-sm font-bold">${hoveredData.value.toLocaleString()}</text>
                    </g>
                )}
            </svg>
        </div>
    );
};

// Distinct color palette for savings goal segments — ensures visual separation even when goals share the same stored color
const SAVINGS_GOAL_COLORS = [
    '#2A9D8F', // teal
    '#e76f51', // burnt sienna
    '#e9c46a', // sand yellow
    '#457b9d', // muted blue
    '#a8dadc', // seafoam
    '#f4a261', // muted orange
    '#8ecae6', // sky blue
    '#c77dff', // lavender
];

const MonthlySavingsChart = ({ contributions = [], goals = [], selectedYear }) => {
    const [hoveredData, setHoveredData] = useState(null);

    // Build a stable goal-index → color mapping so colors don't shift when months change
    const goalColorMap = useMemo(() => {
        const map = {};
        goals.forEach((g, idx) => {
            map[g.id] = SAVINGS_GOAL_COLORS[idx % SAVINGS_GOAL_COLORS.length];
        });
        return map;
    }, [goals]);

    const monthlyData = useMemo(() => {
        const months = [];
        for (let month = 0; month < 12; month++) {
            months.push({
                year: selectedYear,
                month: month,
                goals: {}, // goalId -> amount
                total: 0,
                label: new Date(selectedYear, month, 1).toLocaleDateString('en-US', { month: 'short' })
            });
        }

        const validGoalIds = new Set(goals.map(g => g.id));

        contributions.forEach(c => {
            if (!c.date) return;
            // Only process contributions for currently active goals
            if (!validGoalIds.has(c.goalId)) return;

            const d = new Date(c.date + 'T00:00:00');
            if (d.getFullYear() === selectedYear) {
                const monthIdx = d.getMonth();
                const goalId = c.goalId;
                months[monthIdx].goals[goalId] = (months[monthIdx].goals[goalId] || 0) + c.amount;
                months[monthIdx].total += c.amount;
            }
        });

        return months;
    }, [contributions, goals, selectedYear]);

    const avgSavings = useMemo(() => {
        const monthsWithData = monthlyData.filter(m => m.total > 0);
        if (monthsWithData.length === 0) return 0;
        return monthsWithData.reduce((sum, m) => sum + m.total, 0) / monthsWithData.length;
    }, [monthlyData]);

    const maxVal = Math.max(...monthlyData.map(d => d.total), avgSavings, 100);

    const height = 200;
    const viewWidth = 1000;
    const padding = 40;
    const plotWidth = viewWidth - (padding * 2);
    const count = monthlyData.length;
    const itemWidth = count > 0 ? Math.min(plotWidth / count, 100) : plotWidth;
    const barWidth = Math.min(40, (itemWidth * 0.6));
    const scale = (height / 2 - 30) / maxVal;

    const getSlotX = (i) => padding + (i * itemWidth) + (itemWidth / 2);
    const avgLineY = (height / 2) - (avgSavings * scale);

    // Only show legend for goals that have contributions this year
    const activeGoalIds = useMemo(() => {
        const ids = new Set();
        monthlyData.forEach(m => Object.keys(m.goals).forEach(id => ids.add(id)));
        return [...ids];
    }, [monthlyData]);

    const goalMap = useMemo(() => {
        const map = {};
        goals.forEach(g => { map[g.id] = g; });
        return map;
    }, [goals]);

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${viewWidth} ${height}`} className="w-full h-48 overflow-visible" preserveAspectRatio="none">
                <line x1="0" y1={height / 2} x2="100%" y2={height / 2} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="1" />

                {avgSavings > 0 && (
                    <g>
                        <line x1={padding} y1={avgLineY} x2={viewWidth - padding} y2={avgLineY} stroke="#A8DADC" strokeWidth="1.5" strokeDasharray="6 4" className="opacity-50" />
                        <text x={viewWidth - padding} y={avgLineY - 8} textAnchor="end" className="text-[11px] font-bold fill-[#A8DADC] uppercase">Avg: ${avgSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</text>
                    </g>
                )}

                {monthlyData.map((month, i) => {
                    const centerX = getSlotX(i);
                    const barX = centerX - barWidth / 2;

                    let currentY = height / 2;
                    const goalEntries = Object.entries(month.goals);

                    return (
                        <g key={i} className="group">
                            {goalEntries.map(([goalId, amount]) => {
                                const segmentHeight = Math.max(amount * scale, 2);
                                const segmentY = currentY - segmentHeight;
                                const goal = goalMap[goalId] || { name: 'Unknown Goal' };
                                // Use the stable palette color — not the goal's stored Tailwind class
                                const fillColor = goalColorMap[goalId] || SAVINGS_GOAL_COLORS[0];

                                currentY -= segmentHeight;

                                return (
                                    <rect
                                        key={goalId}
                                        x={barX}
                                        y={segmentY}
                                        width={barWidth}
                                        height={segmentHeight}
                                        style={{ fill: fillColor }}
                                        className="transition-all duration-300 hover:brightness-110 cursor-pointer"
                                        rx="1"
                                        onMouseEnter={() => setHoveredData({
                                            x: centerX,
                                            y: segmentY,
                                            value: amount,
                                            label: `${month.label} · ${goal.name}`,
                                            color: fillColor,
                                        })}
                                        onMouseLeave={() => setHoveredData(null)}
                                    />
                                );
                            })}
                            <text x={centerX} y={height + 15} className="text-xs font-bold fill-slate-400 uppercase" textAnchor="middle">{month.label}</text>
                        </g>
                    );
                })}

                {hoveredData && (
                    <g transform={`translate(${hoveredData.x}, ${hoveredData.y})`} className="pointer-events-none transition-all duration-200 ease-out z-50">
                        <rect x="-70" y="-58" width="140" height="48" rx="8" className="fill-slate-800 dark:fill-slate-100 shadow-xl opacity-95" />
                        <circle cx="-52" cy="-35" r="5" fill={hoveredData.color} />
                        <text x="-42" y="-31" className="fill-slate-300 dark:fill-slate-500 text-[9px] font-bold uppercase tracking-wider">{hoveredData.label}</text>
                        <text x="0" y="-14" textAnchor="middle" className="fill-white dark:fill-slate-900 text-sm font-bold">${hoveredData.value.toLocaleString()}</text>
                    </g>
                )}
            </svg>

            {/* Color-coded legend */}
            {activeGoalIds.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center">
                    {activeGoalIds.map(id => {
                        const goal = goalMap[id];
                        if (!goal) return null;
                        const color = goalColorMap[id] || SAVINGS_GOAL_COLORS[0];
                        return (
                            <div key={id} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{goal.name}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- Main App Component ---

const App = () => {
    const [view, setView] = useState('dashboard');
    // Profile & State
    const [profiles, setProfiles] = usePersistentState('budget_profiles', [{ id: 'default', name: 'Main Profile' }]);
    const [activeProfileId, setActiveProfileId] = usePersistentState('budget_active_profile', 'default');
    const [defaultProfileId, setDefaultProfileId] = usePersistentState('budget_default_profile', null); // Stores ID of auto-load profile
    const [colorPalette, setColorPalette] = usePersistentState('budget_color_palette', 'default'); // Stores selected color palette
    const [bills, setBills] = usePersistentState('budget_bills', [
        { id: 1, profileId: 'default', name: 'Monthly Rent', category: 'Rent/Mortgage', amount: 1200, due: '2025-12-01', paid: true, paidDate: '2025-12-01', recurring: true, frequency: 'Monthly', hasRenewed: true },
        // A future instance of Rent that was auto-generated (example)
        { id: 101, profileId: 'default', name: 'Monthly Rent', category: 'Rent/Mortgage', amount: 1200, due: '2026-01-01', paid: false, recurring: true, frequency: 'Monthly', hasRenewed: false },
        { id: 2, profileId: 'default', name: 'Electricity', category: 'Utilities', amount: 120, due: '2025-12-05', paid: false, recurring: false },
        { id: 3, profileId: 'default', name: 'Internet Fiber', category: 'Utilities', amount: 80, due: '2025-12-10', paid: false, recurring: true, frequency: 'Monthly', hasRenewed: false },
        { id: 4, profileId: 'default', name: 'Car Insurance', category: 'Insurance', amount: 150, due: '2025-12-20', paid: false, recurring: true, frequency: 'Monthly', hasRenewed: false },
        { id: 5, profileId: 'default', name: 'Gym Membership', category: 'Health', amount: 45, due: '2025-12-22', paid: false, recurring: true, frequency: 'Monthly', hasRenewed: false },
    ]);
    const [savingsGoals, setSavingsGoals] = usePersistentState('budget_savings_goals', [
        { id: 1, profileId: 'default', name: 'New Car', target: 25000, current: 8500, color: 'bg-emerald-500' },
        { id: 2, profileId: 'default', name: 'Emergency Fund', target: 10000, current: 9200, color: 'bg-blue-500' },
    ]);
    const [incomeEntries, setIncomeEntries] = usePersistentState('budget_income_entries', [
        { id: 1, profileId: 'default', source: 'Salary', amount: 2500, date: '2025-12-01' },
        { id: 2, profileId: 'default', source: 'Freelance', amount: 400, date: '2025-12-10' },
        { id: 3, profileId: 'default', source: 'Salary', amount: 2500, date: '2025-12-15' },
        { id: 4, profileId: 'default', source: 'Investment', amount: 150, date: '2025-11-20' }
    ]);
    const [transactions, setTransactions] = usePersistentState('budget_transactions', []); // New Transaction Ledger State
    const [budgetSpecs, setBudgetSpecs] = usePersistentState('budget_specs_v2', { total: 2500, categories: {} });
    const [savingsContributions, setSavingsContributions] = usePersistentState('budget_savings_contributions', []);
    const [portfolioData, setPortfolioData] = usePersistentState('investments_portfolio_v2', null); // Lifted state for shared access
    const [cashBalance, setCashBalance] = usePersistentState('investments_cash_v2', 0); // Lifted cash state

    const [savingsYear, setSavingsYear] = useState(TODAY.getFullYear());

    // Migration: Capture initial savings balances if history is empty
    useEffect(() => {
        if (savingsGoals.length > 0 && savingsContributions.length === 0) {
            const initialContributions = savingsGoals
                .filter(g => g.current > 0)
                .map((g, idx) => ({
                    id: Date.now() + idx,
                    goalId: g.id,
                    profileId: g.profileId,
                    amount: g.current,
                    date: formatDate(TODAY)
                }));
            if (initialContributions.length > 0) {
                setSavingsContributions(initialContributions);
            }
        }
    }, [savingsGoals, savingsContributions.length, setSavingsContributions]);

    // Default Profile Enforcement on Load
    useEffect(() => {
        // Run only once on mount logic effectively
        const enforceDefault = () => {
            if (defaultProfileId && profiles.some(p => p.id === defaultProfileId)) {
                // Determine if we should obey default profile on this session load.
                // Since `activeProfileId` is persistent, it remembers the LAST used.
                // The user wants "every time anyone loads it up... default profile is saved".
                // This implies overwriting the last active state with the default on fresh load.
                // We'll use a session flag to avoid resetting it during a reload/refresh cycle if desired,
                // but per request "every time anyone loads it up", strict enforcement seems better.
                setActiveProfileId(defaultProfileId);
            }
        };
        // Simple check: if we have a default, switch to it. 
        // Note: This might override manual switches if dependencies trigger too often.
        // We'll trust the component mount cycle. To be safe, we could check a 'hasLoaded' flag.
        const hasEnforced = sessionStorage.getItem('has_enforced_default');
        if (!hasEnforced && defaultProfileId) {
            if (profiles.some(p => p.id === defaultProfileId)) {
                setActiveProfileId(defaultProfileId);
            }
            sessionStorage.setItem('has_enforced_default', 'true');
        }
    }, [defaultProfileId, profiles, setActiveProfileId]);

    // Apply color palette theme class to document body
    useEffect(() => {
        const palette = COLOR_PALETTES[colorPalette] || COLOR_PALETTES.default;
        // Remove all theme classes first
        Object.values(COLOR_PALETTES).forEach(p => {
            if (p.className) document.body.classList.remove(p.className);
        });
        // Add the selected palette's class
        if (palette.className) {
            document.body.classList.add(palette.className);
        }
    }, [colorPalette]);

    // Derived State
    const activeBills = useMemo(() => bills.filter(b => b.profileId === activeProfileId), [bills, activeProfileId]);
    const activeGoals = useMemo(() => savingsGoals.filter(g => g.profileId === activeProfileId), [savingsGoals, activeProfileId]);
    const activeIncome = useMemo(() => incomeEntries.filter(i => i.profileId === activeProfileId), [incomeEntries, activeProfileId]);
    const activeTransactions = useMemo(() => transactions.filter(t => t.profileId === activeProfileId), [transactions, activeProfileId]);
    const activeContributions = useMemo(() => savingsContributions.filter(c => c.profileId === activeProfileId), [savingsContributions, activeProfileId]);
    const currentProfileName = useMemo(() => profiles.find(p => p.id === activeProfileId)?.name || 'Profile', [profiles, activeProfileId]);

    // Calculate Total Portfolio Value for Dashboard
    const totalPortfolioValue = useMemo(() => {
        const calculateVal = (node) => {
            if (!node) return 0;
            if (node.type === 'STOCK') {
                const totalShares = (node.transactions || []).reduce((sum, t) => {
                    return t.type === 'BUY' ? sum + t.shares : sum - t.shares;
                }, 0);
                return totalShares * (node.currentPrice || 0);
            } else if (node.children) {
                return node.children.reduce((sum, child) => sum + calculateVal(child), 0);
            }
            return 0;
        };
        // Ensure we handle the data structure correctly (array vs object migration handled in Investments but raw here)
        let root = portfolioData;
        if (Array.isArray(portfolioData)) {
            // Quick fix for potentially unmigrated array data if simplified
            root = { type: 'PIE', children: portfolioData };
        }
        return calculateVal(root) + (cashBalance || 0);
    }, [portfolioData, cashBalance]);

    const metrics = useMemo(() => {
        const currentMonthCategories = {};

        activeBills
            .filter(b => {
                const dateToUse = b.paidDate ? new Date(b.paidDate + 'T00:00:00') : new Date(b.due + 'T00:00:00');
                return b.paid && dateToUse.getMonth() === TODAY.getMonth() && dateToUse.getFullYear() === TODAY.getFullYear();
            })
            .forEach(b => {
                const cat = b.category || 'Other';
                currentMonthCategories[cat] = (currentMonthCategories[cat] || 0) + b.amount;
            });

        activeTransactions
            .filter(t => {
                const tDate = new Date(t.date + 'T00:00:00');
                return tDate.getMonth() === TODAY.getMonth() && tDate.getFullYear() === TODAY.getFullYear();
            })
            .forEach(t => {
                const cat = t.category || 'Misc';
                currentMonthCategories[cat] = (currentMonthCategories[cat] || 0) + t.amount;
            });

        const currentMonthSpendingCount = Object.values(currentMonthCategories).reduce((acc, curr) => acc + curr, 0);
        const totalSpent = currentMonthSpendingCount;

        const totalSavings = activeGoals.reduce((acc, curr) => acc + curr.current, 0);
        const nextWeek = new Date(TODAY);
        nextWeek.setDate(TODAY.getDate() + 7);

        const dueSoonBills = activeBills.filter(b => {
            if (b.paid) return false;
            const dueDate = new Date(b.due + 'T00:00:00');
            return dueDate >= TODAY && dueDate <= nextWeek;
        });

        const incomeYTD = activeIncome
            .filter(i => new Date(i.date + 'T00:00:00').getFullYear() === TODAY.getFullYear())
            .reduce((acc, curr) => acc + curr.amount, 0);

        const totalCashBack = activeTransactions.reduce((acc, t) => {
            // Precise value for new transactions
            if (t.cashBackEarned !== undefined) return acc + t.cashBackEarned;

            // Fallback for legacy data (estimate from stored percentage string)
            // stored amount is net (original - discount)
            if (t.cashBack && typeof t.cashBack === 'string' && t.cashBack.includes('%')) {
                const rate = parseFloat(t.cashBack) / 100;
                if (rate > 0 && rate < 1) {
                    return acc + (t.amount / (1 - rate)) * rate;
                }
            }
            return acc;
        }, 0);

        const totalIncomeAllTime = activeIncome.reduce((acc, curr) => acc + curr.amount, 0);

        return { totalSavings, totalSpent, dueSoonBills, spendingProgress: (totalSpent / (budgetSpecs.total || 1)) * 100, incomeYTD, totalCashBack, totalIncomeAllTime, currentMonthCategories, budgetSpecs };
    }, [activeBills, activeGoals, activeIncome, activeTransactions, budgetSpecs]);

    const availableYears = useMemo(() => {
        const years = new Set();
        const currentYear = TODAY.getFullYear();
        activeIncome.forEach(i => {
            if (i.date) years.add(new Date(i.date + 'T00:00:00').getFullYear());
        });
        activeBills.forEach(b => {
            if (b.due) years.add(new Date(b.due + 'T00:00:00').getFullYear());
            if (b.paidDate) years.add(new Date(b.paidDate + 'T00:00:00').getFullYear());
        });
        activeTransactions.forEach(t => {
            if (t.date) years.add(new Date(t.date + 'T00:00:00').getFullYear());
        });
        years.add(currentYear);
        return Array.from(years).sort((a, b) => b - a);
    }, [activeIncome, activeBills, activeTransactions]);

    // Local State
    const [isBillModalOpen, setIsBillModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [isDueSoonModalOpen, setIsDueSoonModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);

    // AI Analysis State
    const [isAIAnalysisOpen, setIsAIAnalysisOpen] = useState(false);
    const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
    const [aiProvider, setAiProvider] = usePersistentState('ai_provider', 'gemini');
    const [aiApiKeys, setAiApiKeys] = usePersistentState('ai_api_keys', {});
    const [analysisResult, setAnalysisResult] = usePersistentState('ai_analysis_result', '');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Follow-up State
    const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
    const [followUpQuestion, setFollowUpQuestion] = useState('');

    // Chat thread — persisted so conversation survives page refresh
    const [chatMessages, setChatMessages] = usePersistentState('ai_chat_messages', []);

    // Action Items State
    const [actionItems, setActionItems] = usePersistentState('ai_action_items', []);
    const [isActionBannerExpanded, setIsActionBannerExpanded] = useState(false);
    const [isExtractingActions, setIsExtractingActions] = useState(false);

    // Profile Deletion State
    const [profileToDelete, setProfileToDelete] = useState(null); // ID of profile pending deletion

    // Toast Notification State
    const [toasts, setToasts] = useState([]);
    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    // Form State
    const [isNewBillPaid, setIsNewBillPaid] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false); // New state for modal checkbox
    const [selectedBill, setSelectedBill] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [selectedIncome, setSelectedIncome] = useState(null);

    // --- Dividend Bot State ---
    const [finnhubApiKey, setFinnhubApiKey] = usePersistentState('finnhub_api_key', '');
    const [dismissedDividendIds, setDismissedDividendIds] = usePersistentState('dismissed_dividends', []);
    const [dividendAlerts, setDividendAlerts] = useState([]);

    useEffect(() => {
        const checkDividends = async () => {
            if (!finnhubApiKey || !portfolioData) return;

            // Helper to collect symbols
            const symbols = new Set();
            const collect = (node) => {
                if (node.type === 'STOCK') symbols.add(node.name);
                if (node.children) node.children.forEach(collect);
            };

            let root = portfolioData;
            if (Array.isArray(portfolioData)) root = { children: portfolioData };
            collect(root);

            if (symbols.size === 0) return;

            const notices = [];
            // Check last 30 days to catch any missed recent payments
            const today = new Date();
            const fromDate = new Date(today);
            fromDate.setDate(today.getDate() - 30);

            const fromStr = fromDate.toISOString().split('T')[0];
            const toStr = today.toISOString().split('T')[0];

            const symbolArray = Array.from(symbols);

            for (const symbol of symbolArray) {
                try {
                    // Finnhub Dividend Endpoint
                    const res = await fetch(`https://finnhub.io/api/v1/stock/dividend?symbol=${symbol}&from=${fromStr}&to=${toStr}&token=${finnhubApiKey}`);

                    if (res.status === 403) {
                        console.warn('Finnhub Dividend Endpoint returned 403 Forbidden. Stopping check to prevent spam. (Likely Premium-only endpoint or invalid key)');
                        break; // Stop the loop for all other symbols
                    }

                    if (res.ok) {
                        const data = await res.json();
                        // Expecting array of objects: { date: "2024-xx-xx", amount: 0.xx, payDate: "2024-xx-xx", ... }
                        if (Array.isArray(data)) {
                            data.forEach(div => {
                                // Use payDate as the trigger
                                const dateStr = div.payDate || div.date;
                                if (!dateStr) return;

                                const payDate = new Date(dateStr);
                                // Check if it's in our window (last 30 days) AND <= today
                                // Logic: "on the day ... or 3 days after ... persisted"
                                // So any un-dismissed dividend from the past 30 days should show.
                                if (payDate <= today && payDate >= fromDate) {
                                    const id = `${symbol}-${dateStr}-${div.amount}`;
                                    if (!dismissedDividendIds.includes(id)) {
                                        notices.push({
                                            id,
                                            symbol,
                                            amount: div.amount,
                                            date: dateStr
                                        });
                                    }
                                }
                            });
                        }
                    }
                    // Rate limit safety (Finnhub free is ~60/min)
                    await new Promise(r => setTimeout(r, 1100));
                } catch (e) {
                    console.error(`Failed to check dividends for ${symbol}`, e);
                }
            }

            // Only update if we found something to avoid unnecessary renders
            if (notices.length > 0) {
                setDividendAlerts(notices);
            }
        };

        // Run on mount if we have key and data. 
        // We use a small timeout to let the app hydrate first and not block main thread immediately.
        const timer = setTimeout(() => {
            checkDividends();
        }, 3000);

        return () => clearTimeout(timer);
    }, [finnhubApiKey, portfolioData]); // dismissedDividendIds intentionally omitted to avoid loops

    const openBillModal = (bill = null) => {
        setSelectedBill(bill);
        setIsNewBillPaid(bill ? bill.paid : false);
        setIsRecurring(bill ? bill.recurring : false); // Init recurring state
        setIsBillModalOpen(true);
    };

    const openTransactionModal = (transaction = null) => {
        setSelectedTransaction(transaction);
        setIsTransactionModalOpen(true);
    };

    // Actions
    const handleSaveBill = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const isPaid = formData.get('isPaid') === 'on';
        const isRecur = formData.get('isRecurring') === 'on';
        const frequency = isRecur ? formData.get('frequency') : null;

        const billData = {
            profileId: activeProfileId,
            name: formData.get('name'),
            category: formData.get('category'),
            amount: parseFloat(formData.get('amount')),
            due: formData.get('due'),
            paid: isPaid,
            paidDate: isPaid ? formData.get('paidDate') : null,
            recurring: isRecur,
            frequency: frequency,
            // If we are editing, preserve existing renewal status, else false
            hasRenewed: selectedBill ? selectedBill.hasRenewed : false
        };

        let updatedBills = [...bills];

        // Logic to update or create
        if (selectedBill) {
            updatedBills = updatedBills.map(b => b.id === selectedBill.id ? { ...b, ...billData } : b);
        } else {
            updatedBills.push({ ...billData, id: Date.now() });
        }

        // AUTOMATION: Check if we need to generate the NEXT bill
        if (billData.recurring && billData.paid && !billData.hasRenewed) {
            const nextDueDate = calculateNextDueDate(billData.due, billData.frequency);

            const nextBill = {
                ...billData,
                id: Date.now() + 1, // Ensure unique ID
                due: nextDueDate,
                paid: false,
                paidDate: null,
                hasRenewed: false // The new bill hasn't renewed yet
            };

            updatedBills.push(nextBill);

            if (selectedBill) {
                updatedBills = updatedBills.map(b => b.id === selectedBill.id ? { ...b, hasRenewed: true } : b);
            } else {
                const lastIdx = updatedBills.length - 2; // -1 is nextBill, -2 is currentBill
                updatedBills[lastIdx].hasRenewed = true;
            }
        }

        setBills(updatedBills);
        setIsBillModalOpen(false);
        setSelectedBill(null);
        setIsNewBillPaid(false);
        setIsRecurring(false);
    };

    const deleteBill = (id) => {
        setBills(prevBills => {
            const billToDelete = prevBills.find(b => b.id === id);
            // If bill is not found, return previous state
            if (!billToDelete) return prevBills;

            // "Nuclear Delete" Feature:
            // Delete ALL bills that share the same Name and Profile ID.
            // This wipes history and future instances of a recurring bill series
            // to ensure all charts and metrics are cleared of this item.
            return prevBills.filter(b =>
                !(b.name === billToDelete.name && b.profileId === billToDelete.profileId)
            );
        });
    };

    const handleSaveTransaction = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const rawAmount = parseFloat(formData.get('amount'));
        const cashBackPercent = parseFloat(formData.get('cashBack') || 0);
        const discount = rawAmount * (cashBackPercent / 100);
        const finalAmount = rawAmount - discount;

        const transactionData = {
            profileId: activeProfileId,
            description: formData.get('description'),
            amount: finalAmount,
            date: formData.get('date'),
            category: formData.get('category') || 'Misc',
            cashBack: cashBackPercent > 0 ? `${cashBackPercent}%` : null,
            cashBackEarned: discount,
            note: formData.get('note') || '',
        };

        if (selectedTransaction) {
            setTransactions(transactions.map(t => t.id === selectedTransaction.id ? { ...t, ...transactionData } : t));
        } else {
            setTransactions([...transactions, { ...transactionData, id: Date.now() }]);
        }
        setIsTransactionModalOpen(false);
        setSelectedTransaction(null);
    };

    const deleteTransaction = (id) => {
        setTransactions(transactions.filter(t => t.id !== id));
    };

    const addGoal = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const initialAmount = parseFloat(formData.get('current') || 0);
        const colors = ['bg-[#2A9D8F]', 'bg-[#A8DADC]', 'bg-[#EF8354]', 'bg-[#e9c46a]', 'bg-[#264653]'];
        const newGoal = {
            id: Date.now(),
            profileId: activeProfileId,
            name: formData.get('name'),
            target: parseFloat(formData.get('target')) || 0,
            current: initialAmount,
            color: colors[Math.floor(Math.random() * colors.length)],
        };
        setSavingsGoals([...savingsGoals, newGoal]);

        if (initialAmount > 0) {
            setSavingsContributions([...savingsContributions, {
                id: Date.now() + 1,
                goalId: newGoal.id,
                profileId: activeProfileId,
                amount: initialAmount,
                date: formatDate(TODAY)
            }]);
        }

        setIsGoalModalOpen(false);
    };

    const updateGoal = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        setSavingsGoals(savingsGoals.map(g => {
            if (g.id === editingGoal.id) {
                return {
                    ...g,
                    name: formData.get('name'),
                    target: parseFloat(formData.get('target')) || 0,
                    // Note: We don't update 'current' here typically, as that's tracked via contributions, 
                    // unless we want to allow manual adjustment of the base.
                    // For now, let's allow editing the base 'current' amount if the user desires, 
                    // though it might mismatch with contributions history.
                    // Better approach: Only allow editing Target and Name.
                };
            }
            return g;
        }));

        setEditingGoal(null);
        setIsGoalModalOpen(false);
    };

    const deleteGoal = (id) => setSavingsGoals(savingsGoals.filter(g => g.id !== id));

    const contributeToGoal = (id, amount, date = formatDate(TODAY)) => {
        if (isNaN(amount) || amount <= 0) return;
        setSavingsGoals(savingsGoals.map(g => g.id === id ? { ...g, current: g.current + amount } : g));

        setSavingsContributions([...savingsContributions, {
            id: Date.now(),
            goalId: id,
            profileId: activeProfileId,
            amount: amount,
            date: date
        }]);
    };

    const openIncomeModal = (income = null) => {
        setSelectedIncome(income);
        setIsIncomeModalOpen(true);
    };

    const handleSaveIncome = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const incomeData = {
            profileId: activeProfileId,
            source: formData.get('source'),
            amount: parseFloat(formData.get('amount')),
            date: formData.get('date'),
            note: formData.get('note') || '',
        };

        if (selectedIncome) {
            setIncomeEntries(incomeEntries.map(i => i.id === selectedIncome.id ? { ...i, ...incomeData } : i));
        } else {
            setIncomeEntries([...incomeEntries, { ...incomeData, id: Date.now() }]);
        }
        setIsIncomeModalOpen(false);
        setSelectedIncome(null);
    };

    const deleteIncome = (id) => setIncomeEntries(incomeEntries.filter(i => i.id !== id));

    const createProfile = (e) => {
        e.preventDefault();
        const name = new FormData(e.target).get('profileName');
        if (!name) return;
        const newProfile = { id: Date.now().toString(), name: name };
        setProfiles([...profiles, newProfile]);
        setActiveProfileId(newProfile.id);
        e.target.reset();
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const birthday = formData.get('birthday');
        const preTaxIncome = parseFloat(formData.get('preTaxIncome'));
        const timeHorizon = formData.get('timeHorizon');
        const investmentGoal = formData.get('investmentGoal');
        const riskProfile = formData.get('riskProfile');

        setProfiles(profiles.map(p => {
            if (p.id === activeProfileId) {
                return { ...p, birthday, preTaxIncome, timeHorizon, investmentGoal, riskProfile };
            }
            return p;
        }));
        setIsEditProfileModalOpen(false);
    };

    const deleteProfile = (id) => {
        // Prevent deleting the last profile if you want at least one to exist, 
        // OR allow it and recreate default. Let's ensure at least one profile remains or reset to default.

        let newProfiles = profiles.filter(p => p.id !== id);

        // Safety: If no profiles left, create a default one
        if (newProfiles.length === 0) {
            newProfiles = [{ id: 'default', name: 'Main Profile' }];
        }

        // Cascade Delete Data
        setBills(bills.filter(b => b.profileId !== id));
        setSavingsGoals(savingsGoals.filter(g => g.profileId !== id));
        setIncomeEntries(incomeEntries.filter(i => i.profileId !== id));
        setTransactions(transactions.filter(t => t.profileId !== id));
        setSavingsContributions(savingsContributions.filter(c => c.profileId !== id));

        // Update Profiles State
        setProfiles(newProfiles);

        // If deleting the active profile, switch to the first available
        if (activeProfileId === id) {
            setActiveProfileId(newProfiles[0].id);
        }

        // Close Modal and Reset
        setProfileToDelete(null);
        setIsProfileModalOpen(false);
    };

    const handleSaveBudget = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const newBudget = {
            total: parseFloat(formData.get('total')) || 2500,
            categories: {}
        };

        ALL_CATEGORIES.forEach(cat => {
            const val = parseFloat(formData.get(`cat-${cat}`));
            if (!isNaN(val) && val > 0) {
                newBudget.categories[cat] = val;
            }
        });

        setBudgetSpecs(newBudget);
        setIsBudgetModalOpen(false);
    };

    // AI Analysis Helper Functions
    const extractCurrentPageData = () => {
        const currentProfile = profiles.find(p => p.id === activeProfileId);
        const currentMonth = TODAY.getMonth() + 1;
        const currentYear = TODAY.getFullYear();

        // Calculate totals
        const totalIncome = activeIncome.reduce((sum, i) => sum + i.amount, 0);
        const totalExpenses = [...activeBills.filter(b => b.paid), ...activeTransactions].reduce((sum, item) => sum + item.amount, 0);
        const totalSavings = activeGoals.reduce((sum, g) => sum + g.current, 0);

        // Recent transactions (last 10)
        const recentTransactions = [...activeTransactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10)
            .map(t => ({
                date: t.date,
                description: t.description,
                amount: t.amount,
                category: t.category,
                cashBack: t.cashBackEarned || 0
            }));

        // Recent bills
        const unpaidBills = activeBills.filter(b => !b.paid).map(b => ({
            name: b.name,
            amount: b.amount,
            due: b.due,
            category: b.category
        }));

        const recentlyPaidBills = activeBills.filter(b => b.paid).slice(-5).map(b => ({
            name: b.name,
            amount: b.amount,
            paidDate: b.paidDate || b.due,
            category: b.category
        }));

        return {
            viewContext: view === 'dashboard' ? 'Dashboard Overview' : view === 'budget' ? 'Bill Ledger' : view === 'income' ? 'Income Stream' : 'Growth Plan',
            profileName: currentProfileName,
            profileContext: {
                birthday: currentProfile?.birthday,
                preTaxIncome: currentProfile?.preTaxIncome,
                timeHorizon: currentProfile?.timeHorizon,
                investmentGoal: currentProfile?.investmentGoal,
                riskProfile: currentProfile?.riskProfile
            },
            currentDate: formatDate(TODAY),
            currentMonth,
            currentYear,
            summary: {
                totalIncome: totalIncome.toFixed(2),
                totalExpenses: totalExpenses.toFixed(2),
                totalSavings: totalSavings.toFixed(2),
                netSavings: (totalIncome - totalExpenses).toFixed(2),
                cashBackEarned: metrics.totalCashBack.toFixed(2)
            },
            budget: {
                monthlyLimit: budgetSpecs.total,
                currentMonthSpent: metrics.totalSpent.toFixed(2),
                utilization: ((metrics.totalSpent / budgetSpecs.total) * 100).toFixed(1) + '%',
                categoryLimits: budgetSpecs.categories
            },
            categoryBreakdown: metrics.currentMonthCategories,
            recentTransactions,
            bills: {
                unpaid: unpaidBills,
                recentlyPaid: recentlyPaidBills,
                dueSoon: metrics.dueSoonBills.map(b => ({ name: b.name, amount: b.amount, due: b.due }))
            },
            savingsGoals: activeGoals.map(g => ({
                name: g.name,
                target: g.target,
                current: g.current,
                progress: ((g.current / g.target) * 100).toFixed(1) + '%'
            })),
            income: {
                ytd: metrics.incomeYTD.toFixed(2),
                allTime: metrics.totalIncomeAllTime.toFixed(2),
                recentEntries: activeIncome.slice(-5).map(i => ({
                    source: i.source,
                    amount: i.amount,
                    date: i.date
                }))
            }
        };
    };

    const generateAnalysisPrompt = (data) => {
        return `You are a professional financial advisor analyzing personal finance data. Provide an in-depth, actionable analysis based on the following financial information.

**Profile:** ${data.profileName}
${data.profileContext?.birthday ? `**Birthday:** ${data.profileContext.birthday}` : ''}
${data.profileContext?.preTaxIncome ? `**Annual Pre-Tax Income:** $${data.profileContext.preTaxIncome.toLocaleString()}` : ''}
${data.profileContext?.timeHorizon ? `**Time Horizon:** ${data.profileContext.timeHorizon}` : ''}
${data.profileContext?.investmentGoal ? `**Investment Goal:** ${data.profileContext.investmentGoal}` : ''}
${data.profileContext?.riskProfile ? `**Risk Profile:** ${data.profileContext.riskProfile}` : ''}
**Current Date:** ${data.currentDate}
**Current View:** ${data.viewContext}

**FINANCIAL OVERVIEW:**
- Total Income (All-Time): $${data.summary.totalIncome}
- Total Expenses: $${data.summary.totalExpenses}
- Total Savings: $${data.summary.totalSavings}
- Net Savings: $${data.summary.netSavings}
- Cash Back Earned: $${data.summary.cashBackEarned}

**BUDGET STATUS:**
- Monthly Budget Limit: $${data.budget.monthlyLimit}
- Current Month Spent: $${data.budget.currentMonthSpent}
- Budget Utilization: ${data.budget.utilization}
${Object.keys(data.budget.categoryLimits).length > 0 ? `- Category Limits: ${JSON.stringify(data.budget.categoryLimits, null, 2)}` : ''}

**CATEGORY SPENDING (Current Month):**
${Object.entries(data.categoryBreakdown).map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`).join('\n')}

**RECENT TRANSACTIONS:**
${data.recentTransactions.length > 0 ? data.recentTransactions.map(t => `- ${t.date}: ${t.description} - $${t.amount} (${t.category})${t.cashBack > 0 ? ` [Cash Back: $${t.cashBack.toFixed(2)}]` : ''}`).join('\n') : 'No recent transactions'}

**BILLS STATUS:**
Unpaid Bills (${data.bills.unpaid.length}):
${data.bills.unpaid.length > 0 ? data.bills.unpaid.map(b => `- ${b.name}: $${b.amount} (Due: ${b.due})`).join('\n') : 'All bills paid!'}

Due Soon:
${data.bills.dueSoon.length > 0 ? data.bills.dueSoon.map(b => `- ${b.name}: $${b.amount} (Due: ${b.due})`).join('\n') : 'No urgent bills'}

**SAVINGS GOALS:**
${data.savingsGoals.length > 0 ? data.savingsGoals.map(g => `- ${g.name}: $${g.current}/$${g.target} (${g.progress})`).join('\n') : 'No active savings goals'}

**INCOME ANALYSIS:**
- Year to Date: $${data.income.ytd}
- All-Time Total: $${data.income.allTime}

Please provide a comprehensive financial analysis covering:

1. **Financial Health Overview** - Overall assessment of the current financial situation
2. **Spending Patterns & Insights** - Analysis of spending habits and category trends
3. **Budget Adherence & Recommendations** - How well they're sticking to budgets and suggestions
4. **Income vs Expenses Analysis** - Cash flow analysis and sustainability
5. **Savings Performance** - Progress towards goals and savings rate
6. **Category-Specific Insights** - Deep dive into high-spending categories
7. **Short-term Action Items** (next 30 days) - Specific, actionable steps
8. **Long-term Strategic Recommendations** - 3-6 month financial strategy

Be specific, actionable, and constructive. Use the actual numbers provided in your analysis. Format your response with clear sections and bullet points for readability.`;
    };

    const callGeminiAPI = async (prompt, apiKey) => {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Gemini API request failed');
        }

        const result = await response.json();
        return result.candidates[0].content.parts[0].text;
    };

    const callClaudeAPI = async (prompt, apiKey) => {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Claude API request failed');
        }

        const result = await response.json();
        return result.content[0].text;
    };

    const callOpenAIAPI = async (prompt, apiKey) => {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API request failed');
        }

        const result = await response.json();
        return result.choices[0].message.content;
    };

    const handleAnalyzeFinances_OLD = async () => {
        const apiKey = aiApiKeys[aiProvider];

        if (!apiKey) {
            setIsAISettingsOpen(true);
            return;
        }

        setIsAnalyzing(true);
        setIsAIAnalysisOpen(true);
        setAnalysisResult('');

        try {
            const data = extractCurrentPageData();
            const prompt = generateAnalysisPrompt(data);

            let analysis;
            if (aiProvider === 'gemini') {
                analysis = await callGeminiAPI(prompt, apiKey);
            } else if (aiProvider === 'claude') {
                analysis = await callClaudeAPI(prompt, apiKey);
            } else if (aiProvider === 'openai') {
                analysis = await callOpenAIAPI(prompt, apiKey);
            }

            setAnalysisResult(analysis);

            // After successful analysis, extract action items
            await extractActionItems(analysis);
        } catch (error) {
            setAnalysisResult(`Error: ${error.message}\n\nPlease check your API key and try again. You can update your API key in the settings.`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const extractActionItems = async (analysisText) => {
        const apiKey = aiApiKeys[aiProvider];
        if (!apiKey || !analysisText) return;

        setIsExtractingActions(true);

        try {
            const extractionPrompt = `You are extracting action items from a financial analysis. Read the following analysis and extract ONLY the short-term action items (next 30 days) and format them as a simple JSON array.

Analysis:
${analysisText}

Extract the action items and return them in this exact JSON format (no other text, just the JSON):
[
  {"text": "action item description", "priority": "high|medium|low", "completed": false},
  {"text": "another action item", "priority": "high|medium|low", "completed": false}
]

Focus on extracting 5-10 of the most important, actionable items from the "Short-term Action Items" or similar sections. Make each item concise (under 100 characters).`;

            let extractedText;
            if (aiProvider === 'gemini') {
                extractedText = await callGeminiAPI(extractionPrompt, apiKey);
            } else if (aiProvider === 'claude') {
                extractedText = await callClaudeAPI(extractionPrompt, apiKey);
            } else if (aiProvider === 'openai') {
                extractedText = await callOpenAIAPI(extractionPrompt, apiKey);
            }

            // Try to parse JSON from the response
            const jsonMatch = extractedText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const items = JSON.parse(jsonMatch[0]);
                // Add IDs and timestamp
                const itemsWithIds = items.map((item, idx) => ({
                    id: Date.now() + idx,
                    text: item.text,
                    priority: item.priority || 'medium',
                    completed: false,
                    createdAt: formatDate(TODAY)
                }));
                setActionItems(itemsWithIds);
            }
        } catch (error) {
            console.error('Failed to extract action items:', error);
            // Silently fail - analysis is still successful
        } finally {
            setIsExtractingActions(false);
        }
    };

    const toggleActionItem = (id) => {
        setActionItems(actionItems.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
    };

    const deleteActionItem = (id) => {
        setActionItems(actionItems.filter(item => item.id !== id));
    };

    const saveAPIKey = (provider, key) => {
        setAiApiKeys({ ...aiApiKeys, [provider]: key });
    };

    const handleAskFollowUp = async () => {
        if (!followUpQuestion.trim()) return;

        const apiKey = aiApiKeys[aiProvider];
        if (!apiKey) { setIsAISettingsOpen(true); return; }

        setIsAnalyzing(true);

        try {
            // Get fresh context from current data
            const data = extractCurrentPageData();
            const analysisPrompt = generateAnalysisPrompt(data);

            // Construct a focused follow-up prompt
            const contextPrompt = `
${analysisPrompt}

---

**PREVIOUS ANALYSIS:**
"""
${analysisResult}
"""

**USER QUESTION:**
"${followUpQuestion}"

**INSTRUCTION:**
Answer the user's question above based on the provided financial data and previous analysis.
- Be direct and concise.
- DO NOT regenerate the full analysis.
- Focus ONLY on answering the specific question.
`;

            let result = '';
            if (aiProvider === 'gemini') result = await callGeminiAPI(contextPrompt, apiKey);
            else if (aiProvider === 'claude') result = await callClaudeAPI(contextPrompt, apiKey);
            else if (aiProvider === 'openai') result = await callOpenAIAPI(contextPrompt, apiKey);

            // Add user bubble then AI bubble to the thread
            const userMsg = followUpQuestion;
            setChatMessages(prev => [
                ...prev,
                { role: 'user', content: userMsg, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                { role: 'ai', content: result, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            ]);
            // Also append to analysisResult so action-item extraction context stays intact
            const newContent = `\n\n---\n\n### ❓ ${userMsg}\n\n${result}`;
            setAnalysisResult(prev => prev + newContent);
            setFollowUpQuestion('');
            setIsFollowUpOpen(false);

        } catch (e) {
            console.error("Follow-up failed", e);
            alert(`Failed to get answer: ${e.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAnalyzeFinances = async () => {
        const apiKey = aiApiKeys[aiProvider];

        if (!apiKey) {
            setIsAISettingsOpen(true);
            return;
        }

        // If we have a previous analysis, just show it
        if (analysisResult) {
            setIsAIAnalysisOpen(true);
            return;
        }

        // Otherwise, generate new analysis
        await generateNewAnalysis();
    };

    const generateNewAnalysis = async () => {
        const apiKey = aiApiKeys[aiProvider];

        if (!apiKey) {
            setIsAISettingsOpen(true);
            return;
        }

        setIsAnalyzing(true);
        setIsAIAnalysisOpen(true);
        setAnalysisResult('');
        setChatMessages([]);

        try {
            const data = extractCurrentPageData();
            const prompt = generateAnalysisPrompt(data);

            let analysis;
            if (aiProvider === 'gemini') {
                analysis = await callGeminiAPI(prompt, apiKey);
            } else if (aiProvider === 'claude') {
                analysis = await callClaudeAPI(prompt, apiKey);
            } else if (aiProvider === 'openai') {
                analysis = await callOpenAIAPI(prompt, apiKey);
            }

            setAnalysisResult(analysis);
            setChatMessages([{ role: 'ai', content: analysis, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);

            // After successful analysis, extract action items
            await extractActionItems(analysis);
        } catch (error) {
            setAnalysisResult(`Error: ${error.message}\n\nPlease check your API key and try again. You can update your API key in the settings.`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Markdown formatter for AI analysis output
    const formatMarkdown = (text) => {
        const lines = text.split('\n');
        const formatted = [];
        let inList = false;

        lines.forEach((line, idx) => {
            // Headers (## Title)
            if (line.startsWith('## ')) {
                if (inList) { formatted.push('</ul>'); inList = false; }
                const headerText = line.substring(3);
                formatted.push(`<h3 class="text-lg font-bold text-[var(--text-heading)] mt-6 mb-3 first:mt-0">${headerText}</h3>`);
            }
            // Bold headers (### or ** at start of line)
            else if (line.startsWith('### ') || (line.startsWith('**') && line.includes('**') && line.indexOf('**') !== line.lastIndexOf('**'))) {
                if (inList) { formatted.push('</ul>'); inList = false; }
                const headerText = line.startsWith('###') ? line.substring(4) : line.replace(/\*\*/g, '');
                formatted.push(`<h4 class="text-base font-bold text-[var(--text-heading)] mt-4 mb-2">${headerText}</h4>`);
            }
            // Bullet points (- or *)
            else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                if (!inList) { formatted.push('<ul class="list-disc list-inside space-y-1.5 ml-2">'); inList = true; }
                const itemText = line.trim().substring(2).replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-[var(--text-heading)]">$1</strong>');
                formatted.push(`<li class="text-sm text-[var(--text-body)] leading-relaxed">${itemText}</li>`);
            }
            // Numbered lists
            else if (/^\d+\.\s/.test(line.trim())) {
                if (inList && formatted[formatted.length - 1].includes('<ul')) {
                    formatted.push('</ul>');
                    inList = false;
                }
                if (!inList) { formatted.push('<ol class="list-decimal list-inside space-y-1.5 ml-2">'); inList = true; }
                const itemText = line.trim().replace(/^\d+\.\s/, '').replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-[var(--text-heading)]">$1</strong>');
                formatted.push(`<li class="text-sm text-[var(--text-body)] leading-relaxed">${itemText}</li>`);
            }
            // Regular paragraphs with inline bold
            else if (line.trim()) {
                if (inList) { formatted.push(inList ? '</ul>' : '</ol>'); inList = false; }
                const formattedLine = line.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-[var(--text-heading)]">$1</strong>');
                formatted.push(`<p class="text-sm text-[var(--text-body)] leading-relaxed mb-2">${formattedLine}</p>`);
            }
            // Empty lines
            else {
                if (inList) { formatted.push('</ul>'); inList = false; }
                formatted.push('<div class="h-2"></div>');
            }
        });

        if (inList) formatted.push('</ul>');
        return formatted.join('');
    };


    // --- Views ---

    const Dashboard = () => {
        const currentYear = new Date().getFullYear();
        const [spendingIncomeYear, setSpendingIncomeYear] = useState(currentYear);
        const [sankeyYear, setSankeyYear] = useState(currentYear);

        // Click outside to close banner
        useEffect(() => {
            const handleClickOutside = (event) => {
                if (isActionBannerExpanded && !event.target.closest('.action-banner-container')) {
                    setIsActionBannerExpanded(false);
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [isActionBannerExpanded]);

        const incompleteTasks = actionItems.filter(item => !item.completed).length;
        const totalTasks = actionItems.length;

        // Greeting logic
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

        // KPI calculations
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const monthlyIncome = activeIncome
            .filter(i => { const d = new Date(i.date + 'T00:00:00'); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
            .reduce((s, i) => s + i.amount, 0);
        const monthlyExpenses = activeBills
            .filter(b => { const d = new Date(b.due + 'T00:00:00'); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
            .reduce((s, b) => s + b.amount, 0)
            + activeTransactions
                .filter(t => { const d = new Date(t.date + 'T00:00:00'); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
                .reduce((s, t) => s + t.amount, 0);
        const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) : 0;
        // Exclude retirement goal from totalSavings — that money is already in totalPortfolioValue
        const totalSavings = activeGoals
            .filter(g => !g.name?.toLowerCase().includes('retirement'))
            .reduce((s, g) => s + g.current, 0);
        const netWorth = totalPortfolioValue + totalSavings;

        return (
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                {/* Personalized Greeting */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                    <div>
                        <h2 className="text-2xl font-black text-[var(--text-heading)] tracking-tight">
                            {greeting}, {currentProfileName.split(' ')[0]} 👋
                        </h2>
                        <p className="text-sm text-[var(--text-muted)] mt-0.5">
                            Here's your financial snapshot for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    {metrics.dueSoonBills.length > 0 && (
                        <button
                            onClick={() => setIsDueSoonModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-xl text-sm font-bold hover:bg-amber-500/20 transition-all duration-200 whitespace-nowrap"
                        >
                            <Bell size={14} className="animate-pulse" />
                            {metrics.dueSoonBills.length} bill{metrics.dueSoonBills.length > 1 ? 's' : ''} due soon
                        </button>
                    )}
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'Net Worth',
                            value: `$${netWorth.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                            icon: Wallet,
                            color: 'text-[var(--primary)]',
                            bg: 'bg-[var(--primary)]/10',
                            sub: 'Portfolio + Savings'
                        },
                        {
                            label: 'Monthly Income',
                            value: `$${monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                            icon: TrendingUp,
                            color: 'text-emerald-500',
                            bg: 'bg-emerald-500/10',
                            sub: new Date().toLocaleDateString('en-US', { month: 'long' })
                        },
                        {
                            label: 'Monthly Expenses',
                            value: `$${monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                            icon: TrendingDown,
                            color: 'text-rose-400',
                            bg: 'bg-rose-500/10',
                            sub: 'Bills + Transactions'
                        },
                        {
                            label: 'Savings Rate',
                            value: `${Math.max(0, savingsRate)}%`,
                            icon: PiggyBank,
                            color: savingsRate >= 20 ? 'text-emerald-500' : savingsRate >= 10 ? 'text-amber-500' : 'text-rose-400',
                            bg: savingsRate >= 20 ? 'bg-emerald-500/10' : savingsRate >= 10 ? 'bg-amber-500/10' : 'bg-rose-500/10',
                            sub: savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'On Track' : 'Needs Attention'
                        },
                    ].map(kpi => (
                        <div key={kpi.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 hover:shadow-lg hover:border-[var(--primary)]/30 transition-all duration-300 group">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{kpi.label}</span>
                                <div className={`w-7 h-7 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                                    <kpi.icon size={14} className={kpi.color} />
                                </div>
                            </div>
                            <div className={`text-2xl font-black tracking-tight ${kpi.color}`}>{kpi.value}</div>
                            <div className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">{kpi.sub}</div>
                        </div>
                    ))}
                </div>

                {/* AI Action Items */}
                {actionItems.length > 0 ? (
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden transition-colors duration-500" style={{ boxShadow: '0 4px 24px -4px var(--shadow-color)' }}>
                        {/* Card Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                            <div className="flex items-center gap-3">
                                {/* Circular progress ring */}
                                <div className="relative w-9 h-9 shrink-0">
                                    <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" strokeWidth="3" />
                                        <circle
                                            cx="18" cy="18" r="15" fill="none"
                                            stroke="var(--primary)" strokeWidth="3"
                                            strokeDasharray={`${Math.round(((totalTasks - incompleteTasks) / Math.max(totalTasks, 1)) * 94)} 94`}
                                            strokeLinecap="round"
                                            className="transition-all duration-700"
                                        />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-[var(--text-heading)]">
                                        {totalTasks - incompleteTasks}/{totalTasks}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-[var(--text-heading)] uppercase tracking-tight flex items-center gap-2">
                                        AI Action Items
                                        {isExtractingActions && (
                                            <div className="w-3 h-3 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                        )}
                                    </h3>
                                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-medium">
                                        {incompleteTasks === 0 ? '🎉 All tasks complete!' : `${incompleteTasks} task${incompleteTasks > 1 ? 's' : ''} remaining`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActionItems([])}
                                className="text-[10px] font-bold text-[var(--text-muted)] hover:text-rose-500 transition-colors uppercase tracking-widest px-2 py-1 rounded-lg hover:bg-rose-500/10"
                            >
                                Clear all
                            </button>
                        </div>

                        {/* Task List */}
                        <div className="divide-y divide-[var(--border)]">
                            {actionItems.map((item) => {
                                const priorityStyles = {
                                    high: { bar: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-500' },
                                    medium: { bar: 'bg-amber-400', badge: 'bg-amber-400/10 text-amber-400 border-amber-400/20', dot: 'bg-amber-400' },
                                    low: { bar: 'bg-slate-500', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-500' },
                                };
                                const style = priorityStyles[item.priority] || priorityStyles.low;
                                return (
                                    <div
                                        key={item.id}
                                        className={`flex items-start gap-3 px-5 py-3.5 group hover:bg-[var(--bg-main)] transition-colors duration-150 ${item.completed ? 'opacity-50' : ''}`}
                                    >
                                        {/* Priority bar */}
                                        <div className={`w-0.5 self-stretch rounded-full shrink-0 ${style.bar} ${item.completed ? 'opacity-30' : ''}`} />

                                        {/* Checkbox */}
                                        <button
                                            onClick={() => toggleActionItem(item.id)}
                                            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-[var(--border)] hover:border-[var(--primary)]'}`}
                                        >
                                            {item.completed && (
                                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </button>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-snug ${item.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-body)]'}`}>
                                                {item.text}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${style.badge}`}>
                                                    {item.priority}
                                                </span>
                                                {item.createdAt && (
                                                    <span className="text-[9px] text-[var(--text-muted)]">{item.createdAt}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Delete */}
                                        <button
                                            onClick={() => deleteActionItem(item.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0 mt-0.5"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer CTA */}
                        <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between">
                            <span className="text-[10px] text-[var(--text-muted)]">Generated by AI · Click to check off tasks</span>
                            <button
                                onClick={handleAnalyzeFinances}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--primary)] hover:underline uppercase tracking-widest"
                            >
                                <RefreshCw size={10} />
                                Refresh
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Empty state — only show if analysis has been run before */
                    analysisResult && (
                        <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border)] rounded-2xl px-6 py-5 flex items-center justify-between transition-colors duration-500">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                    <CheckCheck size={15} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[var(--text-heading)]">No action items yet</p>
                                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Run an AI analysis to generate personalized tasks</p>
                                </div>
                            </div>
                            <button
                                onClick={handleAnalyzeFinances}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all"
                            >
                                <Sparkles size={12} />
                                Analyze
                            </button>
                        </div>
                    )
                )}

                {/* Hero: Sankey + bottom 2-col row */}
                <div className="space-y-4">
                    {/* Sankey — full width hero */}
                    <Card
                        leftAction={<span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Financial Flow Pipeline</span>}
                        action={<YearDropdown value={sankeyYear} onChange={setSankeyYear} years={availableYears} label="Financial Flow" />}
                    >
                        <FinancialFlowSankey
                            income={activeIncome}
                            bills={activeBills}
                            transactions={activeTransactions}
                            contributions={activeContributions}
                            goals={activeGoals}
                            selectedYear={sankeyYear}
                            portfolioValue={totalPortfolioValue}
                        />
                    </Card>

                    {/* Bottom row: This Month summary + Spending vs Income chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        {/* This Month — text summary card */}
                        <div className="lg:col-span-2">
                            <Card leftAction={<span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">This Month</span>}>
                                <div className="space-y-4 py-1">
                                    {[
                                        {
                                            label: 'Income',
                                            value: `$${monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                                            color: 'text-emerald-500',
                                            bg: 'bg-emerald-500/10',
                                            bar: 100,
                                            barColor: 'bg-emerald-500',
                                        },
                                        {
                                            label: 'Expenses',
                                            value: `$${monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                                            color: 'text-rose-400',
                                            bg: 'bg-rose-400/10',
                                            bar: monthlyIncome > 0 ? Math.min((monthlyExpenses / monthlyIncome) * 100, 100) : 0,
                                            barColor: 'bg-rose-400',
                                        },
                                        {
                                            label: 'Net Cash Flow',
                                            value: `${monthlyIncome - monthlyExpenses >= 0 ? '+' : ''}${(monthlyIncome - monthlyExpenses).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                                            color: monthlyIncome - monthlyExpenses >= 0 ? 'text-[var(--primary)]' : 'text-rose-400',
                                            bg: monthlyIncome - monthlyExpenses >= 0 ? 'bg-[var(--primary)]/10' : 'bg-rose-400/10',
                                            bar: null,
                                        },
                                    ].map(row => (
                                        <div key={row.label}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">{row.label}</span>
                                                <span className={`text-base font-black tracking-tight ${row.color}`}>{row.value}</span>
                                            </div>
                                            {row.bar !== null && (
                                                <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-700 ${row.barColor}`} style={{ width: `${row.bar}%` }} />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <div className="pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-3">
                                        <div className="bg-[var(--bg-main)] rounded-xl p-3">
                                            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Savings Rate</div>
                                            <div className={`text-xl font-black ${savingsRate >= 20 ? 'text-emerald-500' : savingsRate >= 10 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                {savingsRate}%
                                            </div>
                                        </div>
                                        <div className="bg-[var(--bg-main)] rounded-xl p-3">
                                            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Budget Used</div>
                                            <div className={`text-xl font-black ${metrics.spendingProgress > 90 ? 'text-rose-400' : metrics.spendingProgress > 70 ? 'text-amber-400' : 'text-emerald-500'}`}>
                                                {Math.round(metrics.spendingProgress)}%
                                            </div>
                                            <button onClick={() => setIsBudgetModalOpen(true)} className="text-[9px] text-[var(--primary)] font-bold uppercase tracking-widest flex items-center gap-0.5 mt-0.5 hover:underline">
                                                <Edit2 size={8} /> Edit limit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Spending vs Income line chart */}
                        <div className="lg:col-span-3">
                            <Card
                                leftAction={<span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Spending vs Income</span>}
                                action={
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#2A9D8F]" /><span className="text-[10px] font-bold text-slate-400 uppercase">Income</span></div>
                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#A8DADC]" /><span className="text-[10px] font-bold text-slate-400 uppercase">Saved</span></div>
                                        <YearDropdown value={spendingIncomeYear} onChange={setSpendingIncomeYear} years={availableYears} label="Spending Income" />
                                    </div>
                                }
                            >
                                <IncomeSavingsLineChart income={activeIncome} bills={activeBills} transactions={activeTransactions} selectedYear={spendingIncomeYear} />
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const BudgetTracker = () => {
        // --- State for Filters & Visibility ---
        const [isBillExpanded, setIsBillExpanded] = useState(false);
        const [isTransactionExpanded, setIsTransactionExpanded] = useState(false);
        const [showArchivedTransactions, setShowArchivedTransactions] = useState(false);
        const [showArchivedBills, setShowArchivedBills] = useState(false);
        const [selectedTransactionCategory, setSelectedTransactionCategory] = useState('All');
        const [chartView, setChartView] = useState('distribution'); // 'distribution' or 'trends'


        // --- Filtering Logic ---

        const visibleBills = useMemo(() => {
            let filtered = [...activeBills];
            if (!showArchivedBills) {
                filtered = filtered.filter(b => !b.paid);
            }
            return filtered.sort((a, b) => new Date(a.due) - new Date(b.due));
        }, [activeBills, showArchivedBills]);

        const visibleTransactions = useMemo(() => {
            let filtered = [...activeTransactions];

            if (selectedTransactionCategory !== 'All') {
                filtered = filtered.filter(t => t.category === selectedTransactionCategory);
            }

            if (!showArchivedTransactions) {
                const sevenDaysAgo = new Date(TODAY);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                filtered = filtered.filter(t => new Date(t.date + 'T00:00:00') >= sevenDaysAgo);
            }

            return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        }, [activeTransactions, showArchivedTransactions, selectedTransactionCategory]);


        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                {/* Bills Due This Week Banner */}
                {metrics.dueSoonBills.length > 0 && (
                    <button
                        onClick={() => setIsDueSoonModalOpen(true)}
                        className="w-full flex items-center gap-4 px-5 py-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left hover:bg-amber-500/15 transition-all duration-200 group"
                    >
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                            <Bell size={16} className="text-amber-500 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-amber-500">{metrics.dueSoonBills.length} bill{metrics.dueSoonBills.length > 1 ? 's' : ''} due within 7 days</div>
                            <div className="text-xs text-amber-500/70 truncate">
                                {metrics.dueSoonBills.map(b => `${b.name} ($${b.amount.toFixed(0)})`).join(' · ')}
                            </div>
                        </div>
                        <ArrowUpRight size={16} className="text-amber-500 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                )}

                <Card
                    leftAction={<span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Category Spending {chartView === 'distribution' ? 'Breakdown' : 'Trends'}</span>}
                    action={
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                onClick={() => setChartView('distribution')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartView === 'distribution' ? 'bg-white dark:bg-slate-700 text-[#2A9D8F] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Distribution
                            </button>
                            <button
                                onClick={() => setChartView('trends')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartView === 'trends' ? 'bg-white dark:bg-slate-700 text-[#2A9D8F] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Trends
                            </button>
                        </div>
                    }
                    className="mb-6"
                >
                    {chartView === 'distribution' ? (
                        <CategoryBreakdownChart bills={activeBills} transactions={activeTransactions} />
                    ) : (
                        <CategoryTrendsLineChart bills={activeBills} transactions={activeTransactions} />
                    )}
                </Card>

                {/* Bill Ledger */}
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsBillExpanded(!isBillExpanded)}
                                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400"
                            >
                                {isBillExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                            </button>
                            <h2 className="text-2xl font-bold tracking-tight transition-colors duration-500">Bill Ledger</h2>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => setShowArchivedBills(!showArchivedBills)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${showArchivedBills ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'}`}
                            >
                                <Archive size={14} />
                                {showArchivedBills ? 'Hide Paid' : 'Show Archived'}
                            </button>
                            <button onClick={() => openBillModal()} className="bg-[#2A9D8F] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#268e81] transition-all shadow-lg shadow-teal-900/20 dark:shadow-none font-medium text-sm whitespace-nowrap"><Plus size={16} /> Add Bill</button>
                        </div>
                    </div>

                    {isBillExpanded && (
                        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-slate-100 dark:border-[#30363d] overflow-hidden shadow-sm transition-all duration-500 ease-in-out">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-[#0d1117] border-b border-[#30363d] text-slate-400 text-[11px] uppercase font-bold tracking-widest transition-colors duration-500">
                                            <th className="px-6 py-4">Bill Name</th>
                                            <th className="px-6 py-4">Category</th>
                                            <th className="px-6 py-4">Due Date</th>
                                            <th className="px-6 py-4">Frequency</th>
                                            <th className="px-6 py-4 text-right">Amount</th>
                                            <th className="px-6 py-4 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-[#30363d] transition-colors duration-500">
                                        {visibleBills.length === 0 ? (
                                            <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">{activeBills.length > 0 ? "All bills for this period are paid." : `No bills added for ${currentProfileName}.`}</td></tr>
                                        ) : visibleBills.map(bill => (
                                            <tr key={bill.id} onClick={() => openBillModal(bill)} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors duration-300 cursor-pointer">
                                                <td className={`px-6 py-4 font-medium transition-colors duration-500 ${bill.paid ? 'text-slate-400 line-through decoration-slate-400' : ''}`}>
                                                    {bill.name}
                                                    {bill.paid && <span className="ml-2 text-[10px] bg-[#2A9D8F]/20 text-[#2A9D8F] px-2 py-0.5 rounded-full no-underline inline-block">Paid</span>}
                                                </td>
                                                <td className="px-6 py-4"><span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-colors duration-500">{bill.category || 'Other'}</span></td>
                                                <td className="px-6 py-4 text-slate-500 text-sm">{bill.due}</td>
                                                <td className="px-6 py-4 text-slate-500 text-xs font-medium uppercase">{bill.recurring ? bill.frequency : 'One-time'}</td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-200 transition-colors duration-500">${bill.amount.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={(e) => { e.stopPropagation(); deleteBill(bill.id); }} className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 duration-300"><Trash2 size={18} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Transaction Ledger Section */}
                <div className="space-y-3 animate-in slide-in-from-bottom-5 duration-500 delay-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsTransactionExpanded(!isTransactionExpanded)}
                                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400"
                            >
                                {isTransactionExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                            </button>
                            <h2 className="text-xl font-bold tracking-tight text-slate-700 dark:text-slate-300 transition-colors duration-500">Transaction Ledger</h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex items-center bg-slate-100 dark:bg-[#0d1117] rounded-xl px-2 border border-slate-200 dark:border-[#30363d] transition-colors duration-500">
                                <Filter size={14} className="text-slate-400 ml-1" />
                                <select
                                    id="transaction-category-filter"
                                    name="transaction-category-filter"
                                    value={selectedTransactionCategory}
                                    onChange={(e) => setSelectedTransactionCategory(e.target.value)}
                                    className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-400 py-2 pl-1 pr-6 focus:ring-0 outline-none cursor-pointer appearance-none"
                                >
                                    <option value="All">All Categories</option>
                                    {TRANSACTION_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="text-slate-400 absolute right-2 pointer-events-none" />
                            </div>
                            <button
                                onClick={() => setShowArchivedTransactions(!showArchivedTransactions)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${showArchivedTransactions ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'}`}
                            >
                                <Archive size={14} />
                                {showArchivedTransactions ? 'Hide Older' : 'Show Archived'}
                            </button>
                            <button onClick={() => setIsTransactionModalOpen(true)} className="bg-[#2A9D8F] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#268e81] transition-all shadow-lg shadow-teal-900/20 dark:shadow-none font-medium text-sm whitespace-nowrap"><Plus size={16} /> Add Transaction</button>
                        </div>
                    </div>

                    {isTransactionExpanded && (
                        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-slate-100 dark:border-[#30363d] overflow-hidden shadow-sm transition-all duration-500 ease-in-out">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-[#0d1117] border-b border-[#30363d] text-slate-400 text-[10px] uppercase font-bold tracking-widest transition-colors duration-500">
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Description</th>
                                            <th className="px-6 py-4 text-right">Amount</th>
                                            <th className="px-6 py-4 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800 transition-colors duration-500">
                                        {visibleTransactions.length === 0 ? (
                                            <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400 text-sm">No transactions found.</td></tr>
                                        ) : visibleTransactions.map(t => (
                                            <tr key={t.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors duration-300" title={t.note || undefined}>
                                                <td className="px-6 py-4 text-slate-500 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {t.date}
                                                        {t.note && (
                                                            <span className="text-amber-500" title={t.note}>
                                                                <MessageSquare size={14} />
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium transition-colors duration-500 flex items-center gap-2">
                                                    {t.description}
                                                    <span
                                                        className="text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-tighter"
                                                        style={{
                                                            backgroundColor: `${CATEGORY_COLORS[t.category] || CATEGORY_COLORS['Misc']}20`,
                                                            color: CATEGORY_COLORS[t.category] || CATEGORY_COLORS['Misc'],
                                                            borderColor: `${CATEGORY_COLORS[t.category] || CATEGORY_COLORS['Misc']}40`
                                                        }}
                                                    >
                                                        {t.category || 'Misc'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-200 transition-colors duration-500">${t.amount.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => openTransactionModal(t)} className="text-slate-300 hover:text-[#2A9D8F] transition-colors opacity-0 group-hover:opacity-100 duration-300"><Edit2 size={16} /></button>
                                                        <button onClick={() => deleteTransaction(t.id)} className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 duration-300"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    )}
                </div>
            </div>
        );
    };


    const IncomeTracker = () => {
        const currentYear = new Date().getFullYear();
        const [isIncomeExpanded, setIsIncomeExpanded] = useState(true);
        const [showArchivedIncome, setShowArchivedIncome] = useState(false);
        const [selectedIncomeSource, setSelectedIncomeSource] = useState('All');
        const [incomeYearFilter, setIncomeYearFilter] = useState(currentYear);

        const visibleIncome = useMemo(() => {
            let filtered = [...activeIncome];

            // Filter by source
            if (selectedIncomeSource !== 'All') {
                filtered = filtered.filter(i => i.source === selectedIncomeSource);
            }

            // Filter by year
            filtered = filtered.filter(i => {
                if (!i.date) return false;
                const d = new Date(i.date + 'T00:00:00');
                return d.getFullYear() === incomeYearFilter;
            });

            // Archive filter - hide entries older than 30 days unless archive is shown
            if (!showArchivedIncome) {
                const thirtyDaysAgo = new Date(TODAY);
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                filtered = filtered.filter(i => new Date(i.date + 'T00:00:00') >= thirtyDaysAgo);
            }

            return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        }, [activeIncome, showArchivedIncome, selectedIncomeSource, incomeYearFilter]);

        const ytdIncome = activeIncome
            .filter(i => i.date && new Date(i.date + 'T00:00:00').getFullYear() === incomeYearFilter)
            .reduce((s, i) => s + i.amount, 0);
        const ytdCount = activeIncome.filter(i => i.date && new Date(i.date + 'T00:00:00').getFullYear() === incomeYearFilter).length;

        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                {/* YTD Income Summary */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        {
                            label: `${incomeYearFilter} Total Income`,
                            value: `$${ytdIncome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                            sub: `${ytdCount} entries logged`,
                            color: 'text-emerald-500',
                            bg: 'bg-emerald-500/10',
                            icon: TrendingUp
                        },
                        {
                            label: 'Avg Per Entry',
                            value: ytdCount > 0 ? `$${Math.round(ytdIncome / ytdCount).toLocaleString()}` : '—',
                            sub: 'Per income event',
                            color: 'text-[var(--primary)]',
                            bg: 'bg-[var(--primary)]/10',
                            icon: DollarSign
                        },
                        {
                            label: 'Monthly Average',
                            value: `$${Math.round(ytdIncome / 12).toLocaleString()}`,
                            sub: 'Annualized monthly',
                            color: 'text-blue-400',
                            bg: 'bg-blue-500/10',
                            icon: Calendar
                        },
                    ].map(stat => (
                        <div key={stat.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 hover:shadow-lg hover:border-[var(--primary)]/30 transition-all duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{stat.label}</span>
                                <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                    <stat.icon size={14} className={stat.color} />
                                </div>
                            </div>
                            <div className={`text-2xl font-black tracking-tight ${stat.color}`}>{stat.value}</div>
                            <div className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">{stat.sub}</div>
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsIncomeExpanded(!isIncomeExpanded)}
                                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400"
                            >
                                {isIncomeExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                            </button>
                            <h2 className="text-2xl font-bold tracking-tight transition-colors duration-500">Income Log</h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            {/* Source Filter */}
                            <div className="relative flex items-center bg-slate-100 dark:bg-[#0d1117] rounded-xl px-2 border border-slate-200 dark:border-[#30363d] transition-colors duration-500">
                                <Filter size={14} className="text-slate-400 ml-1" />
                                <select
                                    id="income-source-filter"
                                    name="income-source-filter"
                                    value={selectedIncomeSource}
                                    onChange={(e) => setSelectedIncomeSource(e.target.value)}
                                    className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-400 py-2 pl-1 pr-6 focus:ring-0 outline-none cursor-pointer appearance-none"
                                >
                                    <option value="All">All Sources</option>
                                    {INCOME_SOURCES.map(source => (
                                        <option key={source} value={source}>{source}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="text-slate-400 absolute right-2 pointer-events-none" />
                            </div>

                            {/* Year Filter */}
                            <YearDropdown value={incomeYearFilter} onChange={setIncomeYearFilter} years={availableYears} label="Income Year" />

                            {/* Archive Toggle */}
                            <button
                                onClick={() => setShowArchivedIncome(!showArchivedIncome)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${showArchivedIncome ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'}`}
                            >
                                <Archive size={14} />
                                {showArchivedIncome ? 'Hide Older' : 'Show Archived'}
                            </button>

                            {/* Add Income Button */}
                            <button onClick={() => openIncomeModal()} className="bg-[#2A9D8F] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#268e81] transition-all shadow-lg shadow-teal-900/20 dark:shadow-none font-medium text-sm whitespace-nowrap"><Plus size={16} /> Add Income</button>
                        </div>
                    </div>

                    {isIncomeExpanded && (
                        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-slate-100 dark:border-[#30363d] overflow-hidden shadow-sm transition-all duration-500 ease-in-out">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-[#0d1117] border-b border-[#30363d] text-slate-400 text-[11px] uppercase font-bold tracking-widest transition-colors duration-500">
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Source</th>
                                            <th className="px-6 py-4 text-right">Amount</th>
                                            <th className="px-6 py-4 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-[#30363d] transition-colors duration-500">
                                        {visibleIncome.length === 0 ? (
                                            <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400">{activeIncome.length > 0 ? "No income entries match your filters." : `No income logged for ${currentProfileName}.`}</td></tr>
                                        ) : visibleIncome.map(income => (
                                            <tr key={income.id} onClick={() => openIncomeModal(income)} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors duration-300 cursor-pointer relative" title={income.note || undefined}>
                                                <td className="px-6 py-4 text-slate-500 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {income.date}
                                                        {income.note && (
                                                            <span className="text-amber-500" title={income.note}>
                                                                <MessageSquare size={14} />
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium transition-colors duration-500">
                                                    <span className="px-2.5 py-1 bg-[#2A9D8F]/10 text-[#2A9D8F] rounded-lg text-[10px] font-bold uppercase tracking-tight">{income.source}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-[#2A9D8F] transition-colors duration-500">+${income.amount.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={(e) => { e.stopPropagation(); openIncomeModal(income); }} className="text-slate-300 hover:text-[#2A9D8F] transition-colors opacity-0 group-hover:opacity-100 duration-300"><Edit2 size={16} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); deleteIncome(income.id); }} className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 duration-300"><Trash2 size={18} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };


    const SavingsTracker = () => {
        // Compute time-to-goal for each goal based on avg monthly contribution
        const goalEstimates = activeGoals.map(goal => {
            const remaining = Math.max(0, goal.target - goal.current);
            const goalContribs = activeContributions.filter(c => c.goalId === goal.id);
            if (goalContribs.length < 2 || remaining === 0) return { ...goal, monthsLeft: null };
            const sorted = [...goalContribs].sort((a, b) => new Date(a.date) - new Date(b.date));
            const firstDate = new Date(sorted[0].date);
            const lastDate = new Date(sorted[sorted.length - 1].date);
            const monthsSpan = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 30));
            const totalContributed = goalContribs.reduce((s, c) => s + c.amount, 0);
            const monthlyRate = totalContributed / monthsSpan;
            const monthsLeft = monthlyRate > 0 ? Math.ceil(remaining / monthlyRate) : null;
            return { ...goal, monthsLeft };
        });

        const totalSaved = activeGoals.reduce((s, g) => s + g.current, 0);
        const totalTarget = activeGoals.reduce((s, g) => s + g.target, 0);
        const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                {/* Summary KPI Row */}
                {activeGoals.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Total Saved', value: `$${totalSaved.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, sub: `${activeGoals.length} active goal${activeGoals.length > 1 ? 's' : ''}`, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10', icon: PiggyBank },
                            { label: 'Total Target', value: `$${totalTarget.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, sub: 'Combined goal amount', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Target },
                            { label: 'Overall Progress', value: `${overallPct}%`, sub: overallPct >= 75 ? 'Almost there!' : overallPct >= 50 ? 'Halfway there' : 'Keep going!', color: overallPct >= 75 ? 'text-emerald-500' : overallPct >= 50 ? 'text-amber-500' : 'text-rose-400', bg: overallPct >= 75 ? 'bg-emerald-500/10' : overallPct >= 50 ? 'bg-amber-500/10' : 'bg-rose-500/10', icon: TrendingUp },
                        ].map(stat => (
                            <div key={stat.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 hover:shadow-lg hover:border-[var(--primary)]/30 transition-all duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{stat.label}</span>
                                    <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                        <stat.icon size={14} className={stat.color} />
                                    </div>
                                </div>
                                <div className={`text-2xl font-black tracking-tight ${stat.color}`}>{stat.value}</div>
                                <div className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">{stat.sub}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold tracking-tight transition-colors duration-500">Growth Plan</h2>
                    <button onClick={() => { setEditingGoal(null); setIsGoalModalOpen(true); }} className="bg-[#2A9D8F] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-[#268e81] transition-all shadow-lg shadow-teal-900/20 dark:shadow-none font-medium"><Plus size={18} /> Create Goal</button>
                </div>

                <Card
                    leftAction={<span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Contribution Patterns</span>}
                    action={<YearDropdown value={savingsYear} onChange={setSavingsYear} years={availableYears} label="Savings Patterns" />}
                >
                    <MonthlySavingsChart contributions={activeContributions} goals={activeGoals} selectedYear={savingsYear} />
                </Card>

                {/* Moved Savings Progress Card Here */}
                <Card leftAction={<span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Overall Savings Progress</span>} className="mb-6">
                    <div className="space-y-5">
                        {activeGoals.length === 0 ? <p className="text-slate-400 text-sm text-center py-4">No goals created yet.</p> : activeGoals.map(goal => (
                            <div key={goal.id} className="space-y-2">
                                <div className="flex justify-between text-sm"><span className="font-semibold transition-colors duration-500">{goal.name}</span><span className="text-slate-500 font-medium">{goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0}%</span></div>
                                <ProgressBar progress={goal.target > 0 ? (goal.current / goal.target) * 100 : 0} color={goal.color} />
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeGoals.length === 0 ? <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 transition-all duration-500"><Target className="mx-auto text-slate-300 mb-4" size={48} /><p className="text-slate-500">No savings goals yet for {currentProfileName}. Start small!</p></div> : goalEstimates.map(goal => (
                        <Card key={goal.id} leftAction={<span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{goal.name}</span>} action={
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingGoal(goal); setIsGoalModalOpen(true); }} className="text-slate-300 hover:text-[#2A9D8F] transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => deleteGoal(goal.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                            </div>
                        }>
                            <div className="mt-2 mb-6">
                                <div className="text-3xl font-bold tracking-tight transition-colors duration-500">${goal.current.toLocaleString()}</div>
                                <div className="text-slate-400 text-sm font-medium mt-1">Target: ${goal.target.toLocaleString()}</div>
                                {goal.monthsLeft !== null && (
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <Clock size={11} className="text-[var(--primary)]" />
                                        <span className="text-[11px] font-bold text-[var(--primary)]">
                                            ~{goal.monthsLeft < 12
                                                ? `${goal.monthsLeft} month${goal.monthsLeft !== 1 ? 's' : ''}`
                                                : `${Math.round(goal.monthsLeft / 12 * 10) / 10} years`} to goal
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2"><div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest"><span>Progress</span><span>{goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0}%</span></div><ProgressBar progress={goal.target > 0 ? (goal.current / goal.target) * 100 : 0} color={goal.color} /></div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const amount = parseFloat(e.target.contribution.value);
                                const date = e.target.contributionDate.value;
                                contributeToGoal(goal.id, amount, date);
                                e.target.reset();
                            }} className="mt-6 space-y-3">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input id={`contribution-${goal.id}`} name="contribution" type="number" step="0.01" required placeholder="0.00" className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm font-medium border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-all duration-500" />
                                    </div>
                                    <button type="submit" className="px-5 py-2.5 bg-[#2A9D8F] text-white rounded-xl text-sm font-bold hover:bg-[#268e81] transition-all shadow-sm active:scale-95">Add</button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={12} className="text-slate-400" />
                                    <input
                                        name="contributionDate"
                                        type="date"
                                        defaultValue={formatDate(TODAY)}
                                        required
                                        className="bg-transparent border-none text-[10px] font-bold text-slate-400 uppercase tracking-wider p-0 focus:ring-0 cursor-pointer"
                                    />
                                </div>
                            </form>
                        </Card>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div id="app-root" className="dark min-h-screen bg-[var(--bg-main)] text-[var(--text-heading)] font-sans selection:bg-[var(--primary)] selection:text-white transition-colors duration-500 ease-in-out">
            {/* Global Toast Notifications */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <nav className="fixed bottom-0 w-full md:left-0 md:top-0 md:h-full md:w-20 lg:w-64 bg-[var(--bg-card)]/80 dark:bg-[#161b22] backdrop-blur-xl border-t md:border-t-0 md:border-r border-[var(--border)] dark:border-[#30363d] z-50 transition-all duration-500 ease-in-out">
                <div className="flex flex-row md:flex-col h-full items-center md:items-stretch py-4 lg:px-6">
                    {/* Logo + Version */}
                    <div className="hidden lg:flex items-center gap-3 mb-12 px-2 pt-4">
                        <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center text-white shadow-lg" style={{ boxShadow: '0 10px 15px -3px var(--shadow-primary)' }}><Wallet size={24} /></div>
                        <div>
                            <span className="text-xl font-bold tracking-tight block leading-none">FinTrack</span>
                            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">v2.0 · Pro</span>
                        </div>
                    </div>

                    {/* Nav Items */}
                    <div className="flex-1 flex flex-row md:flex-col justify-around md:justify-start gap-1.5 w-full px-2">
                        {[
                            { id: 'dashboard', icon: Home, label: 'Home' },
                            { id: 'budget', icon: CreditCard, label: 'Budget' },
                            { id: 'income', icon: Banknote, label: 'Income' },
                            { id: 'savings', icon: Target, label: 'Savings' },
                            { id: 'investments', icon: TrendingUp, label: 'Investments' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setView(item.id)}
                                className={`relative flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 group ${view === item.id
                                    ? 'bg-[var(--primary)] text-white shadow-lg'
                                    : 'text-[var(--text-body)] hover:text-[var(--text-heading)] hover:bg-[var(--border)]'
                                    }`}
                                style={view === item.id ? { boxShadow: '0 10px 15px -3px var(--shadow-primary)' } : {}}
                            >
                                {/* Active left-border indicator (desktop only) */}
                                {view === item.id && (
                                    <span className="hidden md:block absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/60 rounded-r-full" />
                                )}
                                <item.icon size={22} />
                                <span className="hidden lg:block font-bold text-sm tracking-wide">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Divider + Profile */}
                    <div className="px-2 md:w-full">
                        <div className="hidden lg:flex items-center gap-2 mb-2 px-1">
                            <div className="flex-1 h-px bg-[var(--border)]" />
                            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Account</span>
                            <div className="flex-1 h-px bg-[var(--border)]" />
                        </div>
                        <button
                            onClick={() => setIsProfileModalOpen(true)}
                            className="flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 text-[var(--text-body)] hover:text-[var(--text-heading)] hover:bg-[var(--border)] w-full group"
                        >
                            <div className="w-6 h-6 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] text-xs font-black shrink-0">
                                {currentProfileName.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden lg:block text-left min-w-0">
                                <div className="font-bold text-sm tracking-wide truncate">{currentProfileName}</div>
                                <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest">Switch Profile</div>
                            </div>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="md:pl-20 lg:pl-64 pb-24 md:pb-8">
                <header className="sticky top-0 bg-[var(--bg-card)]/70 dark:bg-black/70 backdrop-blur-lg z-40 border-b border-[var(--border)]/50 px-8 py-5 flex justify-between items-center transition-colors duration-500 ease-in-out">
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tighter text-[var(--text-heading)] transition-colors duration-500">
                            {view === 'dashboard' ? 'Home' : view === 'budget' ? 'Bill Ledger' : view === 'income' ? 'Income Stream' : view === 'investments' ? 'Investments' : 'Growth Plan'}
                        </h1>
                        <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                            <Clock size={9} />
                            Financial Intelligence System · Updated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Notification Bell */}
                        <button
                            onClick={() => setIsDueSoonModalOpen(true)}
                            className="relative p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-body)] hover:text-[var(--text-heading)] hover:border-[var(--primary)] transition-all duration-300"
                            title={`${metrics.dueSoonBills.length} bill(s) due soon`}
                        >
                            <Bell size={18} />
                            {metrics.dueSoonBills.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                    {metrics.dueSoonBills.length}
                                </span>
                            )}
                        </button>

                        {/* Theme Cycle Button */}
                        <button
                            onClick={() => {
                                const palettes = Object.keys(COLOR_PALETTES);
                                const currentIdx = palettes.indexOf(colorPalette);
                                const nextPalette = palettes[(currentIdx + 1) % palettes.length];
                                setColorPalette(nextPalette);
                                showToast(`Theme: ${COLOR_PALETTES[nextPalette]?.name || nextPalette}`, 'info');
                            }}
                            className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-body)] hover:text-[var(--text-heading)] hover:border-[var(--primary)] transition-all duration-300"
                            title="Cycle Theme"
                        >
                            <Palette size={18} />
                        </button>

                        {/* AI Settings */}
                        <button
                            onClick={() => setIsAISettingsOpen(true)}
                            className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-body)] hover:text-[var(--text-heading)] hover:border-[var(--primary)] transition-all duration-300"
                            title="AI Settings"
                        >
                            <Settings size={18} />
                        </button>

                        {/* AI Analysis — Chat-style bar */}
                        <button
                            onClick={handleAnalyzeFinances}
                            title="AI Financial Analysis"
                            className="group relative flex items-center gap-2.5 pl-3.5 pr-1.5 py-1.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-purple-500/50 transition-all duration-300 overflow-hidden"
                            style={{ boxShadow: '0 0 0 0 rgba(168,85,247,0)' }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 18px 2px rgba(168,85,247,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 0 0 rgba(168,85,247,0)'}
                        >
                            {/* Subtle animated gradient shimmer */}
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-500/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            {/* Sparkle icon */}
                            <Sparkles size={15} className="text-purple-400 shrink-0 relative z-10 group-hover:text-purple-300 transition-colors duration-200" />

                            {/* Placeholder text — hidden on small screens */}
                            <span className="hidden lg:block text-[13px] text-[var(--text-muted)] group-hover:text-[var(--text-body)] transition-colors duration-200 relative z-10 pr-1 whitespace-nowrap select-none">
                                Ask AI about your finances...
                            </span>

                            {/* Send button */}
                            <div className="relative z-10 w-7 h-7 rounded-xl bg-purple-600 group-hover:bg-purple-500 flex items-center justify-center transition-all duration-200 group-hover:shadow-lg group-hover:shadow-purple-500/30 shrink-0">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </div>
                        </button>
                    </div>
                </header>
                <div className="max-w-6xl mx-auto px-8 pt-10">
                    {view === 'dashboard' && <Dashboard />}
                    {view === 'budget' && <BudgetTracker />}
                    {view === 'income' && <IncomeTracker />}
                    {view === 'savings' && <SavingsTracker />}
                    {view === 'investments' && <Investments goals={activeGoals} portfolioData={portfolioData} setPortfolioData={setPortfolioData} cashBalance={cashBalance} setCashBalance={setCashBalance} profiles={profiles} activeProfileId={activeProfileId} aiProvider={aiProvider} setAiProvider={setAiProvider} aiApiKeys={aiApiKeys} setAiApiKeys={setAiApiKeys} apiKey={finnhubApiKey} setApiKey={setFinnhubApiKey} />}
                </div>
            </main>

            <Modal isOpen={isBillModalOpen} onClose={() => setIsBillModalOpen(false)} title={selectedBill ? "Edit Bill" : "New Bill"}>
                <form onSubmit={handleSaveBill} className="space-y-4">
                    <div><label htmlFor="bill-name" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bill Name</label><input id="bill-name" name="name" defaultValue={selectedBill?.name} required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500" placeholder="e.g. Netflix" /></div>
                    <div><label htmlFor="bill-category" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category</label><select id="bill-category" name="category" defaultValue={selectedBill?.category} required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none appearance-none cursor-pointer transition-colors duration-500">{BILL_CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label htmlFor="bill-amount" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Amount</label><input id="bill-amount" name="amount" type="number" step="0.01" defaultValue={selectedBill?.amount} required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500" placeholder="0.00" /></div>
                        <div><label htmlFor="bill-due" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Due Date</label><input id="bill-due" name="due" type="date" defaultValue={selectedBill?.due} required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500" /></div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-3">
                            <input type="checkbox" name="isRecurring" id="isRecurring" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="w-5 h-5 rounded-md border-slate-300 text-[#2A9D8F] focus:ring-[#2A9D8F]" />
                            <label htmlFor="isRecurring" className="text-sm font-bold text-slate-500 cursor-pointer">Recurring Bill?</label>
                        </div>
                        {isRecurring && (<div className="animate-in fade-in slide-in-from-top-1 duration-200 mb-4"><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Frequency</label><select name="frequency" defaultValue={selectedBill?.frequency || 'Monthly'} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none appearance-none cursor-pointer transition-colors duration-500">{RECURRING_FREQUENCIES.map(freq => (<option key={freq} value={freq}>{freq}</option>))}</select></div>)}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-3">
                            <input type="checkbox" name="isPaid" id="isPaid" checked={isNewBillPaid} onChange={(e) => setIsNewBillPaid(e.target.checked)} className="w-5 h-5 rounded-md border-slate-300 text-[#2A9D8F] focus:ring-[#2A9D8F]" />
                            <label htmlFor="isPaid" className="text-sm font-bold text-slate-500 cursor-pointer">Already Paid?</label>
                        </div>
                        {isNewBillPaid && (<div className="animate-in fade-in slide-in-from-top-1 duration-200"><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date Paid</label><input name="paidDate" type="date" required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500" defaultValue={selectedBill?.paidDate || formatDate(TODAY)} /></div>)}
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-[#2A9D8F] text-white rounded-xl font-bold hover:bg-[#268e81] transition-all mt-4">{selectedBill ? 'Save Changes' : 'Create Bill'}</button>
                </form>
            </Modal>

            <Modal isOpen={isGoalModalOpen} onClose={() => { setIsGoalModalOpen(false); setEditingGoal(null); }} title={editingGoal ? "Edit Savings Goal" : "New Savings Goal"}>
                <form onSubmit={editingGoal ? updateGoal : addGoal} className="space-y-4">
                    <div><label htmlFor="goal-name" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Goal Name</label><input id="goal-name" name="name" defaultValue={editingGoal?.name} required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500" placeholder="e.g. Dream House" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label htmlFor="goal-target" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target ($)</label><input id="goal-target" name="target" type="number" defaultValue={editingGoal?.target} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500" placeholder="10000" /></div>
                        <div>
                            <label htmlFor="goal-current" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{editingGoal ? 'Current (Locked)' : 'Starting ($)'}</label>
                            <input
                                id="goal-current"
                                name="current"
                                type="number"
                                defaultValue={editingGoal ? editingGoal.current : "0"}
                                disabled={!!editingGoal}
                                className={`w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500 ${editingGoal ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-[#2A9D8F] text-white rounded-xl font-bold hover:bg-[#268e81] transition-all mt-4">{editingGoal ? 'Save Changes' : 'Create Goal'}</button>
                </form>
            </Modal>

            <Modal isOpen={isIncomeModalOpen} onClose={() => { setIsIncomeModalOpen(false); setSelectedIncome(null); }} title={selectedIncome ? "Edit Income" : "Log Income"}>
                <form onSubmit={handleSaveIncome} className="space-y-4">
                    <div>
                        <label htmlFor="income-source" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Income Source</label>
                        <select id="income-source" name="source" defaultValue={selectedIncome?.source || INCOME_SOURCES[0]} required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none appearance-none cursor-pointer transition-colors duration-500">
                            {INCOME_SOURCES.map(source => (<option key={source} value={source}>{source}</option>))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="income-amount" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Amount</label>
                            <input id="income-amount" name="amount" type="number" step="0.01" defaultValue={selectedIncome?.amount || ""} required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500" placeholder="0.00" />
                        </div>
                        <div>
                            <label htmlFor="income-date" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date Received</label>
                            <input id="income-date" name="date" type="date" defaultValue={selectedIncome?.date || formatDate(TODAY)} required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="income-note" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Note <span className="text-slate-300 normal-case">(optional)</span></label>
                        <textarea id="income-note" name="note" defaultValue={selectedIncome?.note || ""} rows="2" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500 resize-none" placeholder="Add a note about this income..." />
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-[#2A9D8F] text-white rounded-xl font-bold hover:bg-[#268e81] transition-all mt-4">{selectedIncome ? 'Update Income' : 'Add Entry'}</button>
                </form>
            </Modal>


            <Modal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} title="Set Budget Limits">
                <form onSubmit={handleSaveBudget} className="space-y-6">
                    <div>
                        <label htmlFor="budget-total-limit" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Monthly Budget</label>
                        <input id="budget-total-limit" name="total" type="number" defaultValue={budgetSpecs.total || 2500} required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500 font-bold" placeholder="2500" />
                        <p className="text-[10px] text-slate-500 mt-1.5 font-medium italic">Adjust the primary progress bar's scale</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Category Limits</h4>
                            <span className="text-[10px] text-slate-400 font-medium">Set to 0 to disable bars</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar">
                            {ALL_CATEGORIES.sort().map(cat => (
                                <div key={cat} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-[#2A9D8F] transition-colors uppercase tracking-tight">{cat}</label>
                                    <div className="relative w-28">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">$</span>
                                        <input
                                            name={`cat-${cat}`}
                                            type="number"
                                            defaultValue={budgetSpecs.categories?.[cat] || 0}
                                            className="w-full bg-white dark:bg-slate-900 pl-6 pr-3 py-1.5 rounded-lg text-xs font-black outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] transition-all text-right"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-[#2A9D8F] text-white rounded-xl font-black uppercase tracking-widest hover:bg-[#268e81] transition-all shadow-lg shadow-teal-900/20 dark:shadow-none hover:translate-y-[-1px] active:translate-y-[1px]">Save All Budgets</button>
                </form>
            </Modal>
            {/* Transaction Modal */}
            <Modal isOpen={isTransactionModalOpen} onClose={() => { setIsTransactionModalOpen(false); setSelectedTransaction(null); }} title={selectedTransaction ? "Edit Transaction" : "Log Transaction"}>
                <form onSubmit={handleSaveTransaction} className="space-y-4">
                    <div><label htmlFor="trans-desc" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label><input id="trans-desc" name="description" defaultValue={selectedTransaction?.description} required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500" placeholder="e.g. DoorDash, Coffee" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="trans-amount" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Amount</label>
                            <input
                                id="trans-amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                defaultValue={selectedTransaction ? (selectedTransaction.amount + (selectedTransaction.cashBackEarned || 0)).toFixed(2) : ""}
                                required
                                className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500"
                                placeholder="0.00"
                            />
                            {selectedTransaction && <p className="text-[10px] text-slate-400 mt-1">Enter total before rewards</p>}
                        </div>
                        <div><label htmlFor="trans-date" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date</label><input id="trans-date" name="date" type="date" defaultValue={selectedTransaction?.date || formatDate(TODAY)} required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500" /></div>
                    </div>
                    <div>
                        <label htmlFor="trans-category" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                        <select id="trans-category" name="category" defaultValue={selectedTransaction?.category || 'Misc'} required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none appearance-none cursor-pointer transition-colors duration-500">
                            {TRANSACTION_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="trans-cashback" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Cash Back Rewards</label>
                        <select id="trans-cashback" name="cashBack" defaultValue={selectedTransaction?.cashBack ? parseInt(selectedTransaction.cashBack) : "0"} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none appearance-none cursor-pointer transition-colors duration-500">
                            <option value="0">None (0%)</option>
                            <option value="2">2% Cash Back</option>
                            <option value="3">3% Cash Back</option>
                            <option value="4">4% Cash Back</option>
                            <option value="5">5% Cash Back</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="trans-note" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Note <span className="text-slate-300 normal-case">(optional)</span></label>
                        <textarea id="trans-note" name="note" defaultValue={selectedTransaction?.note || ""} rows="2" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500 resize-none" placeholder="Add a note about this transaction..." />
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-[#2A9D8F] text-white rounded-xl font-bold hover:bg-[#268e81] transition-all mt-4">{selectedTransaction ? 'Update Transaction' : 'Add Transaction'}</button>
                </form>
            </Modal>


            <Modal isOpen={isDueSoonModalOpen} onClose={() => setIsDueSoonModalOpen(false)} title="Urgent Bills">
                <div className="space-y-3">
                    {metrics.dueSoonBills.length === 0 ? <p className="text-center text-slate-400 py-8">All caught up! No urgent bills.</p> : metrics.dueSoonBills.map(bill => (
                        <div key={bill.id} className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50 transition-colors duration-500">
                            <div className="flex items-center gap-3">
                                <button onClick={() => openBillModal(bill)} className="focus:outline-none transition-transform active:scale-90" title="Edit Bill"><Edit2 className="text-amber-400 hover:text-amber-500 transition-colors duration-300" size={18} /></button>
                                <div><div className="font-bold text-slate-700 dark:text-slate-200 transition-colors duration-500">{bill.name}</div><div className="text-xs text-amber-600 dark:text-amber-400 font-medium transition-colors duration-500">Due {new Date(bill.due + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' })}</div></div>
                            </div>
                            <div className="font-bold text-slate-900 dark:text-white transition-colors duration-500">${bill.amount.toFixed(2)}</div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center transition-colors duration-500"><button onClick={() => { setIsDueSoonModalOpen(false); setView('budget'); }} className="text-sm font-bold text-[#2A9D8F] dark:text-indigo-400 hover:underline">Manage All Bills in Budget Tracker &rarr;</button></div>
            </Modal>

            <Modal isOpen={isProfileModalOpen} onClose={() => { setIsProfileModalOpen(false); setProfileToDelete(null); }} title="Switch Profile">
                <div className="space-y-4">
                    {profileToDelete ? (
                        <div className="animate-in fade-in zoom-in duration-300 bg-rose-50 dark:bg-rose-900/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-center">
                            <AlertCircle className="mx-auto text-rose-500 mb-2" size={32} />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Delete Profile?</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                Are you sure you want to delete <strong>{profiles.find(p => p.id === profileToDelete)?.name}</strong>?
                                <br />All associated data (bills, transactions, goals) will be permanently removed.
                            </p>
                            <div className="flex gap-2 justify-center">
                                <button
                                    onClick={() => setProfileToDelete(null)}
                                    className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => deleteProfile(profileToDelete)}
                                    className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-lg shadow-rose-900/20"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-2">
                                {profiles.map(profile => (
                                    <div key={profile.id} className="relative group">
                                        <button
                                            onClick={() => { setActiveProfileId(profile.id); setIsProfileModalOpen(false); }}
                                            className={`w-full p-4 rounded-xl flex justify-between items-center transition-all duration-300 ${activeProfileId === profile.id ? 'bg-[#2A9D8F] text-white shadow-lg shadow-teal-900/20 dark:shadow-none ring-2 ring-[#2A9D8F] dark:ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${activeProfileId === profile.id ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                                    {profile.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-sm">{profile.name}</span>
                                            </div>
                                            {activeProfileId === profile.id && <CheckCircle2 size={18} className="text-white" />}
                                        </button>

                                        {/* Delete Action - Only show if more than 1 profile exists or just allow deleting the current one if logic handles it */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setProfileToDelete(profile.id); }}
                                            className={`absolute right-14 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all opacity-0 group-hover:opacity-100 ${activeProfileId === profile.id ? 'text-white/70 hover:text-white hover:bg-white/20' : ''}`}
                                            title="Delete Profile"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        {/* Make Default Toggle */}
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (defaultProfileId === profile.id) {
                                                    setDefaultProfileId(null);
                                                } else {
                                                    setDefaultProfileId(profile.id);
                                                }
                                            }}
                                            className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-6 rounded-full transition-colors duration-300 cursor-pointer ${defaultProfileId === profile.id
                                                ? 'bg-[#2A9D8F]'
                                                : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400 dark:group-hover:bg-slate-500'
                                                }`}
                                            title={defaultProfileId === profile.id ? "Default Profile" : "Make Default"}
                                        >
                                            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${defaultProfileId === profile.id ? 'translate-x-4' : 'translate-x-0'
                                                }`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-end px-1 py-1">
                                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                                    <div className="w-6 h-3.5 bg-[#2A9D8F] rounded-full relative"><div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full"></div></div>
                                    indicates startup profile
                                </span>
                            </div>
                            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => { setIsEditProfileModalOpen(true); setIsProfileModalOpen(false); }}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all font-bold text-sm group mb-4"
                                >
                                    <div className="flex items-center gap-2">
                                        <Banknote size={18} className="text-slate-400 group-hover:text-[#2A9D8F] transition-colors" />
                                        <span>Investment Info</span>
                                    </div>
                                    <Edit2 size={16} className="text-slate-300 group-hover:text-[#2A9D8F] transition-colors" />
                                </button>

                                <label htmlFor="new-profile-name" className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Create New Profile</label>
                                <form onSubmit={createProfile} className="flex gap-2">
                                    <div className="relative flex-1"><Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="new-profile-name" name="profileName" placeholder="Profile Name" required className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500" /></div>
                                    <button type="submit" className="px-4 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-all duration-300"><Plus size={18} /></button>
                                </form>
                            </div>

                            {/* Color Palette Section */}
                            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Color Theme</label>
                                <div className="flex flex-wrap gap-3">
                                    {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
                                        <button
                                            key={key}
                                            onClick={() => setColorPalette(key)}
                                            className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${colorPalette === key
                                                ? 'bg-slate-100 dark:bg-slate-700 ring-2 ring-[#2A9D8F] ring-offset-2 dark:ring-offset-slate-900'
                                                : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                }`}
                                            title={palette.name}
                                        >
                                            {/* Color preview circles */}
                                            <div className="flex gap-1">
                                                {palette.preview.map((color, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-5 h-5 rounded-full shadow-sm"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{palette.name}</span>
                                            {colorPalette === key && (
                                                <CheckCircle2 size={14} className="absolute -top-1 -right-1 text-[#2A9D8F] bg-white dark:bg-slate-800 rounded-full" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 italic">More themes coming soon...</p>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* Edit Profile Modal */}
            <Modal isOpen={isEditProfileModalOpen} onClose={() => setIsEditProfileModalOpen(false)} title="Edit Profile Details">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                        <label htmlFor="profile-birthday" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Birthday</label>
                        <input
                            id="profile-birthday"
                            name="birthday"
                            type="date"
                            defaultValue={profiles.find(p => p.id === activeProfileId)?.birthday || ''}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="profile-income" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Annual Pre-Tax Income</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input
                                id="profile-income"
                                name="preTaxIncome"
                                type="number"
                                step="0.01"
                                defaultValue={profiles.find(p => p.id === activeProfileId)?.preTaxIncome || ''}
                                className="w-full bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500"
                                placeholder="e.g. 75000"
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Used to calculate tax brackets and savings recommendations.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="profile-time-horizon" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Time Horizon</label>
                            <select
                                id="profile-time-horizon"
                                name="timeHorizon"
                                defaultValue={profiles.find(p => p.id === activeProfileId)?.timeHorizon || '10 Years'}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500 cursor-pointer"
                            >
                                <option value="5 Years">5 Years</option>
                                <option value="10 Years">10 Years</option>
                                <option value="30 Years">30 Years</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="profile-risk" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Risk Profile</label>
                            <select
                                id="profile-risk"
                                name="riskProfile"
                                defaultValue={profiles.find(p => p.id === activeProfileId)?.riskProfile || 'Moderate'}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500 cursor-pointer"
                            >
                                <option value="Conservative">Conservative</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Aggressive">Aggressive</option>
                                <option value="Very Aggressive">Very Aggressive</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="profile-goal" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Investment Goal</label>
                        <select
                            id="profile-goal"
                            name="investmentGoal"
                            defaultValue={profiles.find(p => p.id === activeProfileId)?.investmentGoal || 'Balanced Growth'}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500 cursor-pointer"
                        >
                            <option value="Capital Appreciation">Capital Appreciation</option>
                            <option value="Wealth Preservation">Wealth Preservation</option>
                            <option value="Income Generation">Income Generation</option>
                            <option value="Balanced Growth">Balanced Growth</option>
                        </select>
                    </div>

                    <button type="submit" className="w-full py-3.5 bg-[#2A9D8F] text-white rounded-xl font-bold hover:bg-[#268e81] transition-all mt-4">Save Profile</button>
                </form>
            </Modal>

            {/* AI Settings Modal */}
            <Modal isOpen={isAISettingsOpen} onClose={() => setIsAISettingsOpen(false)} title="AI Analysis Settings">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="ai-provider" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">AI Provider</label>
                        <select
                            id="ai-provider"
                            value={aiProvider}
                            onChange={(e) => setAiProvider(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500 cursor-pointer"
                        >
                            <option value="gemini">Google Gemini</option>
                            <option value="claude">Anthropic Claude</option>
                            <option value="openai">OpenAI ChatGPT</option>
                        </select>
                        <p className="text-[10px] text-slate-500 mt-2 italic">
                            {aiProvider === 'gemini' && 'Get your API key from: ai.google.dev'}
                            {aiProvider === 'claude' && 'Get your API key from: console.anthropic.com'}
                            {aiProvider === 'openai' && 'Get your API key from: platform.openai.com'}
                        </p>
                    </div>

                    <div>
                        <label htmlFor="api-key" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">API Key</label>
                        <input
                            id="api-key"
                            type="password"
                            value={aiApiKeys[aiProvider] || ''}
                            onChange={(e) => saveAPIKey(aiProvider, e.target.value)}
                            placeholder={`Enter your ${aiProvider === 'gemini' ? 'Gemini' : aiProvider === 'claude' ? 'Claude' : 'OpenAI'} API key`}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#2A9D8F] outline-none transition-colors duration-500 font-mono text-sm"
                        />
                        <p className="text-[10px] text-slate-500 mt-2">Your API key is stored <strong>locally on your device</strong> and is never sent to our servers.</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">How it works:</h4>
                        <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                            <li>Click "AI Analysis" to analyze your current financial data</li>
                            <li>The AI will examine your income, expenses, budgets, and savings</li>
                            <li>Receive personalized recommendations and insights</li>
                            <li>All analysis is done securely through the selected AI provider</li>
                        </ul>
                    </div>

                    <button
                        onClick={() => setIsAISettingsOpen(false)}
                        className="w-full py-3.5 bg-[#2A9D8F] text-white rounded-xl font-bold hover:bg-[#268e81] transition-all"
                    >
                        Save Settings
                    </button>
                </div>
            </Modal>

            {/* AI Analysis — Chat Panel */}
            {isAIAnalysisOpen && (
                <div className="fixed inset-0 z-[60] flex items-stretch justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsAIAnalysisOpen(false)}
                    />

                    {/* Chat Panel */}
                    <div className="relative w-full max-w-lg flex flex-col bg-[#0d1117] border-l border-[#30363d] shadow-2xl animate-in slide-in-from-right duration-300 h-full">

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                                    <Sparkles size={15} className="text-purple-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white leading-none">AI Financial Analysis</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest">
                                        {aiProvider === 'gemini' ? 'Google Gemini' : aiProvider === 'claude' ? 'Anthropic Claude' : 'OpenAI ChatGPT'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {analysisResult && (
                                    <>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(analysisResult); showToast('Analysis copied!', 'success'); }}
                                            className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
                                            title="Copy analysis"
                                        >
                                            <Copy size={15} />
                                        </button>
                                        <button
                                            onClick={generateNewAnalysis}
                                            className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
                                            title="Regenerate"
                                        >
                                            <RefreshCw size={15} />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setIsAIAnalysisOpen(false)}
                                    className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all ml-1"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Missing info banner */}
                        {(() => {
                            const currentProfile = profiles.find(p => p.id === activeProfileId);
                            const isMissingInfo = !currentProfile?.birthday || !currentProfile?.preTaxIncome;
                            if (isMissingInfo && !isAnalyzing) {
                                return (
                                    <button
                                        onClick={() => { setIsAIAnalysisOpen(false); setIsEditProfileModalOpen(true); }}
                                        className="mx-4 mt-3 flex items-center gap-3 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left hover:bg-amber-500/15 transition-all shrink-0 group"
                                    >
                                        <AlertCircle size={14} className="text-amber-400 shrink-0" />
                                        <span className="text-xs text-amber-400/80">Add <strong className="text-amber-400">Investment Info</strong> for more tailored insights</span>
                                        <ArrowUpRight size={12} className="text-amber-500 ml-auto shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </button>
                                );
                            }
                            return null;
                        })()}

                        {/* Message Thread */}
                        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 min-h-0">
                            {chatMessages.length === 0 && !isAnalyzing ? (
                                /* Empty state */
                                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                                    <div className="relative mb-5">
                                        <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-10 rounded-full scale-150" />
                                        <div className="relative w-14 h-14 rounded-2xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center">
                                            <Sparkles size={24} className="text-purple-400" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-400">Ready to analyze your finances</p>
                                    <p className="text-xs text-slate-600 mt-1.5 max-w-[220px] leading-relaxed">Ask a question below or click the send button to get a full financial analysis</p>
                                    <button
                                        onClick={generateNewAnalysis}
                                        className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-purple-900/30"
                                    >
                                        <Sparkles size={14} />
                                        Run Full Analysis
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {chatMessages.map((msg, i) =>
                                        msg.role === 'user' ? (
                                            /* User bubble — right aligned */
                                            <div key={i} className="flex justify-end">
                                                <div className="max-w-[80%]">
                                                    <div className="bg-[#2d333b] border border-[#444c56] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-slate-200 leading-relaxed">
                                                        {msg.content}
                                                    </div>
                                                    <div className="flex justify-end mt-1 mr-1">
                                                        <span className="text-[10px] text-slate-600">{msg.timestamp}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* AI bubble — left aligned */
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Sparkles size={13} className="text-purple-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl rounded-tl-sm px-5 py-4">
                                                        <div
                                                            className="prose prose-sm prose-invert max-w-none text-slate-300 leading-relaxed [&_strong]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-slate-100 [&_li]:text-slate-300 [&_ul]:pl-4 [&_ol]:pl-4"
                                                            dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-1.5 ml-1">
                                                        <span className="text-[10px] text-slate-600">
                                                            {aiProvider === 'gemini' ? 'Gemini' : aiProvider === 'claude' ? 'Claude' : 'ChatGPT'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-700">·</span>
                                                        <span className="text-[10px] text-slate-600">{msg.timestamp}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )}

                                    {/* Typing indicator — shown at the bottom of the thread while loading */}
                                    {isAnalyzing && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                                <Sparkles size={13} className="text-purple-400" />
                                            </div>
                                            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl rounded-tl-sm px-4 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2">Thinking...</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Chat Input Bar */}
                        <div className="px-4 pb-5 pt-3 border-t border-[#30363d] shrink-0">
                            <div className="relative flex items-end gap-2 bg-[#161b22] border border-[#30363d] rounded-2xl px-4 py-3 focus-within:border-purple-500/50 transition-colors">
                                <textarea
                                    value={followUpQuestion}
                                    onChange={(e) => { setFollowUpQuestion(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                                    placeholder={analysisResult ? "Ask a follow-up question..." : "Ask about your finances..."}
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-slate-600 resize-none leading-relaxed min-h-[22px] max-h-[120px] overflow-y-auto"
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (followUpQuestion.trim()) {
                                                handleAskFollowUp();
                                            } else {
                                                generateNewAnalysis();
                                            }
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => followUpQuestion.trim() ? handleAskFollowUp() : generateNewAnalysis()}
                                    disabled={isAnalyzing}
                                    className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg shadow-purple-900/30 shrink-0 self-end"
                                >
                                    {isAnalyzing
                                        ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                                    }
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-700 mt-2 text-center">Enter to send · Shift+Enter for new line</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Dividend Notification Bot UI */}
            {
                dividendAlerts.length > 0 && (
                    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 animate-in slide-in-from-right-10 duration-500">
                        {dividendAlerts.map(alert => (
                            <div key={alert.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-2xl border-l-4 border-emerald-500 flex items-start gap-4 max-w-sm relative group hover:translate-x-[-4px] transition-transform duration-200">
                                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2.5 rounded-full text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <DollarSign size={20} />
                                </div>
                                <div className="flex-1 pr-6">
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-0.5">Dividend Issued!</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        <span className="font-black text-slate-700 dark:text-slate-300">{alert.symbol}</span> paid <span className="font-black text-emerald-500">${alert.amount?.toFixed(2)}</span> per share on <span className="whitespace-nowrap opacity-75">{new Date(alert.date).toLocaleDateString()}</span>.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setDismissedDividendIds(prev => [...(prev || []), alert.id]);
                                        setDividendAlerts(prev => prev.filter(a => a.id !== alert.id));
                                    }}
                                    className="absolute top-2 right-2 text-slate-300 hover:text-slate-500 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    title="Dismiss"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )
            }
        </div >
    );
};

export default App;