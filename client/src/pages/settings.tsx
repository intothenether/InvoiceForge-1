import { FileText, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BusinessSettings } from "@/components/business-settings";
import { ClientManagement } from "@/components/client-management";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Settings() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">
                Settings
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Application Settings</h2>
            <p className="text-muted-foreground">
              Manage your business information, client data, and application preferences.
            </p>
          </div>
          
          <BusinessSettings />
          
          <ClientManagement />
        </div>
      </main>
    </div>
  );
}
