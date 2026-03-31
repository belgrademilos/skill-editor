import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Image,
  Table,
  Type,
} from "lucide-react";
import { createSuggestionItems } from "../../novel";
import type { Editor, Range } from "@tiptap/core";

export const slashCommandItems = createSuggestionItems([
  {
    title: "Text",
    description: "Plain text paragraph",
    searchTerms: ["p", "paragraph"],
    icon: <Type className="w-4 h-4 text-text-secondary" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run();
    },
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    searchTerms: ["title", "big", "large", "h1"],
    icon: <Heading1 className="w-4 h-4 text-text-secondary" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    searchTerms: ["subtitle", "medium", "h2"],
    icon: <Heading2 className="w-4 h-4 text-text-secondary" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    searchTerms: ["subtitle", "small", "h3"],
    icon: <Heading3 className="w-4 h-4 text-text-secondary" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    title: "Bullet List",
    description: "Create an unordered list",
    searchTerms: ["unordered", "point", "ul"],
    icon: <List className="w-4 h-4 text-text-secondary" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create an ordered list",
    searchTerms: ["ordered", "ol", "numbers"],
    icon: <ListOrdered className="w-4 h-4 text-text-secondary" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Quote",
    description: "Add a blockquote",
    searchTerms: ["blockquote", "cite"],
    icon: <Quote className="w-4 h-4 text-text-secondary" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Code Block",
    description: "Insert a code snippet",
    searchTerms: ["codeblock", "pre", "fenced"],
    icon: <Code className="w-4 h-4 text-text-secondary" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Divider",
    description: "Insert a horizontal rule",
    searchTerms: ["hr", "separator", "line", "rule"],
    icon: <Minus className="w-4 h-4 text-text-secondary" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Table",
    description: "Insert a table",
    searchTerms: ["table", "grid", "columns", "rows"],
    icon: <Table className="w-4 h-4 text-text-secondary" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
  {
    title: "Image",
    description: "Upload or embed an image",
    searchTerms: ["photo", "picture", "media", "img"],
    icon: <Image className="w-4 h-4 text-text-secondary" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).run();
      // Open file picker
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        if (input.files?.length) {
          const file = input.files[0];
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            editor
              .chain()
              .focus()
              .setImage({ src: reader.result as string })
              .run();
          };
        }
      };
      input.click();
    },
  },
]);
