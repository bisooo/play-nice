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
    <div className="flex flex-col items-center justify-between">
      <Login />
      <div className="mb-16">
        <Image
          src="/play-nice-color.png"
          alt="LOGO"
          width={300}
          height={300}
          className="cover"
          unoptimized={true}
        />
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="mb-8">
          <AccordionTrigger>{"WHAT'S PLAY-NICE ?"}</AccordionTrigger>
          <AccordionContent>
            PLAY-NICE is a late night idea about finding interesting music
            listening metrics and having them readily available to view at
            anytime
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" className="mb-8">
          <AccordionTrigger>{"WHAT'S THE DASHBOARD ?"}</AccordionTrigger>
          <AccordionContent>
            The Dashboard fetches interesting stats from your spotify listening
            history and displays them to you
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3" className="mb-8">
          <AccordionTrigger>{"WHAT'S THE SAMPLER ?"}</AccordionTrigger>
          <AccordionContent>
            The Sampler allows you to query spotify with track characteristics
            and genre parameters to get some records that match your query
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
