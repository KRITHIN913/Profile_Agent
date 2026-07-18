import * as React from "react"
import { NetWorth } from "@/types/profile"
import { AlertTriangle, DollarSign } from "lucide-react"

export function NetWorthCard({ netWorth }: { netWorth: NetWorth }) {
  const isMissing = netWorth.value === "Not publicly available"

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="p-6 sm:p-8 space-y-6 flex-grow">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-[#38A169]" />
          <h2 className="text-lg font-bold text-[#0a2540]">Wealth Profile</h2>
        </div>
        
        {netWorth.is_conflicting && netWorth.conflict_note && (
          <div className="flex items-start gap-3 p-3 bg-[#fef7f2] border border-[#efd6c3] rounded-lg">
            <AlertTriangle className="h-4 w-4 text-[#d96726] shrink-0 mt-0.5" />
            <p className="text-xs text-[#d96726] leading-relaxed">
              <span className="font-bold block mb-1">Conflicting Data</span>
              {netWorth.conflict_note}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Estimated Value</span>
            <span className={`text-[15px] font-bold ${isMissing ? 'text-gray-500' : 'text-[#38A169]'}`}>
              {isMissing ? 'No data found' : `${netWorth.currency} ${netWorth.value}`}
            </span>
          </div>
          
          {!isMissing && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">As Of</span>
              <span className="text-[15px] font-medium text-gray-800">
                {netWorth.as_of_date}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
