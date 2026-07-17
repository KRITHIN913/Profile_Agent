"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { DiligenceProfile } from "@/types/profile";
import { ProfileDashboard } from "@/components/profile/ProfileDashboard";
import { AnimatedProgress } from "@/components/profile/AnimatedProgress";

export default function ProfilePage() {
  const { job_id } = useParams();
  
  const [phase, setPhase] = useState("pending");
  const [status, setStatus] = useState("running");
  const [message, setMessage] = useState("Connecting to orchestration engine...");
  const [profile, setProfile] = useState<DiligenceProfile | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatusFallback = async () => {
    try {
      const res = await fetch(`/api/profile/status/${job_id}`);
      if (res.ok) {
        const data = await res.json();
        setPhase(data.phase);
        setStatus(data.status);
        
        if (data.phase === "complete" || data.status === "partial_complete") {
          if (data.profile) {
            setProfile(data.profile);
          }
          cleanup();
        }
      }
    } catch (e) {
      console.error("Polling fallback failed:", e);
    }
  };

  const cleanup = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!job_id) return;

    // Connect to SSE stream
    const es = new EventSource(`/api/profile/stream/${job_id}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.phase) setPhase(data.phase);
        if (data.status) setStatus(data.status);
        if (data.message) setMessage(data.message);
        
        if (data.profile) {
          setProfile(data.profile);
        }

        if (data.phase === "complete" || data.status === "partial_complete" || data.status === "failed") {
          cleanup();
        }
      } catch (e) {
        console.error("Failed to parse SSE message", e);
      }
    };

    es.onerror = () => {
      console.warn("SSE connection error, falling back to polling");
      es.close();
      
      if (!fallbackIntervalRef.current) {
        // Fallback to polling every 5s if SSE drops
        fallbackIntervalRef.current = setInterval(fetchStatusFallback, 5000);
        // Do an immediate fetch
        fetchStatusFallback();
      }
    };

    return cleanup;
  }, [job_id]);

  if (profile && (phase === "complete" || status === "partial_complete")) {
    return <ProfileDashboard profile={profile} />;
  }

  // Handle hard failure where no partial profile was retrieved
  if (status === "failed" && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="bg-red-100 p-4 rounded-full inline-flex">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-primary">Generation Failed</h2>
          <p className="text-muted">
            The orchestration pipeline encountered a critical error. 
            {message && <span className="block mt-2 font-mono text-sm">{message}</span>}
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-6 text-sm text-accent hover:underline"
          >
            Return to search
          </button>
        </div>
      </div>
    );
  }

  return <AnimatedProgress phase={phase} status={status} message={message} />;
}
