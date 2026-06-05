import { Header } from "@/components/layout/header";
import { AIChat } from "./ai-chat";
import { mockCampaigns } from "@/lib/mock-data";

export default function AIAssistantPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="AI Assistant"
        description="Ask questions about your campaigns and get optimization recommendations"
      />
      <div className="flex-1 overflow-hidden">
        <AIChat campaigns={mockCampaigns} />
      </div>
    </div>
  );
}
