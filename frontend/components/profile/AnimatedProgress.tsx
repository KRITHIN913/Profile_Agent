"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, FileText, CheckCircle2, ShieldCheck, Loader2, Sparkles } from "lucide-react"

interface AnimatedProgressProps {
  phase: string
  status: string
  message: string
}

export function AnimatedProgress({ phase, status, message }: AnimatedProgressProps) {
  
  const steps = [
    { id: "researcher", label: "Researcher Agent", description: "Browsing the web and verifying sources", icon: Search },
    { id: "extractor", label: "Extractor Agent", description: "Synthesizing data into a structured profile", icon: FileText },
    { id: "validator", label: "Validator Agent", description: "Enforcing quality and schema validation", icon: ShieldCheck },
  ]

  const currentIndex = Math.max(0, steps.findIndex(s => s.id === phase))
  const progressHeight = `${(currentIndex / (steps.length - 1)) * 100}%`

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId)

    if (stepIndex < currentIndex) return "complete"
    if (stepIndex === currentIndex) {
      if (status === "failed" || status === "partial") return "error"
      return "active"
    }
    return "pending"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-12">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="relative inline-flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent/30 to-primary/30 blur-2xl"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="relative bg-white p-5 rounded-full shadow-xl shadow-accent/10 border border-slate-100 z-10"
            >
              <Sparkles className="w-10 h-10 text-accent animate-pulse" />
            </motion.div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Generating Profile</h2>
            <div className="h-6 overflow-hidden flex justify-center items-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={message}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-slate-500 font-medium"
                >
                  {message || "Initializing orchestration engine..."}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Timeline Card */}
        <div className="bg-white/70 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white relative overflow-hidden">
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
          
          <div className="relative pl-12 space-y-10 z-10">
            {/* Background Track */}
            <div className="absolute left-[1.4rem] top-2 bottom-2 w-[3px] bg-slate-100 rounded-full" />
            
            {/* Animated Fill */}
            <motion.div 
              className="absolute left-[1.4rem] top-2 w-[3px] bg-gradient-to-b from-accent to-primary rounded-full shadow-[0_0_12px_rgba(59,130,246,0.6)]"
              initial={{ height: "0%" }}
              animate={{ height: progressHeight }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />

            {steps.map((step) => {
              const stepStatus = getStepStatus(step.id)
              const Icon = step.icon

              return (
                <div key={step.id} className="relative flex items-start gap-6">
                  {/* Status Node */}
                  <div className="absolute -left-12 top-0 mt-0.5 shrink-0">
                    {stepStatus === "complete" ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-2.5 shadow-lg shadow-green-500/30 ring-4 ring-white relative z-10"
                      >
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </motion.div>
                    ) : stepStatus === "active" ? (
                      <motion.div 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ repeat: Infinity, direction: "reverse", duration: 1 }}
                        className="bg-white rounded-full p-2.5 ring-4 ring-accent/20 shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-accent/20 relative z-10"
                      >
                        <Loader2 className="w-5 h-5 text-accent animate-spin" />
                      </motion.div>
                    ) : stepStatus === "error" ? (
                      <div className="bg-red-500 rounded-full p-2.5 ring-4 ring-white shadow-lg shadow-red-500/30 relative z-10">
                        <div className="w-5 h-5 text-white flex items-center justify-center font-bold text-lg">!</div>
                      </div>
                    ) : (
                      <div className="bg-slate-100 rounded-full p-2.5 ring-4 ring-white border border-slate-200 relative z-10 transition-colors duration-500">
                        <Icon className="w-5 h-5 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className={`transition-all duration-500 ${
                    stepStatus === "active" ? "scale-105 origin-left" : "scale-100 opacity-70"
                  }`}>
                    <h3 className={`text-lg font-bold ${
                      stepStatus === "complete" ? "text-slate-800" : 
                      stepStatus === "active" ? "text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary" : 
                      "text-slate-400"
                    }`}>
                      {step.label}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      stepStatus === "active" ? "text-slate-600" : "text-slate-400"
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  )
}
