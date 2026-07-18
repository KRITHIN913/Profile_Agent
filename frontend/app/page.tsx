"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [employer, setEmployer] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<"checking" | "awake" | "sleeping">("checking");

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${baseUrl}/api/health`)
      .then(res => {
        if (res.ok) setServerStatus("awake");
      })
      .catch(() => setServerStatus("sleeping"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${baseUrl}/api/profile/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          context: { employer, location, notes },
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate profile. Please try again.");
      }

      const data = await res.json();
      router.push(`/profile/${data.job_id}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <ShieldCheck className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">
            Diligencify Profile Builder
          </h1>
          <p className="text-lg text-muted max-w-xl mx-auto leading-relaxed">
            AI-assisted due diligence. Instantly surface wealth, affiliations, 
            career history, and concerns for any public figure.
          </p>
        </div>

        <Card className="shadow-card-hover border-transparent">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-primary">
                  Target Name <span className="text-accent">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g. Jane Doe"
                    className="pl-10 h-12 text-base"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="border border-gray-100 rounded-lg overflow-hidden bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setShowContext(!showContext)}
                  className="flex items-center justify-between w-full p-4 text-sm font-medium text-primary hover:bg-gray-100 transition-colors"
                >
                  <span className="flex flex-col items-start">
                    <span>Add context to improve accuracy</span>
                    <span className="text-xs text-muted font-normal mt-0.5">
                      Adding an employer or location prevents mixing up people who share a name.
                    </span>
                  </span>
                  {showContext ? (
                    <ChevronUp className="h-5 w-5 text-muted shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted shrink-0" />
                  )}
                </button>
                
                <AnimatePresence>
                  {showContext && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 space-y-4"
                    >
                      <div className="pt-2">
                        <label htmlFor="employer" className="text-xs font-semibold text-muted uppercase">
                          Employer / Organization
                        </label>
                        <Input
                          id="employer"
                          placeholder="e.g. Acme Corp"
                          value={employer}
                          onChange={(e) => setEmployer(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label htmlFor="location" className="text-xs font-semibold text-muted uppercase">
                          Location
                        </label>
                        <Input
                          id="location"
                          placeholder="e.g. New York, NY"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label htmlFor="notes" className="text-xs font-semibold text-muted uppercase">
                          Additional Notes
                        </label>
                        <Input
                          id="notes"
                          placeholder="e.g. Board member of XYZ Foundation"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium shadow-sm transition-all"
                  disabled={isSubmitting || !name.trim()}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      {serverStatus !== "awake" ? "Waking up intelligence servers (this can take 60s)..." : "Generating Profile..."}
                    </span>
                  ) : (
                    "Generate Profile"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted">
          AI-assisted research — verify independently before use in compliance or investment decisions.
        </p>
      </div>
    </main>
  );
}
