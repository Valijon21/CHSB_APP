'use client';

import React, { useState, useEffect } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { DynamicDashboard } from '@/components/dashboard/DynamicDashboard';
import type { AIAnalysisResponse } from '@/lib/ai-engine';

export default function Home() {
  const [response, setResponse] = useState<AIAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial overview dashboard on mount
  useEffect(() => {
    handleSendPrompt('Umumiy maktablar va CHSB ko‘rsatkichlarini ko‘rsat');
  }, []);

  const handleSendPrompt = async (prompt: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error('API xatosi');
      }

      const json = await res.json();
      setResponse(json);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden bg-slate-950">
      <ChatSidebar onSendPrompt={handleSendPrompt} isLoading={isLoading} />
      <DynamicDashboard response={response} onSelectPrompt={handleSendPrompt} />
    </main>
  );
}
