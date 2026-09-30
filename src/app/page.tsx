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
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-black text-white relative">
      <BackgroundLines
        colors={backgroundColors}
        className="absolute inset-0 z-0"
      >
        {/* Exactly one screen tall, never scrolls: now playing is centred between the navbar and the FAQ,
            and sizes itself to the space left (cqh), so it shrinks while an FAQ answer is open.
            Top padding = navbar (84px) + the gap above the FAQ, so the space above and below match */}
        <main className="container mx-auto px-4 pt-[7.25rem] pb-6 h-[100dvh] flex flex-col items-center gap-8 [@media(max-height:700px)]:pt-[6.25rem] [@media(max-height:700px)]:gap-4 relative z-10">
          <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-2 [container-type:size]">
            {session ? (
              // Phones: a wide frosted card (room for the names) around a smaller cover (--art-max), capped by
              // the height left so it never scrolls. Larger screens: the cover fills the card, which is ~140px taller than wide.
              <div className="w-full max-w-[21rem] [--art-max:max(9rem,min(15rem,calc(100cqh-170px)))] sm:min-w-[11rem] sm:max-w-[min(24rem,calc(100cqh-140px))] sm:[--art-max:100%] lg:max-w-[min(28rem,calc(100cqh-140px))]">
                <CurrentlyPlaying onColorsExtracted={handleColorsExtracted} />
              </div>
            ) : (
              <div className="w-full max-w-md min-h-0">
                <Image
                  src="/play-nice-color.png"
                  alt="PLAY-NICE Logo"
                  width={300}
                  height={300}
                  className="mx-auto w-auto h-auto max-w-[300px] max-h-[calc(100cqh-6rem)]"
                  unoptimized={true}
                />
              </div>
            )}
            {/* Below the logo (or the card, if the session expired) so the group stays centred */}
            <Login />
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
