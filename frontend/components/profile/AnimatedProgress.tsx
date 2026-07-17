"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, FileText, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react"

interface AnimatedProgressProps {
  phase: string
  status: string
  message: string
}

export function AnimatedProgress({ phase, status, message }: AnimatedProgressProps) {
  
  const steps = [
    { id: "researcher", label: "Researcher Agent", icon: Search },
    { id: "extractor", label: "Extractor Agent", icon: FileText },
    { id: "validator", label: "Validator Agent", icon: ShieldCheck },
  ]

  const getStepStatus = (stepId: string) => {
    const currentIndex = steps.findIndex(s => s.id === phase)
    const stepIndex = steps.findIndex(s => s.id === stepId)

    if (stepIndex < currentIndex) return "complete"
    if (stepIndex === currentIndex) {
      if (status === "failed" || status === "partial") return "error"
      return "active"
    }
    return "pending"
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-12">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="inline-flex bg-primary/10 p-4 rounded-full mb-2"
          >
            <ShieldCheck className="w-10 h-10 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Generating Profile...</h2>
          <p className="text-muted h-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={message}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="block"
              >
                {message || "Initializing agents..."}
              </motion.span>
            </AnimatePresence>
          </p>
        </div>

        <div className="space-y-6 bg-white p-8 rounded-2xl shadow-card border border-gray-100">
          {steps.map((step, idx) => {
            const stepStatus = getStepStatus(step.id)
            const Icon = step.icon

            return (
              <div key={step.id} className="relative flex items-center gap-4">
                {/* Connecting Line */}
                {idx !== steps.length - 1 && (
                  <div className="absolute left-[1.125rem] top-10 bottom-[-1.5rem] w-[2px] bg-gray-100" />
                )}

                {/* Status Icon */}
                <div className="relative z-10 shrink-0">
                  {stepStatus === "complete" ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-success rounded-full p-2"
                    >
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </motion.div>
                  ) : stepStatus === "active" ? (
                    <div className="bg-accent/20 rounded-full p-2 ring-4 ring-accent/10">
                      <Loader2 className="w-5 h-5 text-accent animate-spin" />
                    </div>
                  ) : stepStatus === "error" ? (
                    <div className="bg-red-100 rounded-full p-2">
                      <div className="w-5 h-5 text-red-600 rounded-full border-2 border-current flex items-center justify-center font-bold text-xs">!</div>
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-full p-2">
                      <Icon className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className={`text-lg font-medium transition-colors duration-300 ${
                  stepStatus === "complete" ? "text-primary" : 
                  stepStatus === "active" ? "text-accent font-semibold" : 
                  "text-gray-400"
                }`}>
                  {step.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
