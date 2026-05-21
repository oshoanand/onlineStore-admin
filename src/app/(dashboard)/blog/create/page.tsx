"use client";

import ArticleForm from "@/components/article-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Import the hook we just built in the service file
import { useCreateArticle } from "@/services/blog";

export default function AdminCreateArticlePage() {
  const router = useRouter();
  const { toast } = useToast();

  // Attach the mutation hook
  const { mutate: createArticle, isPending } = useCreateArticle();

  return (
    <div className="w-full animate-in fade-in duration-500 slide-in-from-bottom-4">
      {/* Back Button */}
      <div className="mb-6 flex items-center gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Articles
          </Link>
        </Button>
      </div>

      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Create New Article
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Draft a new post, add media, and configure SEO settings.
          </p>
        </div>
      </div>

      {/* The Form */}
      <ArticleForm
        isSubmitting={isPending}
        onSubmit={(data) => {
          // Data from ArticleForm (can be JSON or FormData depending on how you built it)
          createArticle(data, {
            onSuccess: () => {
              toast({
                variant: "success",
                title: "Article created successfully!",
              });
              router.push("/blog");
            },
            onError: (error: any) => {
              toast({
                variant: "destructive",
                title: "Failed to create article",
                description: error?.message || "An unexpected error occurred.",
              });
            },
          });
        }}
      />
    </div>
  );
}
