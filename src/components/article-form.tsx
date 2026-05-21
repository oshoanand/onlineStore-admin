"use client";

import { useState, useEffect } from "react";
import TiptapEditor from "@/components/tiptap-editor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Image as ImageIcon } from "lucide-react";

// Import your Article type from the new service
import { Article } from "@/services/blog";

// Form State Interface
export interface CreateArticleDTO {
  title: string;
  slug: string;
  content: string;
  media_url: string;
  media_type: string;
  image_alt_text: string;
  isActive: boolean;
  meta_title: string;
  meta_description: string;
  keywords: string;
}

interface ArticleFormProps {
  initialData?: Article | null; // Optional for Edit mode
  onSubmit: (data: FormData) => void; // Must submit FormData for multer
  isSubmitting: boolean;
}

// Helper: Standard English slugify
const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

export default function ArticleForm({
  initialData,
  onSubmit,
  isSubmitting,
}: ArticleFormProps) {
  // Initialize form state
  const [formData, setFormData] = useState<CreateArticleDTO>({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    content: initialData?.content || "",
    media_url: (initialData as any)?.mediaUrl || "",
    media_type: (initialData as any)?.mediaType || "image",
    image_alt_text: (initialData as any)?.imageAltText || "",
    isActive: initialData?.isActive || false,
    meta_title: (initialData as any)?.metaTitle || "",
    meta_description: (initialData as any)?.metaDescription || "",
    keywords: (initialData as any)?.keywords || "",
  });

  // Track physical file for upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    (initialData as any)?.mediaUrl || null,
  );

  const [isSlugTouched, setIsSlugTouched] = useState(!!initialData?.slug);

  // Effect: Auto-generate slug from title
  useEffect(() => {
    if (!isSlugTouched && formData.title) {
      const autoSlug = slugify(formData.title);
      setFormData((prev) => ({ ...prev, slug: autoSlug }));
    }
  }, [formData.title, isSlugTouched]);

  const handleChange = (field: keyof CreateArticleDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugTouched(true);
    handleChange("slug", e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Create a local preview of the uploaded image
      setPreviewUrl(URL.createObjectURL(file));
      // Reset external URL if a file is chosen
      handleChange("media_url", "");
    }
  };

  const handleFormSubmit = () => {
    // 1. Create FormData object
    const payload = new FormData();

    // 2. Append all text fields
    payload.append("title", formData.title);
    payload.append("content", formData.content);
    payload.append("slug", formData.slug);
    payload.append("media_type", formData.media_type || "image");
    payload.append("image_alt_text", formData.image_alt_text || "");
    payload.append("meta_title", formData.meta_title || "");
    payload.append("meta_description", formData.meta_description || "");
    payload.append("keywords", formData.keywords || "");
    payload.append("isActive", String(formData.isActive));

    // 3. Handle Media (File vs External Link)
    if (selectedFile) {
      payload.append("media", selectedFile); // Matches backend `upload.single("media")`
    } else if (formData.media_url) {
      payload.append("media_url", formData.media_url); // Pass string if it's an external link
    }

    // 4. Send to parent
    onSubmit(payload);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-slate-200/60 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Enter article title"
              />
            </div>

            <div className="grid gap-2">
              <Label>Slug (URL path)</Label>
              <div className="flex flex-col gap-1">
                <Input
                  value={formData.slug}
                  onChange={handleSlugChange}
                  placeholder="article-url-path"
                />
                <p className="text-[11px] text-slate-500">
                  {formData.slug
                    ? `/blog/${formData.slug}`
                    : "Auto-generated from title"}
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>
                Article Content <span className="text-red-500">*</span>
              </Label>
              <div className="min-h-100">
                <TiptapEditor
                  content={formData.content}
                  onChange={(html) => handleChange("content", html)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Settings, Media, SEO */}
      <div className="space-y-6">
        {/* Publication Status & Action */}
        <Card className="border-slate-200/60 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle>Publishing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 border p-3 rounded-md bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
              <Checkbox
                id="active"
                checked={formData.isActive}
                onCheckedChange={(c) => handleChange("isActive", c as boolean)}
              />
              <Label
                htmlFor="active"
                className="cursor-pointer font-medium text-slate-700 dark:text-slate-300"
              >
                Publish on site
              </Label>
            </div>

            <Button
              onClick={handleFormSubmit}
              disabled={isSubmitting || !formData.title || !formData.content}
              className="w-full shadow-sm"
              size="lg"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {initialData ? "Save Changes" : "Create Article"}
            </Button>
          </CardContent>
        </Card>

        {/* Media Settings (File Upload or Link) */}
        <Card className="border-slate-200/60 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle>Media Cover</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Upload Type</Label>
              <Select
                value={formData.media_type}
                onValueChange={(v: any) => handleChange("media_type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Upload File (Image)</SelectItem>
                  <SelectItem value="link">External Link (URL)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggle Input based on Media Type */}
            {formData.media_type === "image" ? (
              <div className="grid gap-2">
                <Label>Image File</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>External Link (URL)</Label>
                <Input
                  value={formData.media_url || ""}
                  onChange={(e) => {
                    handleChange("media_url", e.target.value);
                    setPreviewUrl(e.target.value);
                    setSelectedFile(null); // Clear file if switching to URL
                  }}
                  placeholder="https://..."
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label>Alt Text (Image SEO)</Label>
              <Input
                value={formData.image_alt_text || ""}
                onChange={(e) => handleChange("image_alt_text", e.target.value)}
                placeholder="Brief image description"
              />
            </div>

            {/* Preview Area */}
            {previewUrl && (
              <div className="mt-2 relative rounded-md overflow-hidden border aspect-video bg-slate-100 flex items-center justify-center dark:bg-slate-800">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => setPreviewUrl(null)} // Hide if invalid link
                />
              </div>
            )}
            {!previewUrl && (
              <div className="mt-2 rounded-md border border-dashed border-slate-300 dark:border-slate-700 aspect-video bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-slate-400">
                <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                <span className="text-xs">No cover image</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card className="border-slate-200/60 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle>SEO Optimization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Meta Title</Label>
              <Input
                value={formData.meta_title || ""}
                onChange={(e) => handleChange("meta_title", e.target.value)}
                placeholder="Search engine title"
              />
              <span className="text-[10px] text-slate-500 text-right">
                {formData.meta_title?.length || 0}/60
              </span>
            </div>

            <div className="grid gap-2">
              <Label>Meta Description</Label>
              <Textarea
                value={formData.meta_description || ""}
                onChange={(e) =>
                  handleChange("meta_description", e.target.value)
                }
                placeholder="Brief page description..."
                className="h-24 resize-none"
              />
              <span className="text-[10px] text-slate-500 text-right">
                {formData.meta_description?.length || 0}/160
              </span>
            </div>

            <div className="grid gap-2">
              <Label>Keywords</Label>
              <Input
                value={formData.keywords || ""}
                onChange={(e) => handleChange("keywords", e.target.value)}
                placeholder="event, organization, party..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
