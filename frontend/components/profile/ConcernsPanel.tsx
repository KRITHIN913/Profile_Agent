import * as React from "react"
import { ConcernEntry } from "@/types/profile"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { DataPoint } from "@/components/ui/DataPoint"
import { ShieldAlert } from "lucide-react"

export function ConcernsPanel({ concerns }: { concerns: ConcernEntry[] }) {
  if (!concerns || concerns.length === 0) return null

  return (
    <Card className="border-warning/30 shadow-sm bg-warning/5">
      <CardHeader className="pb-3 border-b border-warning/10">
        <CardTitle className="flex items-center gap-2 text-warning">
          <ShieldAlert className="h-6 w-6" />
          Adverse Media & Regulatory Concerns
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {concerns.map((concern, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="shrink-0 mt-1">
              <Badge variant={concern.severity === "high" ? "destructive" : concern.severity === "medium" ? "warning" : "default"}>
                {concern.severity.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-2">
              <DataPoint 
                value={concern.description} 
                valueClassName="text-brand-text font-medium leading-relaxed" 
              />
              <div className="flex flex-wrap gap-2 items-center text-xs text-muted">
                <span className="font-semibold uppercase tracking-wider">Sources:</span>
                {concern.sources.map((src, sIdx) => (
                  <span key={sIdx} className="bg-white px-2 py-1 rounded border border-gray-200 flex items-center gap-1">
                    <a href={src.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline max-w-[200px] truncate">
                      {new URL(src.source_url).hostname}
                    </a>
                    {src.matched_confidence === "unverified" && (
                      <Badge variant="warning" className="ml-1 py-0 px-1 text-[10px]">Unverified</Badge>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
