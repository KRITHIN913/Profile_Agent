import * as React from "react"
import { MasterSource } from "@/types/profile"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { FileText, ExternalLink } from "lucide-react"

export function SourcesPanel({ sources }: { sources: MasterSource[] }) {
  if (!sources || sources.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Master Sources List
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Source / Title</th>
                <th className="px-4 py-3">Credibility</th>
                <th className="px-4 py-3 rounded-tr-lg">Retrieved At</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src, idx) => (
                <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-brand-text truncate max-w-[400px]" title={src.title}>
                        {src.title}
                      </span>
                      <a 
                        href={src.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 mt-0.5 truncate max-w-[400px]"
                      >
                        {src.domain}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={
                      src.credibility_tier === "primary" ? "default" :
                      src.credibility_tier === "reputable_media" ? "outline" : "outline"
                    }>
                      {src.credibility_tier.replace("_", " ")}
                    </Badge>
                    {!src.accessible && (
                       <Badge variant="destructive" className="ml-2">Inaccessible</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-muted text-xs">
                    {new Date(src.retrieved_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
