"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, ChartNoAxesCombined, FileDown, HeartPulse, type LucideIcon } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CAPABILITIES: Array<{ title: string; description: string; detail: string; icon: LucideIcon }> = [
  { title: "Spending patterns", description: "See where the week changed direction.", detail: "Compare weekly activity and category distribution using only the transactions recorded in your account.", icon: ChartNoAxesCombined },
  { title: "Financial health", description: "Read the signals behind the balance.", detail: "Bring budgets, savings progress, obligations, debt, and cash flow into one understandable health view.", icon: HeartPulse },
  { title: "Reports you can keep", description: "Take your records beyond the dashboard.", detail: "Download reports and account data for your own review without exposing passwords or private credentials.", icon: FileDown },
];

export default function LandingExperience({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [activeCapability, setActiveCapability] = useState(0);

  useGSAP(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.from("[data-hero-reveal]", { opacity: 0, y: 28, duration: 0.9, stagger: 0.1, ease: "power3.out" });
    gsap.utils.toArray<HTMLElement>("[data-feature-card]").forEach((card, index) => {
      gsap.from(card, { opacity: 0, y: 42, duration: 0.8, delay: index * 0.04, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 86%", once: true } });
    });
    const formulaWords = gsap.utils.toArray<HTMLElement>("[data-formula-word]");
    gsap.set(formulaWords, { opacity: 0.14 });
    gsap.to(formulaWords, { opacity: 1, stagger: 0.12, ease: "none", scrollTrigger: { trigger: "[data-formula-reveal]", start: "top 76%", end: "bottom 42%", scrub: true } });
    const desktop = gsap.matchMedia();
    desktop.add("(min-width: 1024px)", () => {
      const section = root.current?.querySelector<HTMLElement>("[data-story-section]");
      const copy = root.current?.querySelector<HTMLElement>("[data-story-copy]");
      if (!section || !copy) return;
      ScrollTrigger.create({ trigger: section, start: "top top", end: "bottom bottom", pin: copy, pinSpacing: false, anticipatePin: 1 });
    });
    return () => desktop.revert();
  }, { scope: root });

  return (
    <div ref={root}>
      {children}
      <section id="insights" className="border-y border-[#173d31]/12 bg-[#e8efe8] px-5 py-28 text-[#10231d] dark:border-white/10 dark:bg-[#10251e] dark:text-[#f1f5f0] sm:px-8 md:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl lg:text-6xl">Your records should tell you something useful.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#49645a] dark:text-[#b9c8c0]">Casha-Ba turns the activity you record into clear patterns, health signals, and reports you can review.</p>
          </div>
          <div className="mt-16 flex min-h-[30rem] flex-col gap-3 md:flex-row">
            {CAPABILITIES.map((capability, index) => {
              const Icon = capability.icon;
              const active = activeCapability === index;
              return (
                <button key={capability.title} type="button" aria-expanded={active} onClick={() => setActiveCapability(index)} onFocus={() => setActiveCapability(index)} onMouseEnter={() => setActiveCapability(index)} className={`group flex min-h-48 flex-col overflow-hidden rounded-[1.75rem] border p-6 text-left transition-[flex,background-color,transform] duration-700 ease-[cubic-bezier(.16,1,.3,1)] active:scale-[0.99] md:min-h-[30rem] ${active ? "flex-[2.2] border-[#17694d]/30 bg-[#17694d] text-white" : "flex-1 border-[#173d31]/12 bg-[#f6f8f4] text-[#173d31] hover:-translate-y-1 dark:border-white/10 dark:bg-[#183128] dark:text-[#e7eee9]"}`}>
                  <div className="flex items-center justify-between"><Icon size={25} strokeWidth={1.75} aria-hidden="true" /><ArrowUpRight className={`transition duration-500 ${active ? "rotate-45" : "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"}`} size={20} strokeWidth={1.75} aria-hidden="true" /></div>
                  <div className="mt-auto pt-12">
                    <h3 className="max-w-md text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{capability.title}</h3>
                    <p className={`mt-3 max-w-sm text-sm leading-6 ${active ? "text-[#dcebe3]" : "text-[#5d7068] dark:text-[#aabbb2]"}`}>{capability.description}</p>
                    <p className={`grid max-w-lg transition-all duration-500 ${active ? "mt-6 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}><span className="overflow-hidden text-base leading-7 text-[#edf6f1]">{capability.detail}</span></p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
