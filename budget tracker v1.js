import React, { useState, useMemo } from 'react';
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
    Edit2
} from 'lucide-react';

// --- Constants ---
const BILL_CATEGORIES = [
    'Rent/Mortgage', 'Utilities', 'Groceries', 'Leisure', 'Insurance',
    'Subscription', 'Transportation', 'Health', 'Other'
];

// Color mapping for categories in the stacked chart
const CATEGORY_COLORS = {
    'Rent/Mortgage': '#6366f1',   // Indigo
    'Utilities': '#3b82f6',       // Blue
    'Groceries': '#10b981',       // Emerald
    'Leisure': '#f59e0b',         // Amber
    'Insurance': '#ef4444',       // Red
    'Subscription': '#8b5cf6',    // Violet
    'Transportation': '#ec4899',  // Pink
    'Health': '#14b8a6',          // Teal
    'Other': '#64748b'            // Slate
};

const RECURRING_FREQUENCIES = [
    'Weekly', 'Bi-weekly', 'Monthly', 'Yearly'
];

const INCOME_SOURCES = [
    'Salary', 'Freelance', 'Investment', 'Gift', 'Other'
];

// Internal System Date - Persistent Anchor
const TODAY = new Date('2025-12-18T00:00:00');

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

// --- Shared UI Components ---

