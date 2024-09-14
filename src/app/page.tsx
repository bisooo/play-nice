import Image from "next/image";
import Login from "../components/Login";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen p-4">
      <div className="flex flex-col items-center space-y-4">
        <Login />
        <div>
          <Image
            src="/play-nice-color.png"
            alt="PLAY-NICE Logo"
            width={300}
            height={300}
            className="cover"
            unoptimized={true}
          />
        </div>
      </div>
      <Accordion
        type="single"
        collapsible
        className="w-full max-w-md mx-auto mt-8"
      >
        <AccordionItem value="item-1" className="mb-4">
          <div className="flex justify-center">
            <AccordionTrigger className="text-center">
              {"WHAT'S PLAY-NICE ?"}
            </AccordionTrigger>
          </div>
          <AccordionContent className="text-center px-4">
            PLAY-NICE is a late night idea about finding interesting music
            listening metrics and having them readily available to view at
            anytime
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" className="mb-4">
          <div className="flex justify-center">
            <AccordionTrigger className="text-center">
              {"WHAT'S THE DASHBOARD ?"}
            </AccordionTrigger>
          </div>
          <AccordionContent className="text-center px-4">
            The Dashboard fetches interesting stats from your spotify listening
            history and displays them to you
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3" className="mb-4">
          <div className="flex justify-center">
            <AccordionTrigger className="text-center">
              {"WHAT'S THE SAMPLER ?"}
            </AccordionTrigger>
          </div>
          <AccordionContent className="text-center px-4">
            The Sampler allows you to query spotify with track characteristics
            and genre parameters to get some records that match your query
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
