import * as React from "react"
import { DiligenceProfile } from "@/types/profile"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { DataPoint } from "@/components/ui/DataPoint"
import { Building2, MapPin, Briefcase, User } from "lucide-react"

export function ProfileHeader({ profile }: { profile: DiligenceProfile }) {
  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-accent" />
            {profile.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataPoint 
            value={profile.executive_summary} 
            className="text-lg leading-relaxed text-brand-text/90"
          />
        </CardContent>
      </Card>

      {/* Basic Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <DataPoint label="Primary Role" value={profile.basic_details.role} />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <DataPoint label="Organization" value={profile.basic_details.organization} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <DataPoint label="Location" value={profile.basic_details.location} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
