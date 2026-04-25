import { useState, FormEvent, useEffect } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { useUserData } from "../hooks/useUserData";
import { useAuth } from "../contexts/AuthContext";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

import {
  format, startOfMonth, endOfMonth,
  subMonths, isWithinInterval
} from "date-fns";

import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Analytics() {
  const { transactions, loading: txLoading } = useTransactions();
  const { userData, loading: userLoading } = useUserData();
  const { user } = useAuth();

  const [budgetInput, setBudgetInput] = useState("");
  const [savingsInput, setSavingsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [period, setPeriod] = useState("all");

  // ✅ Sync form with Firestore
  useEffect(() => {
    if (userData) {
      setBudgetInput(userData.budget?.toString() || "");
      setSavingsInput(userData.savingsGoal?.toString() || "");
    }
  }, [userData]);

  if (txLoading || userLoading) return <div>Loading analytics...</div>;

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  // ✅ SAVE SETTINGS (Fixed Firestore creation/update)
  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      const data = {
        budget: parseFloat(budgetInput) || 0,
        savingsGoal: parseFloat(savingsInput) || 0,
        updatedAt: serverTimestamp(),
      };

      if (snap.exists()) {
        await setDoc(userRef, data, { merge: true });
      } else {
        await setDoc(userRef, { ...data, createdAt: serverTimestamp() });
      }

      alert("Settings saved!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  }

  // 🔥 Monthly trends
  const trendsMap = new Map<string, { month: string; income: number; expense: number }>();

  [...transactions].reverse().forEach(t => {
    const m = format(new Date(t.date), "MMM yyyy");
    if (!trendsMap.has(m)) trendsMap.set(m, { month: m, income: 0, expense: 0 });

    const curr = trendsMap.get(m)!;
    t.type === "income" ? curr.income += t.amount : curr.expense += t.amount;
  });

  const trendsData = Array.from(trendsMap.values()).sort((a, b) =>
    new Date(a.month).getTime() - new Date(b.month).getTime()
  );

  // 🔥 Filter period
  const now = new Date();
  const filteredTransactions = transactions.filter(t => {
    if (period === "all") return true;
    const d = new Date(t.date);

    if (period === "this_month")
      return isWithinInterval(d, { start: startOfMonth(now), end: endOfMonth(now) });

    if (period === "last_month") {
      const lastMonth = subMonths(now, 1);
      return isWithinInterval(d, {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth)
      });
    }

    return true;
  });

  // 🔥 Category breakdown
  const expensesMap = new Map<string, number>();
  const incomeMap = new Map<string, number>();

  filteredTransactions.forEach(t => {
    const map = t.type === "expense" ? expensesMap : incomeMap;
    map.set(t.category, (map.get(t.category) || 0) + t.amount);
  });

  const expensesByCategory = Array.from(expensesMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a,b)=>b.value-a.value);

  const incomeByCategory = Array.from(incomeMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a,b)=>b.value-a.value);

  const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#6b7280"];

  // 📄 CSV Export
  const downloadCSV = () => {
    setExporting(true);
    const headers = ["Date,Description,Category,Type,Amount\n"];
    const rows = transactions.map(t =>
      `${format(new Date(t.date),"yyyy-MM-dd")},"${t.description}",${t.category},${t.type},${t.amount}`
    );
    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${format(new Date(),"yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setExporting(false);
  };

  // 📄 PDF Export
  const downloadPDF = () => {
    setExporting(true);
    const pdf = new jsPDF();
    pdf.text("Financial Report", 14, 15);

    autoTable(pdf, {
      startY: 20,
      head: [["Date","Description","Category","Type","Amount"]],
      body: transactions.map(t => [
        format(new Date(t.date),"yyyy-MM-dd"),
        t.description,
        t.category,
        t.type,
        formatCurrency(t.amount)
      ])
    });

    pdf.save(`financial-report-${format(new Date(),"yyyy-MM-dd")}.pdf`);
    setExporting(false);
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold text-white">Analytics & Reports</h1>
        <div className="flex gap-3">
          <button disabled={exporting} onClick={downloadCSV} className="btn">
            <Download className="mr-2 h-4 w-4"/> CSV
          </button>
          <button disabled={exporting} onClick={downloadPDF} className="btn">
            <Download className="mr-2 h-4 w-4"/> PDF
          </button>
        </div>
      </div>

      {/* GOALS */}
      <div className="glass-card p-6 rounded-3xl">
        <h2 className="text-lg font-semibold text-white mb-4">Financial Goals</h2>
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <input type="number" required value={budgetInput}
            onChange={e=>setBudgetInput(e.target.value)}
            placeholder="Monthly Budget" className="input"/>
          <input type="number" required value={savingsInput}
            onChange={e=>setSavingsInput(e.target.value)}
            placeholder="Savings Goal" className="input"/>
          <button disabled={saving} className="btn w-full">
            {saving ? "Saving..." : "Save Goals"}
          </button>
        </form>
      </div>

      {/* PIE CHARTS */}
      <div className="grid md:grid-cols-2 gap-6">
        {[expensesByCategory, incomeByCategory].map((data, i) => (
          <div key={i} className="glass-card p-6 rounded-3xl h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={60}>
                  {data.map((_, idx)=><Cell key={idx} fill={COLORS[idx%COLORS.length]}/>)}
                </Pie>
                <Tooltip formatter={(val:number)=>formatCurrency(val)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* TREND CHART */}
      <div className="glass-card p-6 rounded-3xl h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trendsData}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="month"/>
            <YAxis/>
            <Tooltip formatter={(val:number)=>formatCurrency(val)}/>
            <Legend/>
            <Bar dataKey="income" fill="#10b981"/>
            <Bar dataKey="expense" fill="#ef4444"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}