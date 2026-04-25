import { useAuth } from "../../contexts/AuthContext";
import { LogOut } from "lucide-react";

export default function Header() {
  const { user, logOut } = useAuth();
  
  return (
    <header className="flex h-20 items-center justify-between px-8 bg-transparent">
      <div></div>
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium text-slate-400">
          Welcome back, <span className="text-white">{user?.displayName}</span>
        </div>
        {user?.photoURL && (
          <img src={user.photoURL} alt="Profile" className="h-8 w-8 rounded-full border border-white/10 shadow-sm" />
        )}
        <button
          onClick={logOut}
          className="flex items-center px-4 py-2 glass-card text-white rounded-xl text-sm border border-white/10 hover:bg-white/5 transition-all"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
