import React, { useState, useEffect, useMemo, useRef } from 'react';
import usePersistentState from './hooks/usePersistentState';
import { Plus, Trash2, RefreshCw, PieChart, TrendingUp, AlertCircle, Save, ChevronRight, ArrowLeft, History, Folder, Search, MoreHorizontal, DollarSign, Sparkles, Copy, ArrowUpRight, Settings, X, CircleHelp, BadgeInfo, Scale, Edit2, Share2, Minus } from 'lucide-react';

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
};

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#161b22] w-full max-w-md rounded-2xl border border-slate-200 dark:border-[#30363d] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 transition-all shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-[#30363d] shrink-0">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
            </div>
        </div>
    );
};

// --- Type Definitions (Mock) ---
/*
type Transaction = {
    id: string;
    date: string;
    type: 'BUY' | 'SELL';
    shares: number;
    price: number;
};
*/

const PortfolioPerformanceChart = ({ plHistory = [], benchmarkData = {}, selectedYear }) => {
    const svgRef = useRef(null);
    const [tooltip, setTooltip] = useState(null);

    // Generate 52 weeks for the selected year
    const weeks = useMemo(() => {
        const w = [];
        const d = new Date(selectedYear, 0, 1);
        while (d.getFullYear() === selectedYear) {
            w.push(new Date(d));
            d.setDate(d.getDate() + 7);
        }
        return w;
    }, [selectedYear]);

    // Map history to the 52-week skeleton
    const processSeries = (data, isBenchmark = false) => {
        if (!data) return weeks.map(d => ({ date: d.toISOString().split('T')[0], val: null }));

        const dataMap = new Map(data.map(d => [d.date, d.value]));
        const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

        let lastVal = 0;
        const now = new Date();
        const startOfYear = new Date(selectedYear, 0, 1);

        return weeks.map(weekDate => {
            const dateStr = weekDate.toISOString().split('T')[0];

            // Future check
            if (weekDate > now) {
                return { date: dateStr, val: null };
            }

            // Find closest data point <= weekDate
            let closest = null;
            const validPoints = sortedData.filter(d => new Date(d.date) <= weekDate);
            if (validPoints.length > 0) {
                closest = validPoints[validPoints.length - 1];
            }

            let val = closest ? closest.value : 0; // Default to 0 if no history yet (backfill)

            return { date: dateStr, val: val };
        });
    };

    // For benchmarks, we still normalize relative to start of year (or whenever)
    // Actually, benchmarks are raw prices. We need to normalize to % relative to Jan 1 (or first data point).
    const normalize = (series, isAlreadyPercent) => {
        let baseline = 0;
        const firstPoint = series.find(p => p.val !== null);
        if (firstPoint) baseline = firstPoint.val;

        return series.map(d => {
            if (d.val === null) return { ...d, pct: null };
            if (isAlreadyPercent) {
                return { ...d, pct: d.val };
            } else {
                if (baseline === 0) return { ...d, pct: 0 };
                return { ...d, pct: ((d.val - baseline) / baseline) * 100 };
            }
        });
    };

    const rawPortfolio = processSeries(plHistory);
    const rawSpy = processSeries((benchmarkData.spy || []).map(d => ({ date: d.date, value: d.close })));
    const rawQqq = processSeries((benchmarkData.qqq || []).map(d => ({ date: d.date, value: d.close })));

    const portfolioSeries = normalize(rawPortfolio, true);
    const spySeries = normalize(rawSpy, false);
    const qqqSeries = normalize(rawQqq, false);

    const hasBenchmarks = spySeries.some(d => d.pct !== null);
    const hasPortfolio = portfolioSeries.some(d => d.pct !== null);

    // Y-Scale domain calculation needs to handle nulls
    const allValues = [
        ...portfolioSeries.map(d => d.pct),
        ...spySeries.map(d => d.pct),
        ...qqqSeries.map(d => d.pct)
    ].filter(v => v !== null && !isNaN(v));

    let minVal = Math.min(0, ...allValues);
    let maxVal = Math.max(0, ...allValues);
    // Add padding
    const range = maxVal - minVal;
    if (range === 0) { maxVal += 5; minVal -= 5; }
    else { maxVal += range * 0.1; minVal -= range * 0.1; }

    const H = 260; // Chart Height
    const W = 1000; // SVG ViewBox width
    const PAD = { top: 20, right: 30, bottom: 30, left: 40 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    const yScale = (val) => {
        if (val === null) return 0;
        return PAD.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;
    };
    const zeroY = yScale(0);

    const xScale = (index) => {
        return PAD.left + (index / (weeks.length - 1)) * chartW;
    };

    // Path generators
    const makePath = (series) => {
        const points = series.map((d, i) => {
            if (d.pct === null) return null;
            return [xScale(i), yScale(d.pct)];
        });

        let d = '';
        let isFirst = true;
        points.forEach(p => {
            if (!p) {
                isFirst = true; // Next valid point starts new segment
            } else {
                const [x, y] = p;
                if (isFirst) {
                    d += `M ${x} ${y}`;
                    isFirst = false;
                } else {
                    d += `L ${x} ${y}`;
                }
            }
        });
        return d;
    };

    const portfolioPath = makePath(portfolioSeries);
    const spyPath = makePath(spySeries);
    const qqqPath = makePath(qqqSeries);

    // Y Ticks
    const yTicks = [];
    const tickCount = 5;
    for (let i = 0; i < tickCount; i++) {
        yTicks.push(minVal + (i * (maxVal - minVal)) / (tickCount - 1));
    }

    // X Axis Labels
    const xLabels = [];
    if (weeks.length > 0) {
        const step = Math.ceil(weeks.length / 6);
        for (let i = 0; i < weeks.length; i += step) {
            xLabels.push({
                x: xScale(i),
                label: weeks[i].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
        }
    }

    const handleMouseMove = (e) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * W;
        const relX = mouseX - PAD.left;
        const idx = Math.round((relX / chartW) * (weeks.length - 1));
        const clampedIdx = Math.max(0, Math.min(weeks.length - 1, idx));

        const date = weeks[clampedIdx];
        const cx = xScale(clampedIdx);

        const portMap = new Map(portfolioSeries.map(d => [d.date, d.pct]));
        const spyMap = new Map(spySeries.map(d => [d.date, d.pct]));
        const qqqMap = new Map(qqqSeries.map(d => [d.date, d.pct]));

        setTooltip({
            x: cx,
            date,
            portfolio: portMap.get(date.toISOString().split('T')[0]),
            spy: spyMap.get(date.toISOString().split('T')[0]),
            qqq: qqqMap.get(date.toISOString().split('T')[0]),
        });
    };

    const isEmpty = !hasPortfolio && !hasBenchmarks;

    return (
        <div className="w-full">
            {/* Legend */}
            <div className="flex items-center justify-end gap-4 mb-4">
                {hasPortfolio && (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-[#2A9D8F]"></div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">PORTFOLIO</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-blue-500"></div>
                    <span className="text-xs font-bold text-slate-500">SPY</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-purple-500"></div>
                    <span className="text-xs font-bold text-slate-500">QQQ</span>
                </div>
            </div>

            {isEmpty ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-2">
                    <TrendingUp size={28} className="opacity-30" />
                    <p className="text-sm font-semibold">No performance data yet</p>
                    <p className="text-xs text-slate-600">Add transactions and sync prices to see your portfolio performance</p>
                </div>
            ) : (
                <div className="relative" onMouseLeave={() => setTooltip(null)}>
                    <svg
                        ref={svgRef}
                        viewBox={`0 0 ${W} ${H}`}
                        className="w-full"
                        style={{ height: 260 }}
                        onMouseMove={handleMouseMove}
                    >
                        {/* Y grid lines + labels */}
                        {yTicks.map((v, i) => (
                            <g key={i}>
                                <line
                                    x1={PAD.left} y1={yScale(v)}
                                    x2={W - PAD.right} y2={yScale(v)}
                                    stroke={v === 0 ? '#475569' : '#1e293b'}
                                    strokeWidth={v === 0 ? 1 : 0.5}
                                    strokeDasharray={v === 0 ? '4 4' : '2 4'}
                                />
                                <text
                                    x={PAD.left - 6} y={yScale(v) + 4}
                                    textAnchor="end"
                                    fontSize={9}
                                    fill="#475569"
                                    fontFamily="monospace"
                                >
                                    {v >= 0 ? '+' : ''}{v.toFixed(1)}%
                                </text>
                            </g>
                        ))}

                        {/* X axis labels */}
                        {xLabels.map((l, i) => (
                            <text key={i} x={l.x} y={H - 6} textAnchor="middle" fontSize={9} fill="#475569" fontFamily="sans-serif">
                                {l.label}
                            </text>
                        ))}

                        {/* Zero line emphasis */}
                        <line x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY} stroke="#334155" strokeWidth={1} />

                        {/* SPY line */}
                        {spyPath && (
                            <path d={spyPath} fill="none" stroke="#60a5fa" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
                        )}

                        {/* QQQ line */}
                        {qqqPath && (
                            <path d={qqqPath} fill="none" stroke="#c084fc" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
                        )}

                        {/* Portfolio line (on top) */}
                        {portfolioPath && (
                            <>
                                {/* Glow effect */}
                                <path d={portfolioPath} fill="none" stroke="#2A9D8F" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={0.15} />
                                <path d={portfolioPath} fill="none" stroke="#2A9D8F" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </>
                        )}

                        {/* Hover crosshair */}
                        {tooltip && (
                            <>
                                <line
                                    x1={tooltip.x} y1={PAD.top}
                                    x2={tooltip.x} y2={H - PAD.bottom}
                                    stroke="#475569" strokeWidth={1} strokeDasharray="3 3"
                                />
                                {tooltip.portfolio !== undefined && tooltip.portfolio !== null && (
                                    <circle cx={tooltip.x} cy={yScale(tooltip.portfolio)} r={4} fill="#2A9D8F" stroke="#0d1117" strokeWidth={2} />
                                )}
                                {tooltip.spy !== undefined && tooltip.spy !== null && (
                                    <circle cx={tooltip.x} cy={yScale(tooltip.spy)} r={3.5} fill="#60a5fa" stroke="#0d1117" strokeWidth={2} />
                                )}
                                {tooltip.qqq !== undefined && tooltip.qqq !== null && (
                                    <circle cx={tooltip.x} cy={yScale(tooltip.qqq)} r={3.5} fill="#c084fc" stroke="#0d1117" strokeWidth={2} />
                                )}
                            </>
                        )}
                    </svg>

                    {/* Tooltip box */}
                    {tooltip && (
                        <div
                            className="absolute top-2 pointer-events-none bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2.5 shadow-2xl text-xs z-10"
                            style={{ left: tooltip.x > W * 0.65 ? 'auto' : `calc(${(tooltip.x / W) * 100}% + 12px)`, right: tooltip.x > W * 0.65 ? `calc(${((W - tooltip.x) / W) * 100}% + 12px)` : 'auto' }}
                        >
                            <div className="text-slate-500 font-bold mb-1.5">{tooltip.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            {tooltip.portfolio !== undefined && tooltip.portfolio !== null && (
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="w-2 h-2 rounded-full bg-[#2A9D8F] shrink-0" />
                                    <span className="text-slate-400">Portfolio</span>
                                    <span className={`ml-auto font-black ${tooltip.portfolio >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {tooltip.portfolio >= 0 ? '+' : ''}{tooltip.portfolio.toFixed(2)}%
                                    </span>
                                </div>
                            )}
                            {tooltip.spy !== undefined && tooltip.spy !== null && (
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                                    <span className="text-slate-400">SPY</span>
                                    <span className={`ml-auto font-black ${tooltip.spy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {tooltip.spy >= 0 ? '+' : ''}{tooltip.spy.toFixed(2)}%
                                    </span>
                                </div>
                            )}
                            {tooltip.qqq !== undefined && tooltip.qqq !== null && (
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                                    <span className="text-slate-400">QQQ</span>
                                    <span className={`ml-auto font-black ${tooltip.qqq >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {tooltip.qqq >= 0 ? '+' : ''}{tooltip.qqq.toFixed(2)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/*
type Node = {
    id: string;
    type: 'PIE' | 'STOCK';
    name: string; // Stock symbol or Pie name
    target: number; // Percentage
    children?: Node[]; // Only for PIE
    transactions?: Transaction[]; // Only for STOCK
    currentPrice?: number; // Fetched from API
};
*/

// --- Helper Hook for Persistence ---

// --- Recursive Utils ---
const findNode = (root, id) => {
    if (root.id === id) return root;
    if (root.children) {
        for (const child of root.children) {
            const found = findNode(child, id);
            if (found) return found;
        }
    }
    return null;
};

// Calculate value recursively
const calculateValue = (node) => {
    if (node.type === 'STOCK') {
        const totalShares = (node.transactions || []).reduce((sum, t) => {
            return t.type === 'BUY' ? sum + t.shares : sum - t.shares;
        }, 0);
        return totalShares * (node.currentPrice || 0);
    } else if (node.children) {
        return node.children.reduce((sum, child) => sum + calculateValue(child), 0);
    }
    return 0;
};

// Helper: Ensure we always work with a valid root structure (Auto-Migration)
const ensureRootStructure = (data) => {
    if (Array.isArray(data)) {
        // Migration from old array format
        return {
            id: 'root',
            type: 'PIE',
            name: 'My Portfolio',
            target: 100,
            children: data.map(h => ({
                id: h.id || crypto.randomUUID(),
                type: 'STOCK',
                name: h.symbol,
                target: h.target,
                currentPrice: h.price || 0,
                transactions: [
                    {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString().split('T')[0],
                        type: 'BUY',
                        shares: h.shares,
                        price: h.price || 0
                    }
                ]
            }))
        };
    }
    // If it's already an object but missing something, fallback
    if (!data || !data.type) {
        return {
            id: 'root',
            type: 'PIE',
            name: 'My Portfolio',
            target: 100,
            children: []
        };
    }
    return data;
};


const Investments = ({ goals = [], portfolioData, setPortfolioData, cashBalance, setCashBalance, profiles = [], activeProfileId = 'default', aiProvider, setAiProvider, aiApiKeys, setAiApiKeys, apiKey, setApiKey }) => {
    // --- State ---
    // const [rawData, setRawData] = usePersistentState('investments_portfolio_v2', null); // Lifted to App.jsx
    const rawData = portfolioData;
    const setRawData = setPortfolioData;

    // Memoize the root to handle migration only once or when rawData truly changes
    const rootNode = useMemo(() => ensureRootStructure(rawData), [rawData]);

    // Force update wrapper for rawData to simplify tree updates
    const updateRoot = (newRoot) => {
        setRawData(newRoot);
    };

    const [path, setPath] = useState(['root']); // Stack of IDs, starting with root
    // const [apiKey, setApiKey] = usePersistentState('finnhub_api_key', ''); // Lifted to App.jsx
    // Cash Balance passed from props
    // const [cashBalance, setCashBalance] = usePersistentState('investments_cash', 1500.00);

    // Modals
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeModal, setActiveModal] = useState(null); // 'ADD_ITEM', 'TRANSACTIONS', 'EDIT_PIE'
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [hoveredSlice, setHoveredSlice] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Gain/Loss History State
    // Gain/Loss History State (Now ROI %)
    const [roiHistory, setRoiHistory] = usePersistentState('investments_roi_history_v1', []);

    // Benchmark state
    const [benchmarkData, setBenchmarkData] = useState({ spy: [], qqq: [] });
    const [isFetchingBenchmarks, setIsFetchingBenchmarks] = useState(false);
    const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // --- Derived State ---
    const currentNode = useMemo(() => {
        // Find the node corresponding to the last ID in the path
        // We always start search from rootNode
        let found = rootNode;
        // If the path is just root, we are at root.
        // If path is ['root', 'child_id'], we find 'child_id' inside root.
        const currentId = path[path.length - 1];
        if (rootNode.id === currentId) return rootNode;

        return findNode(rootNode, currentId) || rootNode;
    }, [rootNode, path]);

    // Available years for history
    const availableYears = useMemo(() => {
        const years = new Set([new Date().getFullYear()]);
        const traverse = (node) => {
            if (node.transactions) {
                node.transactions.forEach(t => years.add(new Date(t.date).getFullYear()));
            }
            if (node.children) node.children.forEach(traverse);
        };
        traverse(rootNode);
        return [...years].sort((a, b) => b - a);
    }, [rootNode]);

    const totalPortfolioValue = useMemo(() => calculateValue(rootNode) + (cashBalance || 0), [rootNode, cashBalance]);
    const currentViewValue = useMemo(() => calculateValue(currentNode), [currentNode]);

    // Enhanced Children with calculated metrics for the current view
    const childrenWithMetrics = useMemo(() => {
        if (!currentNode.children) return [];

        return currentNode.children.map(child => {
            const val = calculateValue(child);
            const totalForView = (currentNode.id === 'root') ? totalPortfolioValue : currentViewValue;
            const actualPercent = totalForView > 0 ? (val / totalForView) * 100 : 0;

            // For stocks, get basic stats
            let shares = 0;
            let avgCost = 0;
            if (child.type === 'STOCK') {
                const txs = child.transactions || [];
                shares = txs.reduce((acc, t) => t.type === 'BUY' ? acc + t.shares : acc - t.shares, 0);
                const totalCost = txs.reduce((acc, t) => t.type === 'BUY' ? acc + (t.shares * t.price) : acc - (t.shares * t.price), 0); // Simplified avg cost
                avgCost = shares > 0 ? totalCost / shares : 0;
            }

            return {
                ...child,
                value: val,
                actualPercent: actualPercent,
                drift: actualPercent - child.target,
                shares,
                avgCost
            };
        }).sort((a, b) => b.target - a.target);
    }, [currentNode, currentViewValue]);

    const totalViewTarget = childrenWithMetrics.reduce((sum, c) => sum + c.target, 0);

    // Calculate accurate Cost Basis from transactions (not Goals)
    const totalCostBasis = useMemo(() => {
        let cost = 0;
        const traverse = (node) => {
            if (node.type === 'STOCK') {
                const txs = node.transactions || [];
                let shares = 0;
                let cb = 0;
                // Sort by date to ensure proper FIFO/AvgCost handling if needed, 
                // though simple addition works for total cost if we just track net investment.
                // Strictly: Cost Basis = Sum(Buy * Price) - Sum(Sell * AvgCost)
                // But for pure "Net Invested Capital" (Cash Flow), it's Buys - Sells.
                // However, tax lots are complex. Let's stick to the Avg Cost logic used elsewhere.
                const sortedTxs = [...txs].sort((a, b) => new Date(a.date) - new Date(b.date));

                sortedTxs.forEach(t => {
                    if (t.type === 'BUY') {
                        shares += t.shares;
                        cb += t.shares * t.price;
                    } else if (t.type === 'SELL') {
                        if (shares > 0) {
                            const avg = cb / shares;
                            cb -= t.shares * avg;
                            shares -= t.shares;
                        }
                    }
                });
                cost += cb;
            }
            if (node.children) node.children.forEach(traverse);
        };
        traverse(rootNode);
        return cost;
    }, [rootNode]);

    // Calculate Profit/Loss based on Actual Cost Basis
    const { profitLoss, roi, investedAmount } = useMemo(() => {
        const invested = totalCostBasis;
        const pl = totalPortfolioValue - invested;
        const roiVal = invested > 0 ? (pl / invested) * 100 : 0;

        return { profitLoss: pl, roi: roiVal, investedAmount: invested };
    }, [totalCostBasis, totalPortfolioValue]);

    // Track History Effect (ROI %)
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setRoiHistory(prev => {
            let history = Array.isArray(prev) ? [...prev] : [];
            const startDate = '2026-01-05'; // First round of buying

            // Seed start date if missing and history is empty or starts after
            if (history.length === 0 || history[0].date > startDate) {
                history.unshift({ date: startDate, value: 0 });
            }

            // Check if we have an entry for today
            const lastEntryIndex = history.findIndex(h => h.date === today);

            // value is now ROI %, not $ P&L
            if (lastEntryIndex !== -1) {
                // Update today's entry
                if (history[lastEntryIndex].value !== roi) {
                    history[lastEntryIndex] = { ...history[lastEntryIndex], value: roi };
                }
            } else {
                // Add new entry for today
                history.push({ date: today, value: roi });
            }

            // Ensure sorted by date
            history.sort((a, b) => new Date(a.date) - new Date(b.date));

            return history;
        });
    }, [roi, setRoiHistory]);

    // --- AI Analysis Logic ---
    const [isAIAnalysisOpen, setIsAIAnalysisOpen] = useState(false);
    const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
    // AI Provider and Keys passed as props
    const [analysisResult, setAnalysisResult] = usePersistentState('ai_inv_analysis_result', '');
    const [chatMessages, setChatMessages] = useState([]); // Chat history
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Follow-up State
    const [followUpQuestion, setFollowUpQuestion] = useState('');

    // --- Chart Logic ---
    // (chartRange and benchmarkData already defined above)

    // Profile Context for Header
    const currentProfile = profiles.find(p => p.id === activeProfileId) || { name: 'My Portfolio' };

    // Calculate Today's Change Logic
    let totalDayChange = 0;
    let totalDayChangePct = 0;
    if (roiHistory.length >= 2) {
        const todayROI = roiHistory[roiHistory.length - 1].value / 100;
        const yesterdayROI = roiHistory[roiHistory.length - 2].value / 100;
        // Approx calculation assuming constant capital for the day
        totalDayChangePct = ((1 + todayROI) - (1 + yesterdayROI)) / (1 + yesterdayROI) * 100;
        totalDayChange = investedAmount * (1 + yesterdayROI) * (totalDayChangePct / 100);
    }



    const calculateAge = (birthday) => {
        if (!birthday) return 'Not specified';
        const birthDate = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const generateInvestmentAnalysisPrompt = () => {
        const currentProfile = profiles.find(p => p.id === activeProfileId) || { name: 'Investor' };
        const age = calculateAge(currentProfile.birthday);

        // Helper to flatten portfolio
        const flattenPortfolio = (node) => {
            let items = [];
            if (node.type === 'STOCK') {
                const val = calculateValue(node);
                if (val > 0) items.push({ name: node.name, value: val });
            } else if (node.children) {
                node.children.forEach(child => {
                    items = items.concat(flattenPortfolio(child));
                });
            }
            return items;
        };

        const holdings = flattenPortfolio(rootNode);
        const totalValue = totalPortfolioValue;

        const holdingsText = holdings.map(h => {
            // Avoid NaN/Infinity if totalValue is 0
            const weight = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
            return `- ${h.name}: $${h.value.toLocaleString()} (${weight.toFixed(2)}%)`;
        }).join('\n');

        const prompt = `You are an expert financial advisor specializing in investment portfolio analysis. Analyze the following portfolio for a client.

STOP AND READ: Use ONLY the values provided below. Do not assume, hallucinate, or estimate any financial figures.
The "Total Value" listed below is the ABSOLUTE TRUTH. If it says $300, the client has $300.

**Client Profile:**
- Name: ${currentProfile.name}
- Age: ${age} (Birthday: ${currentProfile.birthday || 'Not specified'})
- Risk Profile: ${currentProfile.riskProfile || 'Moderate'}
- Time Horizon: ${currentProfile.timeHorizon || '10+ Years'}
- Investment Goal: ${currentProfile.investmentGoal || 'Growth'}
- Current Date: ${new Date().toLocaleDateString()}

**Portfolio Overview:**
- Total Value: $${totalValue.toLocaleString()}
- Cash Balance: $${(cashBalance || 0).toLocaleString()} (${totalValue > 0 ? ((cashBalance || 0) / totalValue * 100).toFixed(2) : '0.00'}%)

**Holdings:**
${holdingsText || 'No stock holdings currently.'}

**Request:**
Provide a comprehensive, expert-level analysis of this portfolio. Focus on:
1. **Asset Allocation & Diversification:** Is the portfolio well-balanced given the risk profile?
2. **Stock Weighting:** Are any single positions too heavy or too light?
3. **Strategic Recommendations:** specific actions to improve the portfolio based on their goal.
4. **Risk Assessment:** Identify potential downsides.

Be critical, specific, and data-driven. Reference the EXACT numbers provided above.`;


        return prompt;
    };



    const callGeminiAPI = async (prompt, key) => {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Gemini API failed');
        }
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    };

    const callClaudeAPI = async (prompt, key) => {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
            body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 4096, messages: [{ role: 'user', content: prompt }] })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Claude API failed');
        }
        const data = await response.json();
        return data.content[0].text;
    };

    const callOpenAIAPI = async (prompt, key) => {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'gpt-4', messages: [{ role: 'user', content: prompt }], max_tokens: 4096 })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API failed');
        }
        const data = await response.json();
        return data.choices[0].message.content;
    };

    const handleAnalyzeInvestments = async () => {
        const key = aiApiKeys[aiProvider];
        if (!key) { setIsAISettingsOpen(true); return; }

        setIsAnalyzing(true);
        setIsAIAnalysisOpen(true);
        // Clear previous chat if starting fresh? Or keep history?
        // App.jsx clears.
        setChatMessages([]);
        setAnalysisResult('');

        try {
            const prompt = generateInvestmentAnalysisPrompt();
            let result = '';
            if (aiProvider === 'gemini') result = await callGeminiAPI(prompt, key);
            else if (aiProvider === 'claude') result = await callClaudeAPI(prompt, key);
            else if (aiProvider === 'openai') result = await callOpenAIAPI(prompt, key);

            setAnalysisResult(result);
            setChatMessages([{ role: 'assistant', content: result, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        } catch (err) {
            console.error(err);
            setChatMessages([{ role: 'assistant', content: `**Error:** ${err.message}`, timestamp: new Date().toLocaleTimeString() }]);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAskFollowUp = async () => {
        if (!followUpQuestion.trim()) return;

        const key = aiApiKeys[aiProvider];
        if (!key) { setIsAISettingsOpen(true); return; }

        setIsAnalyzing(true);
        // Add user message
        const userMsg = { role: 'user', content: followUpQuestion, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setChatMessages(prev => [...prev, userMsg]);
        setFollowUpQuestion('');

        try {
            // Get fresh context from current data
            const portfolioPrompt = generateInvestmentAnalysisPrompt();

            // Construct a focused follow-up prompt
            const contextPrompt = `
${portfolioPrompt}

---

**PREVIOUS ANALYSIS:**
"""
${analysisResult}
"""

**USER QUESTION:**
"${userMsg.content}"

**INSTRUCTION:**
Answer the user's question above based on the provided portfolio data and previous analysis.
- Be direct and concise.
- DO NOT regenerate the full analysis.
- Focus ONLY on answering the specific question.
`;

            let result = '';
            if (aiProvider === 'gemini') result = await callGeminiAPI(contextPrompt, key);
            else if (aiProvider === 'claude') result = await callClaudeAPI(contextPrompt, key);
            else if (aiProvider === 'openai') result = await callOpenAIAPI(contextPrompt, key);

            // Append the new Q&A to the existing result (backwards compatibility)
            const newContent = `\n\n---\n\n### ❓ ${userMsg.content}\n\n${result}`;
            setAnalysisResult(prev => prev + newContent);

            // Add AI response to chat
            setChatMessages(prev => [...prev, { role: 'assistant', content: result, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);

        } catch (e) {
            console.error("Follow-up failed", e);
            setChatMessages(prev => [...prev, { role: 'assistant', content: `**Error:** ${e.message}`, timestamp: new Date().toLocaleTimeString() }]);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const generateNewAnalysis = async () => {
        setAnalysisResult(''); // Clear previous result to force new generation
        await handleAnalyzeInvestments();
    };

    const saveAPIKey = (provider, key) => {
        setAiApiKeys({ ...aiApiKeys, [provider]: key });
    };

    // Markdown formatter
    const formatMarkdown = (text) => {
        if (!text) return '';
        const lines = text.split('\n');
        const formatted = [];
        let inList = false;

        lines.forEach((line) => {
            if (line.startsWith('## ')) {
                if (inList) { formatted.push('</ul>'); inList = false; }
                const headerText = line.substring(3);
                formatted.push(`<h3 class="text-lg font-bold text-slate-800 dark:text-white mt-6 mb-3 first:mt-0">${headerText}</h3>`);
            } else if (line.startsWith('### ') || (line.startsWith('**') && line.includes('**') && line.indexOf('**') !== line.lastIndexOf('**'))) {
                if (inList) { formatted.push('</ul>'); inList = false; }
                const headerText = line.startsWith('###') ? line.substring(4) : line.replace(/\*\*/g, '');
                formatted.push(`<h4 class="text-base font-bold text-slate-800 dark:text-white mt-4 mb-2">${headerText}</h4>`);
            } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                if (!inList) { formatted.push('<ul class="list-disc list-inside space-y-1.5 ml-2">'); inList = true; }
                const itemText = line.trim().substring(2).replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-700 dark:text-white">$1</strong>');
                formatted.push(`<li class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">${itemText}</li>`);
            } else if (line.trim()) {
                if (inList) { formatted.push('</ul>'); inList = false; }
                const formattedLine = line.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-700 dark:text-white">$1</strong>');
                formatted.push(`<p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-2">${formattedLine}</p>`);
            } else {
                if (inList) { formatted.push('</ul>'); inList = false; }
                formatted.push('<div class="h-2"></div>');
            }
        });
        if (inList) formatted.push('</ul>');
        return formatted.join('');
    };

    // --- Actions ---

    const handleNavigate = (nodeId) => {
        setPath([...path, nodeId]);
    };

    const handleNavigateUp = () => {
        if (path.length > 1) {
            setPath(path.slice(0, -1));
        }
    };

    const handleBreadcrumbClick = (index) => {
        setPath(path.slice(0, index + 1));
    };

    // Generic Tree Update Function
    const updateNodeInTree = (node, nodeId, updateFn) => {
        if (node.id === nodeId) {
            return updateFn(node);
        }
        if (node.children) {
            return {
                ...node,
                children: node.children.map(child => updateNodeInTree(child, nodeId, updateFn))
            };
        }
        return node;
    };

    // Add Item (Pie or Stock)
    const handleAddItem = (formData) => {
        const newItem = {
            id: crypto.randomUUID(),
            type: formData.type, // 'STOCK' or 'PIE'
            name: formData.name.toUpperCase(),
            target: parseFloat(formData.target) || 0,
            children: formData.type === 'PIE' ? [] : undefined,
            transactions: formData.type === 'STOCK' ? [] : undefined,
            currentPrice: 0
        };

        const newRoot = updateNodeInTree(rootNode, currentNode.id, (node) => ({
            ...node,
            children: [...(node.children || []), newItem]
        }));

        updateRoot(newRoot);
        setActiveModal(null);
    };

    const [editingTransaction, setEditingTransaction] = useState(null);

    // Add Transaction
    const handleAddTransaction = (nodeId, transaction) => {
        const newRoot = updateNodeInTree(rootNode, nodeId, (node) => ({
            ...node,
            transactions: [...(node.transactions || []), {
                id: crypto.randomUUID(),
                ...transaction,
                shares: parseFloat(transaction.shares),
                price: parseFloat(transaction.price)
            }]
        }));
        updateRoot(newRoot);
        // Don't close modal immediately, maybe they want to add more?
        // Or close it. Let's close for now.
        // setActiveModal(null);
    };

    const handleUpdateTransaction = (nodeId, transactionId, updatedValues) => {
        const newRoot = updateNodeInTree(rootNode, nodeId, (node) => ({
            ...node,
            transactions: (node.transactions || []).map(t =>
                t.id === transactionId
                    ? { ...t, ...updatedValues, shares: parseFloat(updatedValues.shares), price: parseFloat(updatedValues.price) }
                    : t
            )
        }));
        updateRoot(newRoot);
    };

    const handleDeleteTransaction = (nodeId, transactionId) => {
        const newRoot = updateNodeInTree(rootNode, nodeId, (node) => ({
            ...node,
            transactions: (node.transactions || []).filter(t => t.id !== transactionId)
        }));
        updateRoot(newRoot);
    };

    const handleDeleteReference = (nodeIdToDelete) => {
        // We need to find the parent to delete the child from it.
        // Easier approach: recreate tree filtering out the node
        const deleteRecursive = (node) => {
            if (!node.children) return node;
            return {
                ...node,
                children: node.children
                    .filter(c => c.id !== nodeIdToDelete)
                    .map(deleteRecursive)
            };
        };
        updateRoot(deleteRecursive(rootNode));
    };

    const handleUpdateTarget = (nodeId, newTarget) => {
        const newRoot = updateNodeInTree(rootNode, nodeId, (node) => ({
            ...node,
            target: newTarget
        }));
        updateRoot(newRoot);
    };

    // API Sync
    const fetchPrices = async () => {
        if (!apiKey) {
            setError("Please add your Finnhub API Key in settings.");
            setIsSettingsOpen(true);
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            // Flatten all stocks to fetch efficiently
            const symbolsToFetch = new Set();
            const collectSymbols = (node) => {
                if (node.type === 'STOCK') symbolsToFetch.add(node.name);
                if (node.children) node.children.forEach(collectSymbols);
            };
            collectSymbols(rootNode);

            const prices = {};
            for (const symbol of symbolsToFetch) {
                const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.c) prices[symbol] = data.c;
                }
                await new Promise(r => setTimeout(r, 200)); // Rate limit
            }

            // Update entire tree with new prices
            const updatePricesRecursive = (node) => {
                if (node.type === 'STOCK' && prices[node.name]) {
                    return { ...node, currentPrice: prices[node.name] };
                }
                if (node.children) {
                    return { ...node, children: node.children.map(updatePricesRecursive) };
                }
                return node;
            };

            updateRoot(updatePricesRecursive(rootNode));

        } catch (err) {
            setError("Failed to fetch one or more prices.");
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch Historical Data & Reconstruct Portfolio Performance
    // Fetch Historical Data & Reconstruct Portfolio Performance
    const fetchPortfolioHistory = async (yearOverride) => {
        if (!apiKey) {
            setError('Please add your Finnhub API Key in settings to load history.');
            setIsAISettingsOpen(true);
            return;
        }

        // Use override or state
        const yearToUse = yearOverride || selectedYear;

        setIsFetchingBenchmarks(true);
        setError(null); // Clear previous errors

        try {
            // 1. Gather all stock nodes
            const stockNodes = [];
            const gatherStocks = (node) => {
                if (node.type === 'STOCK') stockNodes.push(node);
                if (node.children) node.children.forEach(gatherStocks);
            };
            gatherStocks(rootNode);

            if (stockNodes.length === 0) {
                // No stocks, just stop
                setIsFetchingBenchmarks(false);
                return;
            }

            // 2. Unique symbols + Benchmarks
            // Clean symbols: trim and uppercase
            const symbolMap = new Map(); // name -> cleanedSymbol
            stockNodes.forEach(n => symbolMap.set(n.name, n.name.trim().toUpperCase()));

            const uniqueSymbols = [...new Set(symbolMap.values())];
            const allRequestSymbols = [...uniqueSymbols, 'SPY', 'QQQ'];

            // 3. Time range (Selected Year)
            const startOfYear = new Date(yearToUse, 0, 1);
            const endOfYear = new Date(yearToUse, 11, 31);
            const today = new Date();

            // If selected year is current year, end at today
            const toDate = (yearToUse === today.getFullYear()) ? today : endOfYear;

            const fromUnix = Math.floor(startOfYear.getTime() / 1000);
            const toUnix = Math.floor(toDate.getTime() / 1000);

            // 4. Fetch Candles
            const failedSymbols = [];

            const fetchCandles = async (symbol) => {
                // Strict rate limit: 1 request per 1.1 seconds per symbol to stay safe within 60 req/min
                await new Promise(r => setTimeout(r, 1100));

                try {
                    const res = await fetch(
                        `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${fromUnix}&to=${toUnix}&token=${apiKey}`
                    );

                    if (res.status === 403) {
                        console.warn(`Finnhub 403 for ${symbol}. Check API Key.`);
                        return { symbol, data: [], error: '403' };
                    }

                    if (!res.ok) return { symbol, data: [], error: res.status };

                    const data = await res.json();

                    if (data.s === 'no_data') return { symbol, data: [] }; // Not an error, just empty
                    if (data.s !== 'ok' || !data.t) return { symbol, data: [], error: 'invalid_response' };

                    return {
                        symbol,
                        data: data.t.map((ts, i) => ({
                            date: new Date(ts * 1000).toISOString().split('T')[0],
                            price: data.c[i]
                        }))
                    };
                } catch (e) {
                    console.error(`Fetch error for ${symbol}`, e);
                    return { symbol, data: [], error: 'exception' };
                }
            };

            const results = [];

            // Sequential fetch to respect rate limits
            for (const sym of allRequestSymbols) {
                const res = await fetchCandles(sym);
                results.push(res);
                if (res.error && !['SPY', 'QQQ'].includes(sym)) {
                    failedSymbols.push(sym);
                }
            }

            if (failedSymbols.length > 0) {
                setError(`Could not fetch data for: ${failedSymbols.join(', ')}. Please ensure they are valid ticker symbols.`);
            }

            // 5. Build Price Map (Symbol -> Date -> Price)
            const priceData = {};
            const spyData = results.find(r => r.symbol === 'SPY')?.data.map(d => ({ date: d.date, close: d.price })) || [];
            const qqqData = results.find(r => r.symbol === 'QQQ')?.data.map(d => ({ date: d.date, close: d.price })) || [];

            results.forEach(r => {
                // Map back to original names if needed, but we use cleaned symbols for lookup
                if (uniqueSymbols.includes(r.symbol)) {
                    if (!priceData[r.symbol]) priceData[r.symbol] = {};
                    r.data.forEach(d => {
                        priceData[r.symbol][d.date] = d.price;
                    });
                }
            });

            setBenchmarkData({ spy: spyData, qqq: qqqData });

            // 6. Reconstruct Portfolio History
            const allDates = [...new Set(results.flatMap(r => r.data.map(d => d.date)))].sort();

            if (allDates.length === 0) {
                if (failedSymbols.length === uniqueSymbols.length) {
                    // All failed
                    const sampleFailed = failedSymbols.slice(0, 3).join(', ');
                    // Check if it was 403 or just empty
                    const isAuthError = results.some(r => r.error === '403');

                    if (isAuthError) {
                        setError("API Key Error: Access Forbidden (403). Please check your Finnhub Key.");
                    } else {
                        setError(`No data found for any symbols (${sampleFailed}${failedSymbols.length > 3 ? '...' : ''}). Verify they are valid tickers (e.g. AAPL, not 'Apple').`);
                    }
                } else {
                    console.warn("No historical dates found overlapping with request.");
                }
                setIsFetchingBenchmarks(false);
                return;
            }

            // Track last known price to handle gaps
            const lastKnownPrices = {};

            const reconstructed = allDates.map(date => {
                // Update last known prices
                uniqueSymbols.forEach(sym => {
                    if (priceData[sym]?.[date]) lastKnownPrices[sym] = priceData[sym][date];
                });

                let totalValue = 0;
                let totalInvested = 0;

                stockNodes.forEach(node => {
                    // Use the cleaned symbol for lookup
                    const sym = symbolMap.get(node.name);

                    // Calculate Holdings & Cost Basis for this node on this date
                    let sharesOwned = 0;
                    let costBasis = 0;

                    (node.transactions || []).forEach(t => {
                        if (t.date <= date) {
                            if (t.type === 'BUY') {
                                sharesOwned += t.shares;
                                costBasis += t.shares * t.price;
                            } else {
                                // Sell: Reduce cost basis proportionally
                                if (sharesOwned > 0) {
                                    const avgCost = costBasis / sharesOwned;
                                    costBasis -= t.shares * avgCost;
                                    sharesOwned -= t.shares;
                                }
                            }
                        }
                    });

                    totalInvested += costBasis;

                    // Value using last known price
                    const price = lastKnownPrices[sym] || 0;
                    totalValue += sharesOwned * price;
                });

                // Calculate ROI %
                // If nothing invested yet, ROI is 0
                const roi = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;
                return { date, value: roi };
            });

            setRoiHistory(reconstructed);

        } catch (err) {
            console.error(err);
            setError('Failed to fetch historical data.');
        } finally {
            setIsFetchingBenchmarks(false);
        }
    };
    // Auto-reconstruct on mount or year change
    useEffect(() => {
        if (apiKey && !isFetchingBenchmarks && !error) {
            // If we haven't fetched OR year changed, fetch.
            // Simplified: Just fetch when selectedYear changes.
            // But we need to prevent infinite loop if fetch updates something in dependency array.
            // roiHistory is updated by fetch. selectedYear is user controlled.
            fetchPortfolioHistory();
        }
    }, [apiKey, selectedYear]);

    // --- Chart Logic ---
    const size = 300;
    const center = size / 2;
    const radius = size * 0.4;
    const innerRadius = radius * 0.7;
    const colors = ['#2A9D8F', '#264653', '#E9C46A', '#F4A261', '#E76F51', '#A8DADC', '#457B9D'];

    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * (percent - 0.25));
        const y = Math.sin(2 * Math.PI * (percent - 0.25));
        return [x, y];
    };

    const slices = [];
    let cumulativePercent = 0;
    childrenWithMetrics.forEach((child, i) => {
        const slicePercent = child.target / 100;
        if (slicePercent <= 0) return;

        const startPercent = cumulativePercent;
        cumulativePercent += slicePercent;

        const [startX, startY] = getCoordinatesForPercent(startPercent);
        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
        const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
        const isFull = slicePercent >= 0.999;

        const pathData = isFull
            ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center} ${center + radius} A ${radius} ${radius} 0 1 1 ${center} ${center - radius} M ${center} ${center - innerRadius} A ${innerRadius} ${innerRadius} 0 1 0 ${center} ${center + innerRadius} A ${innerRadius} ${innerRadius} 0 1 0 ${center} ${center - innerRadius} Z`
            : `M ${center + startX * radius} ${center + startY * radius} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${center + endX * radius} ${center + endY * radius} L ${center + endX * innerRadius} ${center + endY * innerRadius} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${center + startX * innerRadius} ${center + startY * innerRadius} Z`;

        slices.push({ path: pathData, color: colors[i % colors.length], data: child });
    });

    if (totalViewTarget < 100) {
        const startPercent = cumulativePercent;
        const slicePercent = (100 - totalViewTarget) / 100;
        const [startX, startY] = getCoordinatesForPercent(startPercent);
        const [endX, endY] = getCoordinatesForPercent(1);
        const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
        const pathData = `M ${center + startX * radius} ${center + startY * radius} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${center + endX * radius} ${center + endY * radius} L ${center + endX * innerRadius} ${center + endY * innerRadius} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${center + startX * innerRadius} ${center + startY * innerRadius} Z`;
        slices.push({ path: pathData, color: '#e2e8f0', data: { name: 'Unallocated' } });
    }

    return (
        <div className="p-8 pb-32 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header: M1 Style */}
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-200 dark:border-[#30363d] pb-6">
                <div>
                    <h1 className="text-4xl font-light text-slate-800 dark:text-slate-100 tracking-tight mb-1">
                        {currentProfile.name}'s Portfolio
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-slate-400 font-bold">
                        {path.map((id, index) => {
                            const node = findNode(rootNode, id) || rootNode;
                            const isLast = index === path.length - 1;
                            return (
                                <React.Fragment key={id}>
                                    <button
                                        onClick={() => handleBreadcrumbClick(index)}
                                        className={`hover:text-[#2A9D8F] transition-colors ${isLast ? 'text-slate-500 dark:text-slate-400 pointer-events-none' : ''}`}
                                    >
                                        {node.name}
                                    </button>
                                    {!isLast && <ChevronRight size={14} />}
                                </React.Fragment>
                            );
                        })}
                        {path.length > 1 && (
                            <button onClick={handleNavigateUp} className="p-1 -ml-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-2">
                                <ArrowLeft size={16} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex gap-8 mt-6 md:mt-0">
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cash</div>
                        <div className="text-xl font-bold text-slate-800 dark:text-white font-mono">${cashBalance.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Net Worth</div>
                        <div className="text-xl font-bold text-slate-800 dark:text-white font-mono">${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Day Change</div>
                        <div className={`text-xl font-bold font-mono ${totalDayChange >= 0 ? 'text-[#2A9D8F]' : 'text-rose-500'}`}>
                            {totalDayChange >= 0 ? '+' : ''}${Math.abs(totalDayChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl flex items-center gap-3 text-sm font-bold border border-rose-100 dark:border-rose-800">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Donut & Actions (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Donut Chart Container */}
                    <div className="bg-white dark:bg-[#161b22] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-[#30363d] relative min-h-[400px] flex flex-col items-center justify-center">
                        <div className="relative">
                            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible drop-shadow-xl transform -rotate-90">
                                {slices.map((slice, i) => (
                                    <path
                                        key={i}
                                        d={slice.path}
                                        fill={slice.color}
                                        className="transition-all duration-300 hover:scale-105 hover:z-10 cursor-pointer origin-center stroke-white dark:stroke-[#161b22] stroke-[4px]"
                                        onMouseEnter={() => setHoveredSlice(slice.data)}
                                        onMouseLeave={() => setHoveredSlice(null)}
                                    />
                                ))}
                            </svg>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                {hoveredSlice ? (
                                    <>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{hoveredSlice.name}</div>
                                        <div className="text-3xl font-bold text-slate-800 dark:text-white font-mono">${hoveredSlice.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                        <div className="text-sm font-bold text-slate-500 mt-1">{hoveredSlice.actualPercent.toFixed(2)}%</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-3xl font-bold text-slate-800 dark:text-white font-mono">${totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                        <div className={`text-sm font-bold mt-1 ${profitLoss >= 0 ? 'text-[#2A9D8F]' : 'text-rose-500'}`}>
                                            {profitLoss >= 0 ? '+' : ''}${Math.abs(profitLoss).toLocaleString()} ({roi.toFixed(2)}%)
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="grid grid-cols-5 gap-2 px-1">
                        {[
                            { icon: <Plus size={20} />, label: 'Buy', action: () => setActiveModal('ADD_ITEM') },
                            { icon: <Minus size={20} />, label: 'Sell', action: () => { } },
                            { icon: <Scale size={20} />, label: 'Rebal', action: () => { } },
                            { icon: <Edit2 size={20} />, label: 'Edit', action: () => setActiveModal('EDIT_PIE') },
                            { icon: <Settings size={20} />, label: 'Settings', action: () => setIsAISettingsOpen(true) },
                        ].map((btn, i) => (
                            <button
                                key={i}
                                onClick={btn.action}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="w-12 h-12 rounded-full bg-white dark:bg-[#21262d] border border-slate-200 dark:border-[#30363d] flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-[#2A9D8F] group-hover:text-white group-hover:border-[#2A9D8F] transition-all shadow-sm">
                                    {btn.icon}
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{btn.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Column: Performance Chart (8 cols) */}
                <div className="lg:col-span-8 bg-white dark:bg-[#161b22] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-[#30363d] min-h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Performance</h3>
                        <div className="flex items-center gap-2">
                            {/* Year Selector */}
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="bg-slate-100 dark:bg-[#21262d] text-slate-600 dark:text-slate-300 text-xs font-bold py-1 px-3 rounded-lg border-none outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-[#30363d] transition-colors"
                            >
                                {availableYears.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => fetchPortfolioHistory(selectedYear)}
                                disabled={isFetchingBenchmarks}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                                title="Refresh Data"
                            >
                                <RefreshCw size={14} className={isFetchingBenchmarks ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1">
                        <PortfolioPerformanceChart
                            plHistory={roiHistory}
                            benchmarkData={benchmarkData}
                            selectedYear={selectedYear}
                        />
                    </div>
                </div>
            </div>

            {/* Holdings Table (Full Width) */}
            <div className="bg-white dark:bg-[#161b22] rounded-3xl border border-slate-200 dark:border-[#30363d] shadow-sm overflow-hidden flex flex-col mt-8">
                <div className="p-6 border-b border-slate-100 dark:border-[#30363d] flex justify-between items-center bg-slate-50/50 dark:bg-[#0d1117]/20">
                    <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">
                        {currentNode.name === 'My Portfolio' ? 'Portfolio Slices' : `${currentNode.name} Holdings`}
                    </h3>
                    <button
                        onClick={() => setActiveModal('ADD_ITEM')}
                        className="bg-[#2A9D8F] hover:bg-[#218c7f] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                    >
                        <Plus size={16} /> Add {currentNode.id === 'root' ? 'Slice' : 'Holding'}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-[#30363d]">
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Name / Symbol</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Value</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Actual %</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right w-32">Target %</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-[#30363d]/50">
                            {currentNode.id === 'root' && (
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500 text-white font-bold text-xs">
                                                <DollarSign size={16} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-700 dark:text-slate-200">Cash</div>
                                                <div className="text-[10px] text-slate-400">Uninvested Capital</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1 font-bold text-slate-700 dark:text-slate-200">
                                            <span>$</span>
                                            <input
                                                type="number"
                                                value={cashBalance}
                                                onChange={(e) => setCashBalance(parseFloat(e.target.value) || 0)}
                                                className="w-24 bg-transparent text-right outline-none border-b border-transparent focus:border-[#2A9D8F] transition-colors"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-mono text-sm text-slate-500">
                                        {totalPortfolioValue > 0 ? ((cashBalance / totalPortfolioValue) * 100).toFixed(1) : '0.0'}%
                                    </td>
                                    <td className="p-4 text-right text-xs text-slate-400 italic">
                                        -
                                    </td>
                                    <td className="p-4 text-center">
                                        {/* No actions for cash */}
                                    </td>
                                </tr>
                            )}
                            {childrenWithMetrics.map(child => (
                                <tr key={child.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleNavigateDown(child.id)}
                                            className="flex items-center gap-3 w-full text-left"
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white ${child.type === 'PIE' ? 'bg-indigo-500' : 'bg-[#2A9D8F]'}`}>
                                                {child.type === 'PIE' ? <PieChart size={16} /> : <TrendingUp size={16} />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-700 dark:text-slate-200">{child.name}</div>
                                                <div className="text-[10px] text-slate-400">{child.type === 'PIE' ? 'Slice' : `${child.shares.toFixed(2)} Shares`}</div>
                                            </div>
                                        </button>
                                    </td>
                                    <td className="p-4 text-right font-bold text-slate-700 dark:text-slate-200">
                                        ${child.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-4 text-right font-mono text-sm text-slate-500">
                                        {child.actualPercent.toFixed(2)}%
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${Math.abs(child.drift) > 5 ? 'bg-rose-400' : 'bg-[#2A9D8F]'}`}
                                                    style={{ width: `${Math.min(child.target, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{child.target}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {child.type === 'STOCK' && (
                                                <button
                                                    onClick={() => { setActiveModal('TRANSACTIONS'); setSelectedNodeId(child.id); }}
                                                    className="p-2 text-slate-400 hover:text-[#2A9D8F] transition-colors"
                                                    title="Transaction History"
                                                >
                                                    <History size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteReference(child.id)}
                                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {childrenWithMetrics.length === 0 && (
                        <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                            <p className="font-medium">Empty Slice. Add a Stock or Pie.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Chat Button */}
            <button
                onClick={() => setIsAIAnalysisOpen(true)}
                className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl shadow-indigo-900/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 animate-in zoom-in duration-300"
            >
                <BadgeInfo size={24} />
            </button>

            {/* --- Modals --- */}

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
                                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                                    <Sparkles size={15} className="text-indigo-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white leading-none">Investment Analysis</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest">
                                        {aiProvider === 'gemini' ? 'Google Gemini' : aiProvider === 'claude' ? 'Anthropic Claude' : 'OpenAI ChatGPT'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {analysisResult && (
                                    <>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(analysisResult); alert('Analysis copied!'); }}
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

                        {/* Message Thread */}
                        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 min-h-0 custom-scrollbar">
                            {chatMessages.length === 0 && isAnalyzing && (
                                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                                    {/* Initial loading state handled by isAnalyzing block below if we want, or just empty */}
                                </div>
                            )}

                            {chatMessages.length === 0 && !isAnalyzing ? (
                                /* Empty state */
                                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                                    <div className="relative mb-5">
                                        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-10 rounded-full scale-150" />
                                        <div className="relative w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center">
                                            <Sparkles size={24} className="text-indigo-400" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-400">Ready to analyze</p>
                                    <button
                                        onClick={generateNewAnalysis}
                                        className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/30"
                                    >
                                        <Sparkles size={14} />
                                        Run Analysis
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
                                                <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Sparkles size={13} className="text-indigo-400" />
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

                                    {/* Typing indicator */}
                                    {isAnalyzing && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                                <Sparkles size={13} className="text-indigo-400" />
                                            </div>
                                            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl rounded-tl-sm px-4 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2">Analyzing...</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Chat Input Bar */}
                        <div className="px-4 pb-5 pt-3 border-t border-[#30363d] shrink-0">
                            <div className="relative flex items-end gap-2 bg-[#161b22] border border-[#30363d] rounded-2xl px-4 py-3 focus-within:border-indigo-500/50 transition-colors">
                                <textarea
                                    value={followUpQuestion}
                                    onChange={(e) => { setFollowUpQuestion(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                                    placeholder={analysisResult ? "Ask a follow-up question..." : "Ask about your portfolio..."}
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
                                    className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg shadow-indigo-900/30 shrink-0 self-end"
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

            {
                isAISettingsOpen && (
                    <Modal
                        isOpen={isAISettingsOpen}
                        onClose={() => setIsAISettingsOpen(false)}
                        title="Portfolio Settings"
                    >
                        <div className="space-y-6">
                            {/* Finnhub API Key Section */}
                            <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Finnhub API Key (Data Source)</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={apiKey || ''}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-[#2A9D8F] transition-all"
                                        placeholder="Enter your Finnhub API key..."
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2">
                                    Required for real-time stock prices and dividends. Get your free key from the <a href="https://finnhub.io/dashboard" target="_blank" rel="noreferrer" className="text-[#2A9D8F] hover:underline">Finnhub Dashboard</a>.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">AI Provider</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['gemini', 'claude', 'openai'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setAiProvider(p)}
                                            className={`py-2 px-3 rounded-xl text-sm font-bold capitalize transition-all border-2 ${aiProvider === p ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">API Key for {aiProvider}</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={aiApiKeys[aiProvider] || ''}
                                        onChange={(e) => saveAPIKey(aiProvider, e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        placeholder={`Enter your ${aiProvider} API key...`}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2">
                                    Your key is stored locally in your browser and never sent to our servers.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAISettingsOpen(false)}
                                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
                            >
                                Save & Close
                            </button>
                        </div>
                    </Modal>
                )
            }

            {
                activeModal === 'ADD_ITEM' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-[#161b22] rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-[#30363d]">
                            <h2 className="text-2xl font-black mb-6">Add to {currentNode.name}</h2>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                handleAddItem({
                                    type: formData.get('type'),
                                    name: formData.get('name'),
                                    target: formData.get('target')
                                });
                            }}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Item Type</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className="cursor-pointer">
                                                <input type="radio" name="type" value="STOCK" defaultChecked className="peer sr-only" />
                                                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 peer-checked:bg-[#2A9D8F] peer-checked:text-white peer-checked:border-transparent text-center font-bold transition-all">Stock / ETF</div>
                                            </label>
                                            <label className="cursor-pointer">
                                                <input type="radio" name="type" value="PIE" className="peer sr-only" />
                                                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 peer-checked:bg-indigo-500 peer-checked:text-white peer-checked:border-transparent text-center font-bold transition-all">Sub-Pie</div>
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ticker Symbol (e.g. AAPL)</label>
                                        <input name="name" required placeholder="AAPL" className="w-full bg-slate-50 dark:bg-[#0d1117] p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#2A9D8F] font-bold uppercase placeholder:normal-case" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Target %</label>
                                        <input name="target" type="number" required placeholder="10" className="w-full bg-slate-50 dark:bg-[#0d1117] p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#2A9D8F] font-bold" />
                                    </div>
                                    <div className="flex gap-3 mt-6">
                                        <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                                        <button type="submit" className="flex-1 py-3 font-bold bg-[#2A9D8F] text-white rounded-xl shadow-lg shadow-teal-900/20 hover:bg-[#218c7f]">Add Item</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                activeModal === 'TRANSACTIONS' && selectedNodeId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-[#161b22] rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-[#30363d] max-h-[80vh] flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black">History: {(findNode(rootNode, selectedNodeId) || {}).name}</h2>
                                <button onClick={() => { setActiveModal(null); setEditingTransaction(null); }} className="p-2 hover:bg-slate-100 rounded-full"><Trash2 size={1} /> <span className="text-2xl">&times;</span></button>
                            </div>

                            {/* List existing transactions */}
                            <div className="flex-1 overflow-y-auto mb-6 space-y-2 pr-2 custom-scrollbar">
                                {((findNode(rootNode, selectedNodeId) || {}).transactions || []).length === 0 ? (
                                    <p className="text-slate-400 text-center py-4">No transactions recorded.</p>
                                ) : (
                                    ((findNode(rootNode, selectedNodeId) || {}).transactions || []).sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => (
                                        <div key={t.id} className={`flex justify-between items-center p-3 rounded-xl border ${editingTransaction?.id === t.id ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-slate-50 border-transparent dark:bg-[#0d1117]'}`}>
                                            <div>
                                                <div className="font-bold text-sm text-slate-700 dark:text-slate-200">{t.type} {t.shares.toLocaleString(undefined, { maximumFractionDigits: 3 })} shares</div>
                                                <div className="text-xs text-slate-400">{t.date}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="font-bold text-sm">${(t.shares * t.price).toFixed(2)}</div>
                                                    <div className="text-xs text-slate-400">@ ${t.price}</div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => setEditingTransaction(t)}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                                    >
                                                        <MoreHorizontal size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTransaction(selectedNodeId, t.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add/Edit Transaction Form */}
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.target);
                                const transactionData = {
                                    type: fd.get('type'),
                                    date: fd.get('date'),
                                    shares: fd.get('shares'),
                                    price: fd.get('price')
                                };

                                if (editingTransaction) {
                                    handleUpdateTransaction(selectedNodeId, editingTransaction.id, transactionData);
                                    setEditingTransaction(null);
                                } else {
                                    handleAddTransaction(selectedNodeId, transactionData);
                                }
                                e.target.reset();
                            }} className="pt-6 border-t border-slate-100 dark:border-[#30363d]">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                                    </h4>
                                    {editingTransaction && (
                                        <button
                                            type="button"
                                            onClick={() => setEditingTransaction(null)}
                                            className="text-xs font-bold text-rose-500 hover:underline"
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type</label>
                                        <select
                                            name="type"
                                            defaultValue={editingTransaction?.type || "BUY"}
                                            key={editingTransaction?.id || 'new-type'} // Force re-render on state change
                                            className="w-full bg-slate-50 dark:bg-[#0d1117] p-2 rounded-lg font-bold outline-none"
                                        >
                                            <option value="BUY">Buy</option>
                                            <option value="SELL">Sell</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
                                        <input
                                            name="date"
                                            type="date"
                                            required
                                            defaultValue={editingTransaction?.date || new Date().toISOString().split('T')[0]}
                                            key={editingTransaction?.id || 'new-date'}
                                            className="w-full bg-slate-50 dark:bg-[#0d1117] p-2 rounded-lg font-bold outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shares</label>
                                        <input
                                            name="shares"
                                            type="number"
                                            step="any"
                                            required
                                            placeholder="0"
                                            defaultValue={editingTransaction?.shares || ''}
                                            key={editingTransaction?.id || 'new-shares'}
                                            className="w-full bg-slate-50 dark:bg-[#0d1117] p-2 rounded-lg font-bold outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Price / Share</label>
                                        <input
                                            name="price"
                                            type="number"
                                            step="any"
                                            required
                                            placeholder="0.00"
                                            defaultValue={editingTransaction?.price || ''}
                                            key={editingTransaction?.id || 'new-price'}
                                            className="w-full bg-slate-50 dark:bg-[#0d1117] p-2 rounded-lg font-bold outline-none"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className={`w-full mt-4 py-3 font-bold text-white rounded-xl transition-all ${editingTransaction ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-slate-900 dark:bg-slate-700 hover:bg-slate-800'}`}>
                                    {editingTransaction ? 'Update Transaction' : 'Add Record'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Investments;
