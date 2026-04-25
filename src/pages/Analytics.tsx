import { useState, FormEvent } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { useUserData } from "../hooks/useUserData";
import { useAuth } from "../contexts/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Analytics() {
  const { transactions, loading: txLoading } = useTransactions();
  const { userData, loading: userLoading } = useUserData();
  const { user } = useAuth();
  
  const [budgetInput, setBudgetInput] = useState(userData?.budget?.toString() || "");
  const [savingsInput, setSavingsInput] = useState(userData?.savingsGoal?.toString() || "");
  const [saving, setSaving] = useState(false);

  if (txLoading || userLoading) return <div>Loading analytics...</div>;

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { serverTimestamp } = await import("firebase/firestore");
      await setDoc(doc(db, "users", user.uid), {
        budget: parseFloat(budgetInput) || 0,
        savingsGoal: parseFloat(savingsInput) || 0,
        updatedAt: serverTimestamp()
      }, { merge: true }); // Wait, if the user doesn't exist, it creates it. We should use standard setDoc without merge possibly, since it might be fully defined? our rules demand 3 keys. Wait, updating requires all of them or hasOnly? the rule says affectedKeys hasOnly. Merge might be fine. Wait, strict creation needs EXACT keys. If it doesn't exist, our rule requires EXACT keys on creation. Let's provide them all.
      alert("Settings saved!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  }

  // Monthly trends data
  const trendsMap = new Map<string, { month: string; income: number; expense: number }>();
  
  [...transactions].reverse().forEach(t => {
    const d = new Date(t.date);
    const m = format(d, 'MMM yyyy');
    if (!trendsMap.has(m)) {
      trendsMap.set(m, { month: m, income: 0, expense: 0 });
    }
    const curr = trendsMap.get(m)!;
    if (t.type === 'income') curr.income += t.amount;
    else curr.expense += t.amount;
  });

  const trendsData = Array.from(trendsMap.values());

  const downloadCSV = () => {
    const headers = ["Date,Description,Category,Type,Amount\n"];
    const rows = transactions.map(t => 
      `${format(new Date(t.date), "yyyy-MM-dd")},"${t.description.replace(/"/g, '""')}",${t.category},${t.type},${t.amount}`
    );
    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Financial Report", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
      body: transactions.map(t => [
        format(new Date(t.date), "yyyy-MM-dd"),
        t.description,
        t.category,
        t.type,
        `$${t.amount.toFixed(2)}`
      ]),
    });
    doc.save(`financial-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics & Reports</h1>
          <p className="text-slate-400">Gain insights into your budget and savings.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={downloadCSV} className="flex items-center px-4 py-2 glass-card text-white rounded-xl text-sm border border-white/10 hover:bg-white/5 transition-all">
            <Download className="mr-2 h-4 w-4" /> CSV
          </button>
          <button onClick={downloadPDF} className="flex items-center px-4 py-2 glass-card text-white rounded-xl text-sm border border-white/10 hover:bg-white/5 transition-all">
            <Download className="mr-2 h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-card p-6 rounded-3xl">
          <h2 className="text-lg font-semibold text-white mb-6">Financial Goals</h2>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400">Monthly Budget</label>
              <input type="number" required value={budgetInput} onChange={e => setBudgetInput(e.target.value)} className="mt-2 block w-full rounded-xl bg-black/20 border border-white/10 text-white p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400">Savings Goal</label>
              <input type="number" required value={savingsInput} onChange={e => setSavingsInput(e.target.value)} className="mt-2 block w-full rounded-xl bg-black/20 border border-white/10 text-white p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors" />
            </div>
            <button type="submit" disabled={saving} className="mt-4 w-full flex justify-center items-center px-6 py-3 accent-gradient text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20">
              {saving ? "Saving..." : "Save Goals"}
            </button>
          </form>
        </div>

        <div className="glass-card p-6 rounded-3xl">
           <h2 className="text-lg font-semibold text-white mb-4">Savings Rate Target</h2>
           <div className="text-slate-400 text-sm">
               Targeting a ${userData?.savingsGoal || 0} monthly savings.
           </div>
           <div className="mt-6 flex items-center justify-center h-48 rounded-xl bg-white/5 border border-dashed border-white/10 text-slate-500">
             Start tracking consistently to generate robust insights.
           </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl">
        <h2 className="text-lg font-semibold text-white mb-6">Income vs Expenses Trend</h2>
        <div className="h-80 w-full">
          {trendsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#e2e8f0' }} formatter={(val: number) => `$${val.toFixed(2)}`} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex h-full items-center justify-center text-sm text-slate-500">No trend data available.</div>
          )}
        </div>
      </div>

    </div>
  );
}
