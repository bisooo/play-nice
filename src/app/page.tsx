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
        <main className="flex-grow container mx-auto px-4 py-8 mt-10 relative z-10">
          <div className="flex flex-col items-center space-y-8">
            <Login />
            <div className="w-full max-w-md">
              {session ? (
                <CurrentlyPlaying onColorsExtracted={handleColorsExtracted} />
              ) : (
                <Image
                  src="/play-nice-color.png"
                  alt="PLAY-NICE Logo"
                  width={300}
                  height={300}
                  className="mx-auto"
                  unoptimized={true}
                />
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
                  {"WHAT'S THE DASHBOARD ?"}
                </AccordionTrigger>
                <AccordionContent className="text-center px-4">
                  The Dashboard fetches interesting stats from your spotify
                  listening history and displays them to you
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="mb-4">
                <AccordionTrigger className="flex-center">
                  {"WHAT'S THE SAMPLER ?"}
                </AccordionTrigger>
                <AccordionContent className="text-center px-4">
                  The Sampler allows you to query spotify with track
                  characteristics and genre parameters to get some records that
                  match your query
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </main>
      </BackgroundLines>
    </div>
  );
}
