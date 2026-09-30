"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Login from "../components/Login";
import CurrentlyPlaying from "../components/CurrentlyPlaying";
import { BackgroundLines } from "../components/BackgroundLines";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Home() {
  const { data: session } = useSession();
  const [backgroundColors, setBackgroundColors] = useState<string[]>([
    "rgba(128, 128, 128, 0.1)",
  ]);

  const handleColorsExtracted = (colors: string[]) => {
    setBackgroundColors(colors);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white relative">
      <BackgroundLines
        colors={backgroundColors}
        className="absolute inset-0 z-0"
      >
        {/* Full-height column: now playing centred between the navbar and the FAQ at the bottom */}
        <main className="container mx-auto px-4 pt-24 pb-6 min-h-[100dvh] flex flex-col items-center gap-8 relative z-10">
          <div className="flex-1 w-full flex flex-col items-center justify-center">
            <Login />
            {session ? (
              // Narrower on phones so the album colours show around it; capped by height so it fits short laptop screens
              <div className="w-full min-w-[13rem] max-w-[min(16rem,calc(100dvh-440px))] sm:max-w-[min(24rem,calc(100dvh-440px))] lg:max-w-[min(28rem,calc(100dvh-440px))]">
                <CurrentlyPlaying onColorsExtracted={handleColorsExtracted} />
              </div>
            ) : (
              <div className="w-full max-w-md">
                <Image
                  src="/play-nice-color.png"
                  alt="PLAY-NICE Logo"
                  width={300}
                  height={300}
                  className="mx-auto"
                  unoptimized={true}
                />
              </div>
            )}
          </div>
          <Accordion type="single" collapsible className="w-full max-w-md">
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
                Your most played artists and tracks, from the last few weeks to
                the past year
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </main>
      </BackgroundLines>
    </div>
  );
}
