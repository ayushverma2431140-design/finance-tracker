import { useTransactions } from "../hooks/useTransactions";
import { useUserData } from "../hooks/useUserData";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6b7280"];

export default function Dashboard() {
  const { transactions, loading: txLoading } = useTransactions();
  const { userData, loading: userLoading } = useUserData();

  if (txLoading || userLoading) return <div>Loading dashboard...</div>;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = monthlyIncome - monthlyExpense;
  const budget = userData?.budget || 0;
  const budgetUsedPercent = budget > 0 ? Math.min((monthlyExpense / budget) * 100, 100) : 0;

  // Category summary for pie chart
  const categoriesMap = new Map<string, number>();
  monthlyTransactions.filter(t => t.type === 'expense').forEach(t => {
    categoriesMap.set(t.category, (categoriesMap.get(t.category) || 0) + t.amount);
  });
  const pieData = Array.from(categoriesMap.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Overview</h1>
          <p className="text-slate-400">Here is a quick summary of your assets this month.</p>
        </div>
      </header>
      
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
          <div className="text-sm text-slate-400 mb-1">Monthly Balance</div>
          <div className={`mt-2 text-3xl font-bold text-white`}>
            ${balance.toFixed(2)}
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <div className="text-sm text-slate-400 mb-1">Monthly Income</div>
          <div className="mt-2 text-3xl font-bold text-emerald-400">${monthlyIncome.toFixed(2)}</div>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <div className="text-sm text-slate-400 mb-1">Monthly Expenses</div>
          <div className="mt-2 text-3xl font-bold text-rose-400">${monthlyExpense.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6 rounded-3xl">
          <h2 className="text-lg font-semibold text-white mb-4">Budget Overview</h2>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-slate-300">Spent: ${monthlyExpense.toFixed(2)}</span>
            <span className="text-slate-500">Budget: ${budget.toFixed(2)}</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-white/10">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${budgetUsedPercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${budgetUsedPercent}%` }}
            />
          </div>
          {budget === 0 && (
            <p className="mt-4 text-sm text-slate-500">Go to Settings (or Analytics) to set a budget.</p>
          )}
        </div>

        <div className="glass-card p-6 rounded-3xl flex flex-col items-center">
           <h2 className="text-lg font-semibold text-white mb-4 self-start">Expenses by Category</h2>
           {pieData.length > 0 ? (
             <div className="h-48 w-full block">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} stroke="none">
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#e2e8f0' }} formatter={(val: number) => `$${val.toFixed(2)}`} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
           ) : (
             <div className="flex h-48 items-center justify-center text-sm text-slate-500">No expenses this month</div>
           )}
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
        </div>
        <div className="divide-y divide-white/5">
          {transactions.slice(0, 5).map((t) => (
             <div key={t.id} className="flex items-center justify-between px-6 py-4">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-lg">{t.type === 'income' ? '💰' : '🛍️'}</div>
                 <div>
                   <div className="text-sm font-medium text-white">{t.description}</div>
                   <div className="text-xs text-slate-500">{format(new Date(t.date), "MMM d, yyyy")} • {t.category}</div>
                 </div>
               </div>
               <div className={`text-sm font-medium ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                 {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
               </div>
             </div>
          ))}
          {transactions.length === 0 && (
             <div className="p-6 text-center text-sm text-slate-500">No transactions yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
