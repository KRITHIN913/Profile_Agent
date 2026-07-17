import * as React from "react"
import { NetWorth } from "@/types/profile"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { DataPoint } from "@/components/ui/DataPoint"
import { AlertTriangle, DollarSign } from "lucide-react"

export function NetWorthCard({ netWorth }: { netWorth: NetWorth }) {
  const isMissing = netWorth.value === "Not publicly available"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-success" />
          Wealth Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {netWorth.is_conflicting && netWorth.conflict_note && (
          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-warning">Conflicting Data Detected</h4>
              <p className="text-sm text-warning/90 mt-1 leading-relaxed">
                {netWorth.conflict_note}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end gap-6">
          <DataPoint 
            label="Estimated Value" 
            value={isMissing ? netWorth.value : `${netWorth.currency} ${netWorth.value}`}
            valueClassName="text-3xl font-bold text-success tracking-tight"
          />
          {!isMissing && (
            <DataPoint 
              label="As of" 
              value={netWorth.as_of_date} 
              valueClassName="text-lg font-medium"
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
