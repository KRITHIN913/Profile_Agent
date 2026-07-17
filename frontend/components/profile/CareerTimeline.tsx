"use client"

import * as React from "react"
import { CareerEntry } from "@/types/profile"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { DataPoint } from "@/components/ui/DataPoint"
import { History } from "lucide-react"

export function CareerTimeline({ timeline }: { timeline: CareerEntry[] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Career History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="italic text-muted">Not publicly available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Career History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative border-l border-gray-200 ml-3 space-y-8 pb-4">
          {timeline.map((entry, idx) => (
            <div key={idx} className="relative pl-8">
              {/* Timeline dot */}
              <div className="absolute -left-[5px] top-1.5 h-[10px] w-[10px] rounded-full bg-accent ring-4 ring-white" />
              
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                <DataPoint 
                  value={entry.title} 
                  valueClassName="font-bold text-lg text-primary" 
                />
                <span className="hidden sm:inline text-gray-300">•</span>
                <DataPoint 
                  value={entry.organization} 
                  valueClassName="font-medium text-brand-text" 
                />
              </div>
              
              <div className="text-sm font-mono text-muted mb-2">
                {entry.start_date} — {entry.end_date}
              </div>
              
              <DataPoint 
                value={entry.description} 
                className="text-sm text-gray-600 leading-relaxed" 
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
