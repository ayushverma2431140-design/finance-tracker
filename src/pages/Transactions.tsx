import { useState } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { format } from "date-fns";
import TransactionModal from "../components/TransactionModal";
import { Plus, Trash2 } from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

export default function Transactions() {
  const { transactions, loading } = useTransactions();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) return <div>Loading...</div>;

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await deleteDoc(doc(db, "transactions", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Transactions</h1>
          <p className="text-slate-400">View and manage your financial records.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-6 py-2 accent-gradient text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </button>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Description</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Category</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Amount</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-400">{format(new Date(t.date), "MMM d, yyyy")}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                    {t.description}
                    {t.isRecurring && <span className="ml-2 inline-flex items-center rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400 border border-violet-500/20 uppercase tracking-widest">Recurring</span>}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-400">{t.category}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium border ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-rose-400 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
