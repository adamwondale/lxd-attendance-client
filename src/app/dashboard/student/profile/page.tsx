"use client"

import { StudentProfile } from "@/components/StudentProfile"
import { LogOut, ChevronRight } from "lucide-react"

export default function StudentProfilePage() {
  return (
    <div className="p-6 max-w-lg mx-auto space-y-8">
      
      {/* Header Area */}
      <div>
        <h2 className="font-serif text-2xl tracking-tight mb-1">Your Profile</h2>
        <p className="text-[14px] text-[var(--color-muted)] font-sans">Manage your account and preferences.</p>
      </div>

      <section className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
        <StudentProfile />
      </section>

      <section className="space-y-4 pt-4">
        <h3 className="font-sans font-medium text-[15px] px-2">Account Actions</h3>
        
        <div className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
          <ul className="divide-y divide-[var(--color-border)]">
            <li>
              <a href="/api/auth/signout" className="flex items-center justify-between p-4 hover:bg-black/[0.02] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    <LogOut className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="font-medium text-[15px] text-red-600">Sign Out</span>
                </div>
                <ChevronRight className="w-4 h-4 text-black/20 group-hover:text-black/50 transition-colors" />
              </a>
            </li>
          </ul>
        </div>
      </section>

    </div>
  )
}
