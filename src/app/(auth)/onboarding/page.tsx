import { OnboardingForm } from "./onboarding-form";
import { Zap } from "lucide-react";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#0F1629] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">DemandVibes</span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Step 1 of 1
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create your workspace</h1>
            <p className="text-sm text-gray-500 mt-1">
              A workspace holds all your connected ad accounts and campaigns.
            </p>
          </div>
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
