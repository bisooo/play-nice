"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecordDigger } from "@/components/RecordDigger";
import { RecordAnalysis } from "@/components/RecordAnalysis";

const Sampler: React.FC = () => {
  const [activeTab, setActiveTab] = useState("record-digger");

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pt-24">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value)}
        className="w-full"
      >
        <TabsList className="mb-8 h-12 p-1 flex items-center justify-center">
          <TabsTrigger
            value="record-digger"
            className="flex-1 h-full flex items-center justify-center text-xs sm:text-sm md:text-base"
          >
            RECORD DIGGER
          </TabsTrigger>
          <TabsTrigger
            value="tempo-key"
            className="flex-1 h-full flex items-center justify-center text-xs sm:text-sm md:text-base"
          >
            RECORD ANALYSIS
          </TabsTrigger>
        </TabsList>
        <TabsContent value="record-digger">
          <RecordDigger />
        </TabsContent>
        <TabsContent value="tempo-key">
          <RecordAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Sampler;