const Card = ({ children, title, action, className = "" }) => (
    <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-500 ease-in-out hover:shadow-md h-full ${className}`}>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
            {action}
        </div>
        {children}
    </div>
);

const ProgressBar = ({ progress, color = "bg-indigo-600" }) => (
    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden transition-colors duration-500 ease-in-out">
        <div
            className={`h-2 rounded-full transition-all duration-700 ease-out ${color}`}
            style={{ width: `${Math.min(100, progress)}%` }}
        ></div>
    </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 transition-colors duration-500 ease-in-out">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 transition-colors duration-500">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors duration-300">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

const MoneyFlowChart = ({ income, bills }) => {
    const currentYear = TODAY.getFullYear();
    const [hoveredData, setHoveredData] = useState(null);

    const data = useMemo(() => {
        const months = Array.from({ length: 12 }, () => ({ in: 0, out: 0 }));

        const getYearMonth = (dateStr) => {
            if (!dateStr) return null;
            const parts = dateStr.split('-');
            if (parts.length !== 3) return null;
            return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) - 1 };
        };

        income.forEach(i => {
            const dateInfo = getYearMonth(i.date);
            if (dateInfo && dateInfo.year === currentYear) months[dateInfo.month].in += i.amount;
        });

        bills.forEach(b => {
            if (!b.paid) return;
            const dateStr = b.paidDate || b.due; // Fallback to due date if paidDate missing (legacy)
            const dateInfo = getYearMonth(dateStr);
            if (dateInfo && dateInfo.year === currentYear) months[dateInfo.month].out += b.amount;
        });

        return months;
    }, [income, bills, currentYear]);

    const maxIn = Math.max(...data.map(d => d.in), 100);
    const maxOut = Math.max(...data.map(d => d.out), 100);

    const height = 200;
    const overallMax = Math.max(maxIn, maxOut);
    const scale = (height / 2 - 30) / overallMax;
    const barWidth = 12;
    const gap = 30;

    return (
        <div className="w-full overflow-x-auto relative">
            <svg viewBox={`0 0 ${12 * (barWidth * 2 + gap) + 50} ${height}`} className="w-full h-48 min-w-[500px] overflow-visible">
                <line x1="0" y1={height / 2} x2="100%" y2={height / 2} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="1" />

                {data.map((month, i) => {
                    const x = i * (barWidth * 2 + gap) + 20;
                    const incomeHeight = Math.max(month.in * scale, month.in > 0 ? 4 : 0);
                    const expenseHeight = Math.max(month.out * scale, month.out > 0 ? 4 : 0);
                    const monthName = new Date(0, i).toLocaleDateString('en-US', { month: 'short' });

                    return (
                        <g key={i} className="group">
                            {month.in > 0 && (
                                <rect
                                    x={x} y={(height / 2) - incomeHeight} width={barWidth} height={incomeHeight}
                                    className="fill-emerald-500 dark:fill-emerald-500 transition-all duration-300 hover:fill-emerald-400 cursor-pointer" rx="2"
                                    onMouseEnter={() => setHoveredData({ x: x + barWidth / 2, y: (height / 2) - incomeHeight, value: month.in, label: monthName, type: 'Income' })}
                                    onMouseLeave={() => setHoveredData(null)}
                                />
                            )}
                            {month.out > 0 && (
                                <rect
                                    x={x + barWidth + 2} y={height / 2} width={barWidth} height={expenseHeight}
                                    className="fill-rose-500 dark:fill-rose-500 transition-all duration-300 hover:fill-rose-400 cursor-pointer" rx="2"
                                    onMouseEnter={() => setHoveredData({ x: x + barWidth * 1.5 + 2, y: (height / 2) + expenseHeight, value: month.out, label: monthName, type: 'Expenses' })}
                                    onMouseLeave={() => setHoveredData(null)}
                                />
                            )}
                            <text x={x + barWidth} y={height + 15} className="text-[10px] font-bold fill-slate-400 uppercase" textAnchor="middle">{monthName}</text>
                        </g>
                    );
                })}

                {hoveredData && (
                    <g transform={`translate(${hoveredData.x}, ${hoveredData.y})`} className="pointer-events-none transition-all duration-200 ease-out z-50">
                        <rect x="-60" y={hoveredData.type === 'Income' ? "-55" : "10"} width="120" height="45" rx="8" className="fill-slate-800 dark:fill-slate-100 shadow-xl opacity-95" />
                        <text x="0" y={hoveredData.type === 'Income' ? "-35" : "30"} textAnchor="middle" className="fill-slate-300 dark:fill-slate-500 text-[10px] font-bold uppercase tracking-wider">{hoveredData.label} {hoveredData.type}</text>
                        <text x="0" y={hoveredData.type === 'Income' ? "-20" : "45"} textAnchor="middle" className="fill-white dark:fill-slate-900 text-sm font-bold">${hoveredData.value.toLocaleString()}</text>
                    </g>
                )}
            </svg>
        </div>
    );
};

const CategoryBreakdownChart = ({ bills }) => {
    const currentYear = TODAY.getFullYear();
    const [hoveredData, setHoveredData] = useState(null);
    const [hiddenCategories, setHiddenCategories] = useState(new Set());

    // Toggle visibility of a category
    const toggleCategory = (cat) => {
        const next = new Set(hiddenCategories);
        if (next.has(cat)) next.delete(cat);
        else next.add(cat);
        setHiddenCategories(next);
    };

    // 1. Calculate Raw Data (Aggregated by month & category)
    const rawData = useMemo(() => {
        // Initialize 12 months with empty category maps
        const months = Array.from({ length: 12 }, () => ({ categories: {} }));

        bills.forEach(b => {
            // Only include paid bills for meaningful "Spending" analysis
            if (!b.paid) return;

            const dateStr = b.paidDate || b.due;
            const parts = dateStr.split('-');
            if (parts.length !== 3) return;
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;

            if (year === currentYear) {
                const cat = b.category || 'Other';
                months[month].categories[cat] = (months[month].categories[cat] || 0) + b.amount;
            }
        });
        return months;
    }, [bills, currentYear]);

    // 2. Derive Visible Data based on hidden state
    const visibleData = useMemo(() => {
        return rawData.map(month => {
            const categories = {};
            let total = 0;
            Object.entries(month.categories).forEach(([cat, amount]) => {
                if (!hiddenCategories.has(cat)) {
                    categories[cat] = amount;
                    total += amount;
                }
            });
            return { categories, total };
        });
    }, [rawData, hiddenCategories]);

    // Dimensions
    const height = 200;
    const barWidth = 24;
    const gap = 30;
    const maxTotal = Math.max(...visibleData.map(d => d.total), 100); // Avoid div by zero
    const scale = (height - 40) / maxTotal;

    return (
        <div className="w-full overflow-x-auto relative">
            <svg viewBox={`0 0 ${12 * (barWidth + gap) + 50} ${height}`} className="w-full h-48 min-w-[500px] overflow-visible">
                <line x1="0" y1={height - 20} x2="100%" y2={height - 20} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="1" />

                {visibleData.map((month, i) => {
                    const x = i * (barWidth + gap) + 20;
                    const monthName = new Date(0, i).toLocaleDateString('en-US', { month: 'short' });
                    let currentY = height - 20;

                    // Sort categories to stack consistently (optional but good for visuals)
                    const sortedCats = Object.entries(month.categories).sort((a, b) => b[1] - a[1]);

                    return (
                        <g key={i} className="group">
                            {sortedCats.map(([cat, amount], idx) => {
                                const barHeight = Math.max(amount * scale, 0);
                                if (barHeight === 0) return null;

                                currentY -= barHeight;
                                const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'];

                                return (
                                    <rect
                                        key={cat}
                                        x={x}
                                        y={currentY}
                                        width={barWidth}
                                        height={barHeight}
                                        fill={color}
                                        className="transition-opacity duration-200 hover:opacity-80 cursor-pointer"
                                        rx={idx === sortedCats.length - 1 ? 2 : 0} // Round top corners of top bar
                                        onMouseEnter={() => setHoveredData({ x: x + barWidth / 2, y: currentY, amount, cat, month: monthName })}
                                        onMouseLeave={() => setHoveredData(null)}
                                    />
                                );
                            })}
                            <text x={x + barWidth / 2} y={height} className="text-[10px] font-bold fill-slate-400 uppercase" textAnchor="middle">{monthName}</text>
                        </g>
                    );
                })}

                {hoveredData && (
                    <g transform={`translate(${hoveredData.x}, ${hoveredData.y})`} className="pointer-events-none transition-all duration-200 ease-out z-50">
                        <rect x="-70" y="-50" width="140" height="40" rx="8" className="fill-slate-800 dark:fill-slate-100 shadow-xl opacity-95" />
                        <text x="0" y="-25" textAnchor="middle" className="fill-white dark:fill-slate-900 text-[10px] font-bold uppercase tracking-wider">{hoveredData.month} • {hoveredData.cat}</text>
                        <text x="0" y="-12" textAnchor="middle" className="fill-white dark:fill-slate-900 text-sm font-bold">${hoveredData.amount.toLocaleString()}</text>
                    </g>
                )}
            </svg>

            {/* Dynamic Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4">
                {Object.keys(CATEGORY_COLORS).map(cat => {
                    const isHidden = hiddenCategories.has(cat);
                    return (
                        <button
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            className={`flex items-center gap-1.5 transition-all duration-300 ${isHidden ? 'opacity-40 grayscale' : 'opacity-100'}`}
                        >
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }}></div>
                            <span className={`text-[10px] text-slate-500 font-medium uppercase ${isHidden ? 'line-through' : ''}`}>{cat}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// --- Main App Component ---

const App = () => {
    const [view, setView] = useState('dashboard');
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Profile & State
    const [profiles, setProfiles] = useState([{ id: 'default', name: 'Main Profile' }]);
    const [activeProfileId, setActiveProfileId] = useState('default');
    const [bills, setBills] = useState([
        { id: 1, profileId: 'default', name: 'Monthly Rent', category: 'Rent/Mortgage', amount: 1200, due: '2025-12-01', paid: true, paidDate: '2025-12-01', recurring: true, frequency: 'Monthly', hasRenewed: true },
        // A future instance of Rent that was auto-generated (example)
        { id: 101, profileId: 'default', name: 'Monthly Rent', category: 'Rent/Mortgage', amount: 1200, due: '2026-01-01', paid: false, recurring: true, frequency: 'Monthly', hasRenewed: false },
        { id: 2, profileId: 'default', name: 'Electricity', category: 'Utilities', amount: 120, due: '2025-12-05', paid: false, recurring: false },
        { id: 3, profileId: 'default', name: 'Internet Fiber', category: 'Utilities', amount: 80, due: '2025-12-10', paid: false, recurring: true, frequency: 'Monthly', hasRenewed: false },
        { id: 4, profileId: 'default', name: 'Car Insurance', category: 'Insurance', amount: 150, due: '2025-12-20', paid: false, recurring: true, frequency: 'Monthly', hasRenewed: false },
        { id: 5, profileId: 'default', name: 'Gym Membership', category: 'Health', amount: 45, due: '2025-12-22', paid: false, recurring: true, frequency: 'Monthly', hasRenewed: false },
    ]);
    const [savingsGoals, setSavingsGoals] = useState([
        { id: 1, profileId: 'default', name: 'New Car', target: 25000, current: 8500, color: 'bg-emerald-500' },
        { id: 2, profileId: 'default', name: 'Emergency Fund', target: 10000, current: 9200, color: 'bg-blue-500' },
    ]);
    const [incomeEntries, setIncomeEntries] = useState([
        { id: 1, profileId: 'default', source: 'Salary', amount: 2500, date: '2025-12-01' },
        { id: 2, profileId: 'default', source: 'Freelance', amount: 400, date: '2025-12-10' },
        { id: 3, profileId: 'default', source: 'Salary', amount: 2500, date: '2025-12-15' },
        { id: 4, profileId: 'default', source: 'Investment', amount: 150, date: '2025-11-20' }
    ]);

    // Derived State
    const activeBills = useMemo(() => bills.filter(b => b.profileId === activeProfileId), [bills, activeProfileId]);
    const activeGoals = useMemo(() => savingsGoals.filter(g => g.profileId === activeProfileId), [savingsGoals, activeProfileId]);
    const activeIncome = useMemo(() => incomeEntries.filter(i => i.profileId === activeProfileId), [incomeEntries, activeProfileId]);
    const currentProfileName = useMemo(() => profiles.find(p => p.id === activeProfileId)?.name || 'Profile', [profiles, activeProfileId]);

    const metrics = useMemo(() => {
        const currentMonthSpending = activeBills
            .filter(b => {
                const dateToUse = b.paidDate ? new Date(b.paidDate + 'T00:00:00') : new Date(b.due + 'T00:00:00');
                return b.paid && dateToUse.getMonth() === TODAY.getMonth() && dateToUse.getFullYear() === TODAY.getFullYear();
            })
            .reduce((acc, curr) => acc + curr.amount, 0);

        const totalSavings = activeGoals.reduce((acc, curr) => acc + curr.current, 0);
        const monthlyBudget = 4000;
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

        return { totalSavings, totalSpent: currentMonthSpending, dueSoonBills, spendingProgress: (currentMonthSpending / monthlyBudget) * 100, incomeYTD };
    }, [activeBills, activeGoals, activeIncome]);

    // Local State
    const [isBillModalOpen, setIsBillModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [isDueSoonModalOpen, setIsDueSoonModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Form State
    const [isNewBillPaid, setIsNewBillPaid] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false); // New state for modal checkbox
    const [selectedBill, setSelectedBill] = useState(null);

    const openBillModal = (bill = null) => {
        setSelectedBill(bill);
        setIsNewBillPaid(bill ? bill.paid : false);
        setIsRecurring(bill ? bill.recurring : false); // Init recurring state
        setIsBillModalOpen(true);
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

    const addGoal = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const initialAmount = parseFloat(formData.get('current') || 0);
        const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];
        const newGoal = {
            id: Date.now(),
            profileId: activeProfileId,
            name: formData.get('name'),
            target: parseFloat(formData.get('target')),
            current: initialAmount,
            color: colors[Math.floor(Math.random() * colors.length)],
        };
        setSavingsGoals([...savingsGoals, newGoal]);
        setIsGoalModalOpen(false);
    };

    const deleteGoal = (id) => setSavingsGoals(savingsGoals.filter(g => g.id !== id));

    const contributeToGoal = (id, amount) => {
        if (isNaN(amount) || amount <= 0) return;
        setSavingsGoals(savingsGoals.map(g => g.id === id ? { ...g, current: Math.min(g.target, g.current + amount) } : g));
    };

    const addIncome = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        setIncomeEntries([...incomeEntries, {
            id: Date.now(),
            profileId: activeProfileId,
            source: formData.get('source'),
            amount: parseFloat(formData.get('amount')),
            date: formData.get('date'),
        }]);
        setIsIncomeModalOpen(false);
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

    // --- Views ---

    const Dashboard = () => (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 w-fit shadow-sm transition-colors duration-500 ease-in-out">
                <Calendar size={16} className="text-indigo-500" />
                <span className="text-sm font-medium">
                    Current Date: <span className="text-slate-900 dark:text-slate-100 font-bold transition-colors duration-500">{TODAY.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card title="YTD Income">
                    <div className="text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 transition-colors duration-500">${metrics.incomeYTD.toLocaleString()}</div>
                    <div className="text-slate-400 text-sm flex items-center mt-1"><ArrowUpRight size={14} className="mr-1" /> Earned in 2025</div>
                </Card>
                <Card title="Total Saved">
                    <div className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 transition-colors duration-500">${metrics.totalSavings.toLocaleString()}</div>
                    <div className="text-slate-400 text-sm flex items-center mt-1"><PiggyBank size={14} className="mr-1" /> All goals combined</div>
                </Card>
                <Card title="Monthly Spending">
                    <div className="text-3xl font-bold transition-colors duration-500">${metrics.totalSpent.toLocaleString()}</div>
                    <div className="mt-2">
                        <ProgressBar progress={metrics.spendingProgress} color="bg-rose-500" />
                        <p className="text-xs text-slate-400 mt-1">Budget: $4,000.00</p>
                    </div>
                </Card>
                <Card title="Bills Due Soon">
                    <button onClick={() => metrics.dueSoonBills.length > 0 && setIsDueSoonModalOpen(true)} className={`text-left w-full transition-opacity ${metrics.dueSoonBills.length > 0 ? 'hover:opacity-70 cursor-pointer' : 'cursor-default'}`}>
                        <div className="text-3xl font-bold text-amber-500 transition-colors duration-500">{metrics.dueSoonBills.length}</div>
                        <div className="text-slate-400 text-sm mt-1 flex items-center gap-1">{metrics.dueSoonBills.length > 0 && <AlertCircle size={14} />} Due next 7 days (Unpaid)</div>
                    </button>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card
                    title="Cash Flow Analysis (2025)"
                    action={
                        <div className="flex gap-3">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] font-bold text-slate-400 uppercase">In</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-[10px] font-bold text-slate-400 uppercase">Out</span></div>
                        </div>
                    }
                >
                    <MoneyFlowChart income={activeIncome} bills={activeBills} />
                </Card>
                {/* Replaced Savings Goals with Category Breakdown */}
                <Card title="Category Spending Breakdown (2025)">
                    <CategoryBreakdownChart bills={activeBills} />
                </Card>
            </div>
        </div>
    );

    const BudgetTracker = () => {
        // Determine which bills to show:
        // 1. All Unpaid Bills
        // 2. Paid Bills where Date Paid was within the last 7 days relative to TODAY
        const visibleBills = useMemo(() => activeBills.filter(bill => {
            if (!bill.paid) return true;
            if (!bill.paidDate) return true; // Keep purely for safety, though paid bills should have a date

            const paymentDate = new Date(bill.paidDate + 'T00:00:00');
            // Difference in time
            const diffTime = TODAY.getTime() - paymentDate.getTime();
            // Difference in days (floor to ensure partial days don't round up unexpectedly)
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            return diffDays <= 7;
        }), [activeBills]);

        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold tracking-tight transition-colors duration-500">Bill Ledger</h2>
                    <button onClick={() => openBillModal()} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none font-medium"><Plus size={18} /> Add Bill</button>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-500 ease-in-out">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[11px] uppercase font-bold tracking-widest transition-colors duration-500">
                                    <th className="px-6 py-4">Bill Name</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Due Date</th>
                                    <th className="px-6 py-4">Frequency</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 transition-colors duration-500">
                                {visibleBills.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">{activeBills.length > 0 ? "No pending or recently paid bills." : `No bills added for ${currentProfileName}.`}</td></tr>
                                ) : visibleBills.map(bill => (
                                    <tr key={bill.id} onClick={() => openBillModal(bill)} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors duration-300 cursor-pointer">
                                        <td className={`px-6 py-4 font-medium transition-colors duration-500 ${bill.paid ? 'text-slate-400 line-through decoration-slate-400' : ''}`}>
                                            {bill.name}
                                            {bill.paid && <span className="ml-2 text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full no-underline inline-block">Paid</span>}
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
            </div>
        );
    };

    const IncomeTracker = () => (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight transition-colors duration-500">Income Log</h2>
                <button onClick={() => setIsIncomeModalOpen(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none font-medium"><Plus size={18} /> Add Income</button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-500 ease-in-out">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[11px] uppercase font-bold tracking-widest transition-colors duration-500">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Source</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800 transition-colors duration-500">
                            {activeIncome.length === 0 ? <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400">No income logged for {currentProfileName}.</td></tr> : activeIncome.sort((a, b) => new Date(b.date) - new Date(a.date)).map(income => (
                                <tr key={income.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors duration-300">
                                    <td className="px-6 py-4 text-slate-500 text-sm">{income.date}</td>
                                    <td className="px-6 py-4 font-medium transition-colors duration-500">{income.source}</td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400 transition-colors duration-500">+${income.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center"><button onClick={() => deleteIncome(income.id)} className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 duration-300"><Trash2 size={18} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const SavingsTracker = () => (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight transition-colors duration-500">Savings Goals</h2>
                <button onClick={() => setIsGoalModalOpen(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none font-medium"><Plus size={18} /> Create Goal</button>
            </div>

            {/* Moved Savings Progress Card Here */}
            <Card title="Overall Savings Progress" className="mb-6">
                <div className="space-y-5">
                    {activeGoals.length === 0 ? <p className="text-slate-400 text-sm text-center py-4">No goals created yet.</p> : activeGoals.map(goal => (
                        <div key={goal.id} className="space-y-2">
                            <div className="flex justify-between text-sm"><span className="font-semibold transition-colors duration-500">{goal.name}</span><span className="text-slate-500 font-medium">{Math.round((goal.current / goal.target) * 100)}%</span></div>
                            <ProgressBar progress={(goal.current / goal.target) * 100} color={goal.color} />
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeGoals.length === 0 ? <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 transition-all duration-500"><Target className="mx-auto text-slate-300 mb-4" size={48} /><p className="text-slate-500">No savings goals yet for {currentProfileName}. Start small!</p></div> : activeGoals.map(goal => (
                    <Card key={goal.id} title={goal.name} action={<button onClick={() => deleteGoal(goal.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>}>
                        <div className="mt-2 mb-6"><div className="text-3xl font-bold tracking-tight transition-colors duration-500">${goal.current.toLocaleString()}</div><div className="text-slate-400 text-sm font-medium mt-1">Target: ${goal.target.toLocaleString()}</div></div>
                        <div className="space-y-2"><div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest"><span>Progress</span><span>{Math.round((goal.current / goal.target) * 100)}%</span></div><ProgressBar progress={(goal.current / goal.target) * 100} color={goal.color} /></div>
                        <form onSubmit={(e) => { e.preventDefault(); contributeToGoal(goal.id, parseFloat(e.target.contribution.value)); e.target.reset(); }} className="mt-6 flex gap-2">
                            <div className="relative flex-1"><DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input name="contribution" type="number" step="0.01" required placeholder="0.00" className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm font-medium border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-500" /></div>
                            <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm active:scale-95">Add</button>
                        </form>
                    </Card>
                ))}
            </div>
        </div>
    );

    return (
        <div className={isDarkMode ? 'dark' : ''}>
            <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 selection:text-indigo-700 transition-colors duration-500 ease-in-out">
                <nav className="fixed bottom-0 w-full md:left-0 md:top-0 md:h-full md:w-20 lg:w-64 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t md:border-t-0 md:border-r border-slate-200 dark:border-slate-800 z-50 transition-all duration-500 ease-in-out">
                    <div className="flex flex-row md:flex-col h-full items-center md:items-stretch py-4 lg:px-6">
                        <div className="hidden lg:flex items-center gap-3 mb-12 px-2 pt-4"><div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none"><Wallet size={24} /></div><span className="text-xl font-bold tracking-tight">FinTrack</span></div>
                        <div className="flex-1 flex flex-row md:flex-col justify-around md:justify-start gap-3 w-full px-2">
                            {[
                                { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                                { id: 'budget', icon: CreditCard, label: 'Budget' },
                                { id: 'income', icon: Banknote, label: 'Income' },
                                { id: 'savings', icon: Target, label: 'Savings' },
                            ].map((item) => (
                                <button key={item.id} onClick={() => setView(item.id)} className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 ${view === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900'}`}><item.icon size={22} /><span className="hidden lg:block font-bold text-sm tracking-wide">{item.label}</span></button>
                            ))}
                        </div>
                        <div className="px-2 md:w-full"><button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 w-full"><User size={22} /><span className="hidden lg:block font-bold text-sm tracking-wide">{currentProfileName}</span></button></div>
                    </div>
                </nav>

                <main className="md:pl-20 lg:pl-64 pb-24 md:pb-8">
                    <header className="sticky top-0 bg-slate-50/70 dark:bg-black/70 backdrop-blur-lg z-40 border-b border-slate-200/50 dark:border-slate-800/50 px-8 py-6 flex justify-between items-center transition-colors duration-500 ease-in-out">
                        <div><h1 className="text-xl font-black uppercase tracking-tighter transition-colors duration-500">{view === 'dashboard' ? 'Overview' : view === 'budget' ? 'Bill Ledger' : view === 'income' ? 'Income Stream' : 'Growth Plan'}</h1><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Financial Intelligence System</p></div>
                        <div className="flex items-center gap-4"><button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 duration-500" title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button></div>
                    </header>
                    <div className="max-w-6xl mx-auto px-8 pt-10">
                        {view === 'dashboard' && <Dashboard />}
                        {view === 'budget' && <BudgetTracker />}
                        {view === 'income' && <IncomeTracker />}
                        {view === 'savings' && <SavingsTracker />}
                    </div>
                </main>

                <Modal isOpen={isBillModalOpen} onClose={() => setIsBillModalOpen(false)} title={selectedBill ? "Edit Bill" : "New Bill"}>
                    <form onSubmit={handleSaveBill} className="space-y-4">
                        <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bill Name</label><input name="name" defaultValue={selectedBill?.name} required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors duration-500" placeholder="e.g. Netflix" /></div>
                        <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category</label><select name="category" defaultValue={selectedBill?.category} required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer transition-colors duration-500">{BILL_CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Amount</label><input name="amount" type="number" step="0.01" defaultValue={selectedBill?.amount} required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors duration-500" placeholder="0.00" /></div>
                            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Due Date</label><input name="due" type="date" defaultValue={selectedBill?.due} required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors duration-500" /></div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-3">
                                <input type="checkbox" name="isRecurring" id="isRecurring" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                <label htmlFor="isRecurring" className="text-sm font-bold text-slate-500 cursor-pointer">Recurring Bill?</label>
                            </div>
                            {isRecurring && (<div className="animate-in fade-in slide-in-from-top-1 duration-200 mb-4"><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Frequency</label><select name="frequency" defaultValue={selectedBill?.frequency || 'Monthly'} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer transition-colors duration-500">{RECURRING_FREQUENCIES.map(freq => (<option key={freq} value={freq}>{freq}</option>))}</select></div>)}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-3">
                                <input type="checkbox" name="isPaid" id="isPaid" checked={isNewBillPaid} onChange={(e) => setIsNewBillPaid(e.target.checked)} className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                <label htmlFor="isPaid" className="text-sm font-bold text-slate-500 cursor-pointer">Already Paid?</label>
                            </div>
                            {isNewBillPaid && (<div className="animate-in fade-in slide-in-from-top-1 duration-200"><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date Paid</label><input name="paidDate" type="date" required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors duration-500" defaultValue={selectedBill?.paidDate || formatDate(TODAY)} /></div>)}
                        </div>
                        <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all mt-4">{selectedBill ? 'Save Changes' : 'Create Bill'}</button>
                    </form>
                </Modal>

                <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="New Savings Goal">
                    <form onSubmit={addGoal} className="space-y-4">
                        <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Goal Name</label><input name="name" required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors duration-500" placeholder="e.g. Dream House" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target ($)</label><input name="target" type="number" required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors duration-500" placeholder="10000" /></div>
                            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Starting ($)</label><input name="current" type="number" defaultValue="0" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors duration-500" placeholder="0" /></div>
                        </div>
                        <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all mt-4">Create Goal</button>
                    </form>
                </Modal>

                <Modal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} title="Log Income">
                    <form onSubmit={addIncome} className="space-y-4">
                        <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Income Source</label><select name="source" required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer transition-colors duration-500">{INCOME_SOURCES.map(source => (<option key={source} value={source}>{source}</option>))}</select></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Amount</label><input name="amount" type="number" step="0.01" required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors duration-500" placeholder="0.00" /></div>
                            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date Received</label><input name="date" type="date" required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors duration-500" /></div>
                        </div>
                        <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all mt-4">Add Entry</button>
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
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center transition-colors duration-500"><button onClick={() => { setIsDueSoonModalOpen(false); setView('budget'); }} className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Manage All Bills in Budget Tracker &rarr;</button></div>
                </Modal>

                <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Switch Profile">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            {profiles.map(profile => (
                                <button key={profile.id} onClick={() => { setActiveProfileId(profile.id); setIsProfileModalOpen(false); }} className={`w-full p-4 rounded-xl flex justify-between items-center transition-all duration-300 ${activeProfileId === profile.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none ring-2 ring-indigo-600 dark:ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                    <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${activeProfileId === profile.id ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>{profile.name.charAt(0).toUpperCase()}</div><span className="font-bold text-sm">{profile.name}</span></div>
                                    {activeProfileId === profile.id && <CheckCircle2 size={18} className="text-white" />}
                                </button>
                            ))}
                        </div>
                        <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Create New Profile</h4>
                            <form onSubmit={createProfile} className="flex gap-2">
                                <div className="relative flex-1"><Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input name="profileName" placeholder="Profile Name" required className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500" /></div>
                                <button type="submit" className="px-4 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-all duration-300"><Plus size={18} /></button>
                            </form>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default App;