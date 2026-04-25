import { useState, FormEvent } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

export default function TransactionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const payload: any = {
        userId: user.uid,
        type,
        category,
        amount: parseFloat(amount),
        date: new Date(date).getTime(),
        description,
        isRecurring,
        createdAt: Date.now(), // we'll use server timestamp in rules, wait, my rule says request.time, actually I need to mock this out if I use Date.now() and my rule demands exactly request.time.
        // Actually, if the rule is `data.createdAt == request.time`, the only valid way to pass it from the client without serverTimestamp (which resolves on the server side) is to avoid checking it locally, but the rule requires it. 
        // Note: when using rule `data.createdAt == request.time`, you MUST use `serverTimestamp()` from firebase/firestore!
      };
      
      // I will fix the serverTimestamp issue here
      // But wait, the rule says `data.createdAt == request.time`. 
      // Yes, `serverTimestamp()` resolves to `request.time` in rules.
      
      if (isRecurring) {
        payload.recurringFrequency = recurringFrequency;
      }
      
      // I need to import serverTimestamp from firestore, actually since I'm lazy, I'll just adjust the serverTimestamp in a bit
      // Wait, let's use it dynamically
      const { serverTimestamp } = await import("firebase/firestore");
      payload.createdAt = serverTimestamp();

      await addDoc(collection(db, "transactions"), payload);
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "transactions");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="glass-card w-full max-w-md rounded-3xl p-8 relative overflow-hidden">
        <h2 className="mb-6 text-xl font-bold text-white">Add Transaction</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <label className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors has-[:checked]:border-rose-500 has-[:checked]:bg-rose-500/10 has-[:checked]:text-rose-400 text-slate-300">
              <input type="radio" className="sr-only" checked={type === "expense"} onChange={() => setType("expense")} />
              <span className="font-semibold text-sm">Expense</span>
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 has-[:checked]:text-emerald-400 text-slate-300">
              <input type="radio" className="sr-only" checked={type === "income"} onChange={() => setType("income")} />
              <span className="font-semibold text-sm">Income</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400">Amount</label>
            <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-2 block w-full rounded-xl bg-black/20 border border-white/10 text-white p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400">Category</label>
            <input type="text" required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Food, Rent, Salary..." className="mt-2 block w-full rounded-xl bg-black/20 border border-white/10 text-white p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400">Date</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 block w-full rounded-xl bg-black/20 border border-white/10 text-white p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors" style={{ colorScheme: 'dark' }} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400">Description</label>
            <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2 block w-full rounded-xl bg-black/20 border border-white/10 text-white p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors" />
          </div>

          <div className="flex items-center pt-2">
            <input id="isRecurring" type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-white/10 bg-black/20 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 transition-colors" />
            <label htmlFor="isRecurring" className="ml-3 block text-sm font-medium text-slate-300">Recurring Transaction</label>
          </div>

          {isRecurring && (
            <div>
              <label className="block text-sm font-medium text-slate-400">Frequency</label>
              <select value={recurringFrequency} onChange={(e) => setRecurringFrequency(e.target.value)} className="mt-2 block w-full rounded-xl bg-black/20 border border-white/10 text-white p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors">
                <option value="daily" className="bg-slate-900">Daily</option>
                <option value="weekly" className="bg-slate-900">Weekly</option>
                <option value="monthly" className="bg-slate-900">Monthly</option>
                <option value="yearly" className="bg-slate-900">Yearly</option>
              </select>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 focus:outline-none transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-xl accent-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
