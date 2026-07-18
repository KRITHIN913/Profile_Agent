import * as React from "react"
import { ConcernEntry } from "@/types/profile"
import { OctagonAlert } from "lucide-react"

export function ConcernsPanel({ concerns }: { concerns: ConcernEntry[] }) {
  if (!concerns || concerns.length === 0) return null

  return (
    <div className="rounded-xl border border-[#efd6c3] bg-[#fbf4ee] shadow-sm mb-8 overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-[#efd6c3]">
        <OctagonAlert className="h-5 w-5 text-[#d96726]" />
        <h3 className="font-semibold text-[#d96726]">Adverse Media & Regulatory Concerns</h3>
      </div>
      
      <div className="p-4 space-y-4">
        {concerns.map((concern, idx) => (
          <div key={idx} className="flex flex-col gap-3">
            <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2 shrink-0 mt-0.5">
                {concern.severity === "high" && (
                  <span className="bg-[#fee2e2] text-[#dc2626] text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider">
                    High
                  </span>
                )}
                {concern.severity === "medium" && (
                  <span className="bg-[#fef08a] text-[#ca8a04] text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider">
                    Medium
                  </span>
                )}
                <span className="bg-[#fce9d3] text-[#d96726] text-[10px] font-semibold px-2 py-0.5 rounded">
                  Unverified
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800 leading-snug">
                {concern.description}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 ml-0 sm:ml-28">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sources:</span>
              {concern.sources.map((src, sIdx) => {
                let hostname = src.source_url
                try {
                  hostname = new URL(src.source_url).hostname
                } catch(e) {}
                
                return (
                  <span key={sIdx} className="bg-white px-2 py-0.5 rounded-sm border border-gray-200 flex items-center gap-1.5 shadow-sm">
                    <a href={src.source_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-gray-600 hover:text-[#d96726] hover:underline truncate max-w-[200px]">
                      {hostname}
                    </a>
                    {src.matched_confidence === "unverified" && (
                      <span className="bg-[#fce9d3] text-[#d96726] text-[9px] font-semibold px-1 rounded">Unverified</span>
                    )}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
