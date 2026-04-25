import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#080809] text-slate-200 font-sans overflow-hidden relative">
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-50px] right-[-50px] w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[100px]"></div>

      <div className="flex h-full w-full relative z-10">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
