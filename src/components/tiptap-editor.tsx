"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Quote,
} from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const TiptapEditor = ({ content, onChange }: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium transition-colors",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class:
            "rounded-xl border border-slate-200 dark:border-slate-800 my-6 max-h-[400px] w-auto mx-auto shadow-sm",
        },
      }),
    ],
    content: content,
    // Prevents SSR hydration mismatch errors
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        // Tailwind v4 + Typography premium styling
        class:
          "prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-5 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300",
      },
    },
  });

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("Image URL");

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-slate-900/10 dark:focus-within:ring-slate-100/10 transition-shadow">
      {/* Sticky Premium Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 dark:border-slate-800/60 p-2 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
        <Button
          size="sm"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleBold().run()}
          type="button"
          className="h-8 w-8 p-0"
          title="Bold"
        >
          <Bold className="size-4" />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          type="button"
          className="h-8 w-8 p-0"
          title="Italic"
        >
          <Italic className="size-4" />
        </Button>
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />{" "}
        {/* Divider */}
        <Button
          size="sm"
          variant={
            editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"
          }
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          type="button"
          className="h-8 w-8 p-0"
          title="Heading 1"
        >
          <Heading1 className="size-4" />
        </Button>
        <Button
          size="sm"
          variant={
            editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
          }
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          type="button"
          className="h-8 w-8 p-0"
          title="Heading 2"
        >
          <Heading2 className="size-4" />
        </Button>
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />{" "}
        {/* Divider */}
        <Button
          size="sm"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          type="button"
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="size-4" />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          type="button"
          className="h-8 w-8 p-0"
          title="Quote"
        >
          <Quote className="size-4" />
        </Button>
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />{" "}
        {/* Divider */}
        <Button
          size="sm"
          variant={editor.isActive("link") ? "secondary" : "ghost"}
          onClick={setLink}
          type="button"
          className="h-8 w-8 p-0"
          title="Add Link"
        >
          <LinkIcon className="size-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={addImage}
          type="button"
          className="h-8 w-8 p-0"
          title="Add Image URL"
        >
          <ImageIcon className="size-4" />
        </Button>
      </div>

      {/* Editor Content Area */}
      <div className="bg-slate-50/30 dark:bg-slate-900/20">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TiptapEditor;
