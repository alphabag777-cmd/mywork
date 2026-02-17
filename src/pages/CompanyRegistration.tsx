import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Building2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ImageUpload";
import { submitCompanyApplication, CompanyApplication } from "@/lib/company_applications";

const formSchema = z.object({
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  contactPerson: z.string().min(2, {
    message: "Contact person name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  telegramId: z.string().min(1, {
    message: "Telegram ID is required for communication.",
  }),
  websiteUrl: z.string().url({
    message: "Please enter a valid URL (including https://).",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  logoUrl: z.string().optional(),
});

export default function CompanyRegistration() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      contactPerson: "",
      email: "",
      telegramId: "",
      websiteUrl: "",
      description: "",
      logoUrl: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const submissionData: Omit<CompanyApplication, "status" | "id" | "createdAt"> = {
        companyName: values.companyName,
        contactPerson: values.contactPerson,
        email: values.email,
        telegramId: values.telegramId,
        websiteUrl: values.websiteUrl,
        description: values.description,
        logoUrl: values.logoUrl || undefined,
      };

      await submitCompanyApplication(submissionData);
      toast.success("Application submitted successfully!", {
        description: "We will review your application and contact you shortly.",
      });
      form.reset();
      // Optional: Navigate to home or specific success page
      // navigate("/");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Company Entry Application</CardTitle>
          </div>
          <CardDescription>
            Register your company to partner with AlphaBag. Please fill out the form below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="john@acme.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telegramId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telegram ID / Phone <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="@johndoe or +1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="https://acme.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Logo (Optional)</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value || ""}
                        onChange={field.onChange}
                        folder="alphabag/companies"
                        label="Upload Logo"
                      />
                    </FormControl>
                    <FormDescription>
                      Upload your company logo (max 5MB).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Description <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about your company and partnership proposal..." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full md:w-auto">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
