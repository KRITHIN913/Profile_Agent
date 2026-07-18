import * as React from "react"
import { DiligenceProfile } from "@/types/profile"
import { Building2, MapPin, Briefcase, User } from "lucide-react"

export function ProfileHeader({ profile }: { profile: DiligenceProfile }) {
  return (
    <div className="space-y-4">
      {/* Executive Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-[6px] border-t-[#0a2540] overflow-hidden">
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-4">
            {profile.profile_image_url ? (
              <img 
                src={profile.profile_image_url} 
                alt={profile.name} 
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-4 border-gray-100 shadow-sm"
              />
            ) : (
              <div className="bg-[#fbf4ee] p-3 rounded-full shrink-0">
                <User className="h-8 w-8 text-[#c28d27]" />
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0a2540] tracking-tight">{profile.name}</h1>
          </div>
          <p className={`text-gray-700 leading-relaxed text-[15px] ${profile.executive_summary === 'Not publicly available' ? 'italic text-muted' : ''}`}>
            {profile.executive_summary === 'Not publicly available' ? 'No data found' : profile.executive_summary}
          </p>
        </div>
      </div>

      {/* Basic Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Primary Role */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="bg-gray-100/80 p-2.5 rounded-full shrink-0">
            <Briefcase className="h-5 w-5 text-[#4a5568]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Primary Role</span>
            <span className={`text-[15px] font-medium ${profile.basic_details.role === 'Not publicly available' ? 'italic text-gray-400' : 'text-gray-800'}`}>
              {profile.basic_details.role === 'Not publicly available' ? 'No data found' : profile.basic_details.role}
            </span>
          </div>
        </div>
        
        {/* Organization */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="bg-gray-100/80 p-2.5 rounded-full shrink-0">
            <Building2 className="h-5 w-5 text-[#4a5568]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Organization</span>
            <span className={`text-[15px] font-medium ${profile.basic_details.organization === 'Not publicly available' ? 'italic text-gray-400' : 'text-gray-800'}`}>
              {profile.basic_details.organization === 'Not publicly available' ? 'No data found' : profile.basic_details.organization}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="bg-gray-100/80 p-2.5 rounded-full shrink-0">
            <MapPin className="h-5 w-5 text-[#4a5568]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Location</span>
            <span className={`text-[15px] font-medium ${profile.basic_details.location === 'Not publicly available' ? 'italic text-gray-400' : 'text-gray-800'}`}>
              {profile.basic_details.location === 'Not publicly available' ? 'No data found' : profile.basic_details.location}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
