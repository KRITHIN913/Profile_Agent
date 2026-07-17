import * as React from "react"
import { EducationEntry, PhilanthropyEntry, AffiliationEntry } from "@/types/profile"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { DataPoint } from "@/components/ui/DataPoint"
import { GraduationCap, HeartHandshake, Users } from "lucide-react"

export function EntityGrids({ 
  education, 
  philanthropy, 
  affiliations 
}: { 
  education: EducationEntry[]
  philanthropy: PhilanthropyEntry[]
  affiliations: AffiliationEntry[] 
}) {
  return (
    <div className="space-y-6">
      
      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Education
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!education || education.length === 0 ? (
            <p className="italic text-muted">Not publicly available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {education.map((edu, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <DataPoint value={edu.degree} valueClassName="font-semibold text-primary" />
                  <DataPoint value={edu.institution} className="mt-1" />
                  <DataPoint value={edu.year} className="mt-2 text-sm text-muted font-mono" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Affiliations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Board & Corporate Affiliations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!affiliations || affiliations.length === 0 ? (
            <p className="italic text-muted">Not publicly available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {affiliations.map((aff, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <DataPoint value={aff.entity} valueClassName="font-semibold text-primary" />
                  <DataPoint label="Relationship" value={aff.relationship_type} className="mt-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Philanthropy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-primary" />
            Philanthropy & Foundations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!philanthropy || philanthropy.length === 0 ? (
            <p className="italic text-muted">Not publicly available</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {philanthropy.map((phil, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <DataPoint value={phil.organization} valueClassName="font-semibold text-primary" />
                    <DataPoint label="Role" value={phil.role} className="mt-2" />
                  </div>
                  <div className="flex-[2]">
                    <DataPoint value={phil.notes} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
