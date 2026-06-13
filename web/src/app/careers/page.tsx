"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { motion } from "framer-motion"
import { HeadingLg, HeadingMd, BodyMd, LabelMd } from "@/components/ui/typography"
import { PatternOverlay } from "@/components/ui/pattern-overlay"
import { Button } from "@/components/ui/button"
import { Briefcase, MapPin, Globe } from "lucide-react"

export default function CareersPage() {
  const jobs = [
    { title: "Senior Logistics Engineer", location: "Kabul / Remote", type: "Full-time" },
    { title: "Product Designer (UI/UX)", location: "Kabul", type: "Full-time" },
    { title: "Operations Manager", location: "Herat", type: "Full-time" },
    { title: "Customer Success Lead", location: "Kabul", type: "Full-time" },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main id="main-content" className="flex-1">
        <section className="relative pt-48 pb-32 px-4 overflow-hidden">
          <div className="container mx-auto">
            <div className="max-w-4xl space-y-12 mb-24">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-[1px] w-12 bg-primary/30" />
                  <LabelMd>Join the Mission</LabelMd>
                </div>
                <HeadingLg className="text-6xl md:text-8xl font-black leading-[0.9] mb-12">
                  Build the <br/><span className="text-primary italic">Future of Motion.</span>
                </HeadingLg>
                <BodyMd className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                  We are looking for visionaries, engineers, and operators to help us redefine logistics in Afghanistan and beyond.
                </BodyMd>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {jobs.map((job, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-3xl border bg-card/50 hover:border-primary/50 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{job.title}</h3>
                    <div className="flex items-center gap-4 text-muted-foreground text-sm">
                       <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                       <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {job.type}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-full px-8 border-primary/20 hover:bg-primary hover:text-white transition-all">
                    Apply Now
                  </Button>
                </motion.div>
              ))}
            </div>

            <div className="mt-32 p-12 rounded-[3rem] bg-primary/5 text-center space-y-8 border border-primary/10">
               <Globe className="h-12 w-12 text-primary mx-auto opacity-50" />
               <HeadingMd>Don&apos;t see a perfect fit?</HeadingMd>
               <BodyMd className="max-w-xl mx-auto">
                 We&apos;re always looking for exceptional talent. Send your resume to <span className="font-bold text-primary">careers@noori.af</span> and we&apos;ll keep you in mind for future openings.
               </BodyMd>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-[0.02] pointer-events-none">
            <PatternOverlay />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
