import { Switch, Route } from "wouter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/contexts/LanguageContext";
import InvoiceGenerator from "./pages/invoice-generator";
import PDFStamper from "./pages/pdf-stamper";
import Settings from "./pages/settings";

function App() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background font-sans antialiased">
        <Toaster />
        <Switch>
          <Route path="/" component={InvoiceGenerator} />
          <Route path="/stamp-pdf" component={PDFStamper} />
          <Route path="/settings" component={Settings} />
          <Route>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Page Not Found
                </h1>
                <p className="text-muted-foreground mb-4">
                  The page you're looking for doesn't exist.
                </p>
                <Link href="/">
                  <Button>Go Home</Button>
                </Link>
              </div>
            </div>
          </Route>
        </Switch>
      </div>
    </LanguageProvider>
  );
}

export default App;
