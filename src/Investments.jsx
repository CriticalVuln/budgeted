import React, { useState, useEffect, useMemo, useRef } from 'react';
import usePersistentState from './hooks/usePersistentState';
import { Plus, Trash2, RefreshCw, PieChart, TrendingUp, AlertCircle, Save, ChevronRight, ArrowLeft, History, Folder, Search, MoreHorizontal, DollarSign, Sparkles, Copy, ArrowUpRight, Settings, X } from 'lucide-react';

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

    price: number;
};
*/
const GainLossLineChart = ({ history = [] }) => {
    const containerRef = useRef(null);
    const [hoveredPoint, setHoveredPoint] = useState(null);

    // Filter to ensure we have valid history
    const rawHistory = history.filter(h => !isNaN(h.value));

    // Generate weekly data points, interpolating if data is missing
    const validHistory = useMemo(() => {
        if (rawHistory.length === 0) return [];

        const sortedRaw = [...rawHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
        const startEntry = sortedRaw[0];
        const endEntry = sortedRaw[sortedRaw.length - 1];

        const startDate = new Date(startEntry.date);
        const endDate = new Date(endEntry.date);

        const generatedHistory = [];

        let currentDate = new Date(startDate);

        // Loop through dates week by week
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];

            // Try to find exact match
            const exactMatch = sortedRaw.find(h => h.date === dateStr);
            if (exactMatch) {
                generatedHistory.push(exactMatch);
            } else {
                // Interpolate
                // Find prev known
                let prev = sortedRaw[0];
                for (let i = 0; i < sortedRaw.length; i++) {
                    if (new Date(sortedRaw[i].date) <= currentDate) prev = sortedRaw[i];
                    else break;
                }

                // Find next known
                let next = sortedRaw[sortedRaw.length - 1];
                for (let i = sortedRaw.length - 1; i >= 0; i--) {
                    if (new Date(sortedRaw[i].date) >= currentDate) next = sortedRaw[i];
                    else break;
                }

                if (!prev || !next || prev === next) {
                    generatedHistory.push({ date: dateStr, value: prev ? prev.value : 0 });
                } else {
                    const prevTime = new Date(prev.date).getTime();
                    const nextTime = new Date(next.date).getTime();
                    const curTime = currentDate.getTime();
                    const ratio = (curTime - prevTime) / (nextTime - prevTime);
                    const interpolatedValue = prev.value + (next.value - prev.value) * ratio;
                    generatedHistory.push({ date: dateStr, value: interpolatedValue });
                }
            }

            // Advance 1 week (7 days)
            currentDate.setDate(currentDate.getDate() + 7);
        }

        // Ensure final 'current' point is the very last point and valid logic for displaying graph
        const finalGenerated = generatedHistory[generatedHistory.length - 1];
        const lastRawDate = new Date(endEntry.date);

        // If our last generated point is significantly before the actual end date
        if (!finalGenerated || new Date(finalGenerated.date).getTime() < lastRawDate.getTime()) {
            generatedHistory.push(endEntry);
        }

        return generatedHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [rawHistory]);

    if (validHistory.length === 0) return (
        <div className="h-32 flex items-center justify-center text-slate-400 text-sm font-medium border border-dashed border-slate-200 dark:border-[#30363d] rounded-xl bg-slate-50/50 dark:bg-[#0d1117]/20">
            Waiting for data...
        </div>
    );

    const height = 180;
    const padding = 20;

    // Calculate scales
    const values = validHistory.map(d => d.value);
    const minVal = Math.min(0, ...values); // Always include 0 line?
    const maxVal = Math.max(0, ...values);

    // Add some padding to Y domain
    const range = maxVal - minVal || 100;
    const yMin = minVal - (range * 0.1);
    const yMax = maxVal + (range * 0.1);

    const getX = (index) => {
        if (validHistory.length <= 1) return 50; // Center single point? No, just left
        return (index / (validHistory.length - 1)) * 100;
    };

    const getY = (value) => {
        return height - ((value - yMin) / (yMax - yMin)) * height;
    };

    const zeroY = getY(0);

    // Build Path
    let d = '';
    validHistory.forEach((point, i) => {
        const x = getX(i);
        const y = getY(point.value);
        d += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
    });

    return (
        <div className="w-full relative" ref={containerRef} onMouseLeave={() => setHoveredPoint(null)}>
            <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full h-48 overflow-visible">
                {/* Zero Line */}
                <line x1="0" y1={zeroY} x2="100" y2={zeroY} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="0.5" strokeDasharray="2 2" />

                {/* Line */}
                <path d={d} fill="none" stroke="#2A9D8F" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

                {/* Gradient Area below line - optional, simplified for now */}

                {/* Interactive Points (invisible targets) */}
                {validHistory.map((point, i) => (
                    <rect
                        key={i}
                        x={getX(i) - 2}
                        y="0"
                        width="4"
                        height={height}
                        fill="transparent"
                        onMouseEnter={() => setHoveredPoint({ ...point, x: getX(i), y: getY(point.value) })}
                        className="cursor-crosshair"
                    />
                ))}

                {/* Hover Dot */}
                {hoveredPoint && (
                    <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="3" className="fill-[#2A9D8F] stroke-white dark:stroke-slate-900 stroke-[1.5px] vector-effect-non-scaling-stroke" />
                )}
            </svg>

            {hoveredPoint && (
                <div
                    className="absolute bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2 z-10 whitespace-nowrap"
                    style={{ left: `${hoveredPoint.x}%`, top: hoveredPoint.y }}
                >
                    <div>{hoveredPoint.date}</div>
                    <div className={hoveredPoint.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {hoveredPoint.value >= 0 ? '+' : ''}${hoveredPoint.value.toLocaleString()}
                    </div>
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


const Investments = ({ goals = [], portfolioData, setPortfolioData, cashBalance, setCashBalance, profiles = [], activeProfileId = 'default', aiProvider, setAiProvider, aiApiKeys, setAiApiKeys }) => {
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
    const [apiKey, setApiKey] = usePersistentState('finnhub_api_key', '');
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
    const [plHistory, setPlHistory] = usePersistentState('investments_pl_history_v2', []);

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

    // Calculate Profit/Loss based on "Retirement" goal
    const { profitLoss, roi, investedAmount } = useMemo(() => {
        const retirementGoal = goals.find(g => g.name.toLowerCase().includes('retirement'));
        const invested = retirementGoal ? retirementGoal.current : 0;
        const pl = totalPortfolioValue - invested;
        const roiVal = invested > 0 ? (pl / invested) * 100 : 0;

        return { profitLoss: pl, roi: roiVal, investedAmount: invested };
    }, [goals, totalPortfolioValue]);

    // Track History Effect
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setPlHistory(prev => {
            let history = Array.isArray(prev) ? [...prev] : [];
            const startDate = '2026-01-05'; // First round of buying

            // Seed start date if missing and history is empty or starts after
            if (history.length === 0 || history[0].date > startDate) {
                history.unshift({ date: startDate, value: 0 });
            }

            // Check if we have an entry for today
            const lastEntryIndex = history.findIndex(h => h.date === today);

            if (lastEntryIndex !== -1) {
                // Update today's entry
                if (history[lastEntryIndex].value !== profitLoss) {
                    history[lastEntryIndex] = { ...history[lastEntryIndex], value: profitLoss };
                }
            } else {
                // Add new entry for today
                history.push({ date: today, value: profitLoss });
            }

            // Ensure sorted by date
            history.sort((a, b) => new Date(a.date) - new Date(b.date));

            return history;
        });
    }, [profitLoss, setPlHistory]);

    // --- AI Analysis Logic ---
    const [isAIAnalysisOpen, setIsAIAnalysisOpen] = useState(false);
    const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
    // AI Provider and Keys passed as props
    const [analysisResult, setAnalysisResult] = usePersistentState('ai_inv_analysis_result', '');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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

        console.log("Analysis Prompt:", prompt);
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

        if (analysisResult) { setIsAIAnalysisOpen(true); return; }

        setIsAnalyzing(true);
        setIsAIAnalysisOpen(true);
        setAnalysisResult('');

        try {
            const prompt = generateInvestmentAnalysisPrompt();
            let result = '';
            if (aiProvider === 'gemini') result = await callGeminiAPI(prompt, key);
            else if (aiProvider === 'claude') result = await callClaudeAPI(prompt, key);
            else if (aiProvider === 'openai') result = await callOpenAIAPI(prompt, key);
            setAnalysisResult(result);
        } catch (e) {
            setAnalysisResult(`Error: ${e.message}\n\nPlease check your API key.`);
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
            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-200 dark:border-[#30363d] pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-sm text-slate-400 font-bold">
                        {path.map((id, index) => {
                            const node = findNode(rootNode, id) || rootNode;
                            const isLast = index === path.length - 1;
                            return (
                                <React.Fragment key={id}>
                                    <button
                                        onClick={() => handleBreadcrumbClick(index)}
                                        className={`hover:text-[#2A9D8F] transition-colors ${isLast ? 'text-slate-800 dark:text-white pointer-events-none' : ''}`}
                                    >
                                        {node.name}
                                    </button>
                                    {!isLast && <ChevronRight size={14} />}
                                </React.Fragment>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-4">
                        {path.length > 1 && (
                            <button onClick={handleNavigateUp} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <ArrowLeft size={24} />
                            </button>
                        )}
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{currentNode.name}</h1>
                    </div>
                </div>
                <div className="flex items-end gap-6">
                    <button
                        onClick={handleAnalyzeInvestments}
                        disabled={isAnalyzing}
                        className="group relative px-5 py-3 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <div className="relative flex items-center gap-2">
                            <Sparkles size={18} className={isAnalyzing ? "animate-spin" : "animate-pulse"} />
                            <span>{isAnalyzing ? "Analyzing..." : "Expert Analysis"}</span>
                        </div>
                    </button>
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Portfolio Value</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl flex items-center gap-3 text-sm font-bold border border-rose-100 dark:border-rose-800">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Visuals */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Profit/Loss Card */}
                    <div className="bg-white dark:bg-[#161b22] rounded-3xl p-6 border border-slate-200 dark:border-[#30363d] shadow-sm animate-in slide-in-from-bottom-2 duration-700">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Performance</h3>

                        {/* Mini Chart */}
                        <div className="mb-6 -mx-2">
                            <GainLossLineChart history={plHistory} />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-bold text-slate-500 mb-1">Net Profit / Loss</p>
                                <div className={`text-4xl font-black tracking-tight ${profitLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {profitLoss >= 0 ? '+' : ''}{profitLoss.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                                </div>
                                <div className={`text-sm font-bold mt-1 ${profitLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {profitLoss >= 0 ? '▲' : '▼'} {Math.abs(roi).toFixed(2)}% Return
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-[#30363d] space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-slate-400">Invested Capital</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">${investedAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-slate-400">Current Value</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#161b22] rounded-3xl p-6 border border-slate-200 dark:border-[#30363d] shadow-sm flex flex-col items-center justify-center relative min-h-[400px]">
                        <div className="relative">
                            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible drop-shadow-xl transform -rotate-90">
                                {slices.map((slice, i) => (
                                    <path
                                        key={i}
                                        d={slice.path}
                                        fill={slice.color}
                                        className="transition-all duration-300 hover:scale-105 hover:z-10 cursor-pointer origin-center stroke-white dark:stroke-slate-900 stroke-[3px]"
                                        onMouseEnter={() => setHoveredSlice(slice.data)}
                                        onMouseLeave={() => setHoveredSlice(null)}
                                    />
                                ))}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                {hoveredSlice ? (
                                    <>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{hoveredSlice.name}</span>
                                        <span className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                                            ${hoveredSlice.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentNode.type === 'PIE' ? 'Retirement' : 'Allocation'}</span>
                                        <span className={`text-4xl font-black ${totalViewTarget !== 100 ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
                                            {totalViewTarget}%
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4 w-full mt-8">
                            <button
                                onClick={fetchPrices}
                                disabled={isLoading}
                                className="flex-1 bg-slate-100 dark:bg-[#0d1117] text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                                <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                                {isLoading ? "Syncing..." : "Sync Prices"}
                            </button>
                            <button
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                className="flex-1 bg-slate-100 dark:bg-[#0d1117] text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                                Settings
                            </button>
                        </div>
                    </div>

                    {isSettingsOpen && (
                        <div className="w-full mt-4 p-4 bg-slate-50 dark:bg-[#0d1117]/50 rounded-xl border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Finnhub API Key</label>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="flex-1 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                                    placeholder="pk_..."
                                />
                                <button onClick={() => setIsSettingsOpen(false)} className="bg-[#2A9D8F] text-white px-3 rounded-lg"><Save size={16} /></button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Ledger */}
                <div className="lg:col-span-8 bg-white dark:bg-[#161b22] rounded-3xl border border-slate-200 dark:border-[#30363d] shadow-sm overflow-hidden flex flex-col">
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
                                {childrenWithMetrics.map((child) => (
                                    <tr
                                        key={child.id}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                                        onClick={() => child.type === 'PIE' ? handleNavigate(child.id) : null}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${child.type === 'PIE' ? 'bg-indigo-500' : 'bg-slate-500'}`}>
                                                    {child.type === 'PIE' ? <PieChart size={16} /> : child.name.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-700 dark:text-slate-200">{child.name}</div>
                                                    {child.type === 'STOCK' && (
                                                        <div className="text-[10px] text-slate-400">
                                                            {child.shares.toLocaleString(undefined, { maximumFractionDigits: 3 })} shares @ ${child.avgCost.toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-bold text-slate-700 dark:text-slate-200">
                                            ${child.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4 text-right font-mono text-sm text-slate-500">
                                            {child.actualPercent.toFixed(1)}%
                                        </td>
                                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <input
                                                    type="number"
                                                    value={child.target}
                                                    onChange={(e) => handleUpdateTarget(child.id, parseFloat(e.target.value))}
                                                    className="bg-slate-100 dark:bg-[#0d1117] rounded-lg px-2 py-1 font-bold text-slate-700 dark:text-slate-200 w-16 text-right outline-none focus:ring-2 focus:ring-[#2A9D8F]"
                                                />
                                                <span className="text-xs text-slate-400">%</span>
                                            </div>

                                        </td>
                                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-center gap-2">
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
            </div>

            {/* --- Modals --- */}

            <Modal
                isOpen={isAIAnalysisOpen}
                onClose={() => setIsAIAnalysisOpen(false)}
                title="Expert Investment Analysis"
            >
                <div className="space-y-6">
                    {!analysisResult && isAnalyzing ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                                <Sparkles size={48} className="text-indigo-500 animate-bounce relative z-10" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Analyzing Portfolio...</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
                                    Our AI agents are reviewing your asset allocation, risk profile, and stock weighting.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="prose prose-sm dark:prose-invert max-w-none space-y-2 mb-6" dangerouslySetInnerHTML={{ __html: formatMarkdown(analysisResult) }} />

                            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-[#30363d]">
                                <button
                                    onClick={generateNewAnalysis}
                                    disabled={isAnalyzing}
                                    className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={16} className={isAnalyzing ? "animate-spin" : ""} />
                                    Regenerate
                                </button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(analysisResult);
                                    }}
                                    className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    title="Copy to Clipboard"
                                >
                                    <Copy size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {isAISettingsOpen && (
                <Modal
                    isOpen={isAISettingsOpen}
                    onClose={() => setIsAISettingsOpen(false)}
                    title="AI Settings"
                >
                    <div className="space-y-6">
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
            )}

            {activeModal === 'ADD_ITEM' && (
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
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Name / Symbol</label>
                                    <input name="name" required placeholder="e.g. AAPL or Tech Sector" className="w-full bg-slate-50 dark:bg-[#0d1117] p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#2A9D8F] font-bold" />
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
            )}

            {activeModal === 'TRANSACTIONS' && selectedNodeId && (
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
            )}
        </div>
    );
};

export default Investments;
