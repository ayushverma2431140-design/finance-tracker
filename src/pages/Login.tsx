import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Wallet } from "lucide-react";

export default function Login() {
  const { user, signIn } = useAuth();

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080809] px-4 overflow-hidden relative">
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-50px] right-[-50px] w-[300px] h-[300px] bg-violet-600/20 rounded-full blur-[100px]"></div>
      
      <div className="glass-card w-full max-w-md space-y-8 rounded-3xl p-10 text-center relative z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Wallet className="h-8 w-8 text-white" />
          </div>
        </div>
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">FinanceApp</h2>
          <p className="mt-3 text-sm text-slate-400">Track expenses, plan budgets, and visualize your financial journey.</p>
        </div>
        <button
          onClick={signIn}
          className="group relative flex w-full justify-center rounded-xl accent-gradient px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
