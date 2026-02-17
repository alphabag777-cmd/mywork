import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveUser } from "@/lib/users";
import { saveUserInvestment } from "@/lib/userInvestments";
import { cn } from "@/lib/utils";

interface ImportOrgDataProps {
  onSuccess: () => void;
}

export function ImportOrgData({ onSuccess }: ImportOrgDataProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importType, setImportType] = useState<"users" | "investments">("users");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseFile(e.dataTransfer.files[0]);
    }
  };

  const parseFile = (file: File) => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split(/\r?\n/).filter(row => row.trim() !== "");
      
      if (rows.length < 2) {
        toast.error("CSV file is empty or missing headers");
        return;
      }

      // Simple CSV parsing (handling basic quotes)
      const parseRow = (row: string) => {
        const result = [];
        let current = "";
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result.map(cell => cell.replace(/^"|"$/g, "").replace(/""/g, '"'));
      };

      const headerRow = parseRow(rows[0]);
      setHeaders(headerRow);

      const data = rows.slice(1, 6).map(row => {
        const values = parseRow(row);
        const obj: any = {};
        headerRow.forEach((header, i) => {
          obj[header] = values[i] || "";
        });
        return obj;
      });

      setPreview(data);

      // Auto-detect type based on headers
      const lowerHeaders = headerRow.map(h => h.toLowerCase());
      if (lowerHeaders.includes("referrer") || lowerHeaders.includes("referrerwallet")) {
        setImportType("users");
      } else if (lowerHeaders.includes("amount") || lowerHeaders.includes("project")) {
        setImportType("investments");
      }
    };
    reader.readAsText(file);
  };

  const processImport = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const rows = text.split(/\r?\n/).filter(row => row.trim() !== "");
      
      // Re-parse all rows properly
      const parseRow = (row: string) => {
        const result = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else current += char;
        }
        result.push(current.trim());
        return result.map(cell => cell.replace(/^"|"$/g, "").replace(/""/g, '"'));
      };

      const headerRow = parseRow(rows[0]).map(h => h.toLowerCase().replace(/\s+/g, ""));
      const totalRows = rows.length - 1;
      let successCount = 0;
      let errorCount = 0;

      // Find column indices
      const getIdx = (candidates: string[]) => headerRow.findIndex(h => candidates.some(c => h.includes(c)));
      
      const walletIdx = getIdx(["wallet", "address", "user"]);
      
      if (walletIdx === -1) {
        toast.error("Could not find 'Wallet' column in CSV");
        setIsProcessing(false);
        return;
      }

      for (let i = 1; i < rows.length; i++) {
        try {
          const values = parseRow(rows[i]);
          const wallet = values[walletIdx];
          
          if (!wallet) continue;

          if (importType === "users") {
            const referrerIdx = getIdx(["referrer", "upline"]);
            const codeIdx = getIdx(["code", "referralcode"]);
            
            const referrer = referrerIdx !== -1 ? values[referrerIdx] : null;
            const code = codeIdx !== -1 ? values[codeIdx] : "";

            await saveUser(wallet, {
              referrerWallet: referrer || null,
              referralCode: code,
              isRegistered: true
            });
          } else {
            // Investments
            const amountIdx = getIdx(["amount", "value", "usdt"]);
            const projectIdx = getIdx(["project", "plan", "name"]);
            
            const amount = amountIdx !== -1 ? parseFloat(values[amountIdx].replace(/[^0-9.]/g, "")) : 0;
            const project = projectIdx !== -1 ? values[projectIdx] : "Manual Import";

            if (amount > 0) {
              await saveUserInvestment({
                userId: wallet,
                amount: amount,
                projectName: project,
                category: "BBAG", // Default or extract
                ownershipPercentage: 0,
                projectId: `import_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                investedAt: Date.now(),
              });
            }
          }

          successCount++;
        } catch (err) {
          console.error(`Row ${i} failed:`, err);
          errorCount++;
        }

        setProgress(Math.round((i / totalRows) * 100));
        
        // Yield to main thread occasionally to update UI
        if (i % 10 === 0) await new Promise(resolve => setTimeout(resolve, 0));
      }

      setIsProcessing(false);
      setFile(null);
      setPreview([]);
      setIsOpen(false);
      
      toast.success(`Import completed: ${successCount} processed, ${errorCount} failed`);
      if (onSuccess) onSuccess();
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Organization Data</DialogTitle>
          <DialogDescription>
            Bulk import users or sales data using CSV files.
          </DialogDescription>
        </DialogHeader>

        {!file ? (
          <div 
            className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="bg-muted p-4 rounded-full">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Click to upload or drag and drop</h3>
              <p className="text-sm text-muted-foreground mt-1">
                CSV files only. Supported columns: Wallet, Referrer, Amount.
              </p>
            </div>
            <Input 
              ref={fileInputRef} 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={isProcessing}>Change</Button>
            </div>

            <Tabs value={importType} onValueChange={(v) => setImportType(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="users" disabled={isProcessing}>Users & Referrals</TabsTrigger>
                <TabsTrigger value="investments" disabled={isProcessing}>Sales & Investments</TabsTrigger>
              </TabsList>
              
              <div className="mt-4 border rounded-md overflow-hidden">
                <div className="bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground border-b flex justify-between">
                  <span>PREVIEW (First 5 rows)</span>
                  <span>{headers.length} Columns Detected</span>
                </div>
                <div className="max-h-[200px] overflow-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        {headers.map((h, i) => <th key={i} className="px-4 py-2 font-medium">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                          {headers.map((h, j) => <td key={j} className="px-4 py-2 truncate max-w-[150px]">{row[h]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-blue-500" />
                  {importType === "users" ? (
                    <p>
                      Required: <strong>Wallet Address</strong>.<br/>
                      Optional: <strong>Referrer Wallet</strong>, <strong>Referral Code</strong>.<br/>
                      Existing users will be updated with new referrer data.
                    </p>
                  ) : (
                    <p>
                      Required: <strong>Wallet Address</strong>, <strong>Amount</strong>.<br/>
                      Optional: <strong>Project Name</strong>.<br/>
                      Sales will be added as new investments.
                    </p>
                  )}
                </div>
              </div>
            </Tabs>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Processing...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isProcessing}>Cancel</Button>
          <Button onClick={processImport} disabled={!file || isProcessing} className="gap-2">
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Start Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
