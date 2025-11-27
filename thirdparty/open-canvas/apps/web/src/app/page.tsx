"use client";

import { SessionProvider } from "next-auth/react";
import { Canvas } from "@/components/canvas";
import { AssistantProvider } from "@/contexts/AssistantContext";
import { GraphProvider } from "@/contexts/GraphContext";
import { ThreadProvider } from "@/contexts/ThreadProvider";
import { UserProvider } from "@/contexts/UserContext";
import { Footer } from "@/components/ui/footer";
import { Suspense } from "react";

export default function Home() {
  return (
    <SessionProvider>
      <Suspense>
        <UserProvider>
          <ThreadProvider>
            <AssistantProvider>
              <GraphProvider>
                <div className="flex flex-col h-screen">
                  <div className="flex-1 overflow-hidden">
                    <Canvas />
                  </div>
                  <Footer />
                </div>
              </GraphProvider>
            </AssistantProvider>
          </ThreadProvider>
        </UserProvider>
      </Suspense>
    </SessionProvider>
  );
}
