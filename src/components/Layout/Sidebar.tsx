import { NavLink } from "react-router-dom";
import { LayoutDashboard, ReceiptText, PieChart, Wallet } from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: ReceiptText },
  { name: "Analytics", href: "/analytics", icon: PieChart },
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-white/5 flex flex-col p-6 dot-grid bg-[#080809]/80">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 rounded-xl accent-gradient flex items-center justify-center font-bold text-white shadow-lg">A</div>
        <span className="text-xl font-bold tracking-tight text-white">AETHER</span>
      </div>
      
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "px-4 py-3 rounded-xl flex items-center gap-3 transition-colors cursor-pointer border border-transparent",
                isActive
                  ? "bg-white/5 text-emerald-400 border-white/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Account Strength</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-4/5"></div>
            </div>
            <span className="text-[10px] text-emerald-400">82%</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
