import { useState } from "react";
import { Archive, Mail, Download, CheckCircle2, FileText, Send } from "lucide-react";
import JSZip from "jszip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export interface ProcessedBatchFile {
  name: string;
  pdfBase64: string;
}

interface BatchCompressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  processedFiles: ProcessedBatchFile[];
}

export function BatchCompressDialog({
  isOpen,
  onClose,
  processedFiles,
}: BatchCompressDialogProps) {
  const { toast } = useToast();
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSubject, setEmailSubject] = useState(
    `Stamped Invoices - ${new Date().toLocaleDateString()}`
  );
  const [emailBody, setEmailBody] = useState(
    `Hello,\n\nPlease find attached the stamped invoices archive.\n\nBest regards.`
  );
  const [archiveFilename, setArchiveFilename] = useState(
    `stamped_invoices_${new Date().toISOString().split("T")[0]}.zip`
  );
  const [isCompressing, setIsCompressing] = useState(false);

  // Helper to generate JSZip blob
  const createZipBlob = async (): Promise<Blob> => {
    const zip = new JSZip();

    for (const file of processedFiles) {
      // Strip data uri prefix if present
      const cleanBase64 = file.pdfBase64.includes(",")
        ? file.pdfBase64.split(",")[1]
        : file.pdfBase64;

      zip.file(file.name, cleanBase64, { base64: true });
    }

    return await zip.generateAsync({ type: "blob" });
  };

  // Action 1: Just download the compressed ZIP/RAR archive
  const handleDownloadArchive = async () => {
    if (processedFiles.length === 0) return;

    setIsCompressing(true);
    try {
      const zipBlob = await createZipBlob();

      // Trigger download
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = archiveFilename.endsWith(".zip") || archiveFilename.endsWith(".rar")
        ? archiveFilename
        : `${archiveFilename}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Archive Created!",
        description: `Downloaded ${archiveFilename} containing ${processedFiles.length} invoices.`,
      });
    } catch (error) {
      console.error("Error creating archive:", error);
      toast({
        title: "Compression Failed",
        description: "Failed to create compressed archive file.",
        variant: "destructive",
      });
    } finally {
      setIsCompressing(false);
    }
  };

  // Action 2: Compress archive AND open email client / share
  const handleCompressAndEmail = async () => {
    if (processedFiles.length === 0) return;

    setIsCompressing(true);
    try {
      const zipBlob = await createZipBlob();
      const filename = archiveFilename.endsWith(".zip") || archiveFilename.endsWith(".rar")
        ? archiveFilename
        : `${archiveFilename}.zip`;

      const fileToShare = new File([zipBlob], filename, {
        type: "application/zip",
      });

      // Check Web Share API (Mobile / Safari)
      if (
        navigator.canShare &&
        navigator.canShare({ files: [fileToShare] })
      ) {
        try {
          await navigator.share({
            title: emailSubject,
            text: emailBody,
            files: [fileToShare],
          });

          toast({
            title: "Archive Shared!",
            description: "Archive successfully opened in your share/email app.",
          });
          onClose();
          return;
        } catch (shareErr) {
          console.warn("Web Share failed, falling back to download & mailto:", shareErr);
        }
      }

      // Fallback for Desktop / Standard Browsers:
      // 1. Download the zip archive file
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 2. Open mailto link pre-filled with subject, recipient, body, and reminder to attach file
      const mailtoBody = `${emailBody}\n\n[Note: Please attach the downloaded file '${filename}']`;
      const mailtoUrl = `mailto:${encodeURIComponent(emailRecipient)}?subject=${encodeURIComponent(
        emailSubject
      )}&body=${encodeURIComponent(mailtoBody)}`;

      window.location.href = mailtoUrl;

      toast({
        title: "Archive Downloaded & Email Opened",
        description: `Downloaded ${filename}. Your email app has opened—please attach the archive file.`,
      });

      onClose();
    } catch (error) {
      console.error("Error in compress & email:", error);
      toast({
        title: "Action Failed",
        description: "Failed to prepare compressed archive.",
        variant: "destructive",
      });
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-6 w-6" />
            <DialogTitle>Batch Stamping Complete!</DialogTitle>
          </div>
          <DialogDescription>
            Successfully processed {processedFiles.length} PDF invoice{processedFiles.length !== 1 ? 's' : ''}.
            Compress into an archive (.zip/.rar) to download or send by email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File Summary */}
          <div className="bg-muted p-3 rounded-lg text-xs space-y-1">
            <div className="flex justify-between font-medium text-foreground">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Invoices Stamped:
              </span>
              <span className="font-semibold">{processedFiles.length} files</span>
            </div>
          </div>

          {/* Archive Filename */}
          <div className="space-y-1">
            <Label htmlFor="archive-filename" className="text-xs">
              Archive File Name
            </Label>
            <Input
              id="archive-filename"
              value={archiveFilename}
              onChange={(e) => setArchiveFilename(e.target.value)}
              placeholder="stamped_invoices.zip"
              className="h-9 text-xs"
            />
          </div>

          {/* Email Recipient */}
          <div className="space-y-1">
            <Label htmlFor="email-recipient" className="text-xs">
              Recipient Email (Optional)
            </Label>
            <Input
              id="email-recipient"
              type="email"
              value={emailRecipient}
              onChange={(e) => setEmailRecipient(e.target.value)}
              placeholder="client@example.com"
              className="h-9 text-xs"
            />
          </div>

          {/* Email Subject */}
          <div className="space-y-1">
            <Label htmlFor="email-subject" className="text-xs">
              Email Subject
            </Label>
            <Input
              id="email-subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Stamped Invoices"
              className="h-9 text-xs"
            />
          </div>

          {/* Email Body */}
          <div className="space-y-1">
            <Label htmlFor="email-body" className="text-xs">
              Email Message
            </Label>
            <Textarea
              id="email-body"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={3}
              className="text-xs resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadArchive}
            disabled={isCompressing}
            className="w-full sm:w-auto text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download Archive
          </Button>

          <Button
            onClick={handleCompressAndEmail}
            disabled={isCompressing}
            className="w-full sm:w-auto text-xs bg-primary text-primary-foreground"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Compress & Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
