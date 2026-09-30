"use client";

import { useEffect, useRef, useState } from "react";
import CurrentlyPlaying from "../components/CurrentlyPlaying";
import { BackgroundLines } from "../components/BackgroundLines";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Home() {
  const [backgroundColors, setBackgroundColors] = useState<string[]>([
    "rgba(128, 128, 128, 0.1)",
  ]);

  const handleColorsExtracted = (colors: string[]) => {
    setBackgroundColors(colors);
  };

  // The card is laid out for the space it has with every FAQ answer closed (--fit-h), and an open
  // answer only scales it down (transform), so it zooms smoothly with the accordion instead of
  // reflowing every frame (which made the title resize and jump)
  const areaRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const area = areaRef.current;
    const card = cardRef.current;
    const faq = faqRef.current;
    if (!area || !card || !faq) return;
    const fit = () => {
      const answers = Array.from(faq.querySelectorAll<HTMLElement>("[role=region]"));
      const answersHeight = answers.reduce((sum, el) => sum + el.offsetHeight, 0);
      const fitHeight = area.clientHeight + answersHeight;
      area.style.setProperty("--fit-h", `${fitHeight}px`);
      // Shrink only once the card no longer fits, keeping the gap it had around it with the FAQ
      // closed (up to 16px), so it never hops when the scaling starts or stops
      const gap = Math.min(16, fitHeight - card.offsetHeight);
      const scale = Math.min(1, (area.clientHeight - gap) / card.offsetHeight);
      card.style.transform = scale < 1 ? `scale(${scale})` : "";
    };
    const observer = new ResizeObserver(fit);
    observer.observe(area);
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-black text-white relative">
      <BackgroundLines
        colors={backgroundColors}
        className="absolute inset-0 z-0"
      >
        {/* Exactly one screen tall, never scrolls: now playing is centred between the navbar and the FAQ,
            sized to the space left with the FAQ closed (--fit-h, 100cqh until measured) and scaled down while an answer is open.
            Top padding = navbar (84px) + the gap above the FAQ, so the space above and below match */}
        <main className="container mx-auto px-4 pt-[7.25rem] pb-6 h-[100dvh] flex flex-col items-center gap-8 [@media(max-height:700px)]:pt-[6.25rem] [@media(max-height:700px)]:gap-4 relative z-10">
          <div ref={areaRef} className="flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-2 [container-type:size] [--fit-h:100cqh]">
            {/* Phones: a wide frosted card (room for the names) around a smaller cover (--art-max), capped by
                the height left so it never scrolls. Larger screens: the cover fills the card, which is ~140px taller than wide. */}
            <div ref={cardRef} className="w-full max-w-[21rem] [--art-max:max(9rem,min(15rem,calc(var(--fit-h)-170px)))] sm:min-w-[11rem] sm:max-w-[min(24rem,calc(var(--fit-h)-140px))] sm:[--art-max:100%] lg:max-w-[min(28rem,calc(var(--fit-h)-140px))]">
              <CurrentlyPlaying onColorsExtracted={handleColorsExtracted} />
            </div>
          </div>
          <Accordion ref={faqRef} type="single" collapsible className="w-full max-w-md">
            <AccordionItem value="item-1" className="mb-4">
              <AccordionTrigger className="flex-center">
                {"WHAT'S PLAY-NICE ?"}
              </AccordionTrigger>
              <AccordionContent className="text-center px-4">
                PLAY-NICE is a late night idea about finding interesting music
                listening metrics and having them readily available to view at
                anytime
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="mb-4">
              <AccordionTrigger className="flex-center">
                {"WHAT'S ON REPEAT ?"}
              </AccordionTrigger>
              <AccordionContent className="text-center px-4">
                My most played artists and tracks, from the last few weeks to
                the past year
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </main>
      </BackgroundLines>
    </div>
  );
}
