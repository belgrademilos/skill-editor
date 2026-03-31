import { useEffect, useRef } from "react";
import { Check, Trash } from "lucide-react";
import { useEditor } from "../../../novel";
import { getUrlFromString } from "../../../novel/utils";
import { PopoverContent } from "../../ui/popover";
import { Popover, PopoverTrigger } from "@radix-ui/react-popover";
import { cn } from "../../../lib/utils";

interface LinkSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LinkSelector = ({ open, onOpenChange }: LinkSelectorProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { editor } = useEditor();

  useEffect(() => {
    inputRef.current?.focus();
  });

  if (!editor) return null;

  return (
    <Popover modal={true} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 rounded px-2 py-1 text-sm cursor-pointer hover:bg-bg-hover">
          <span className="text-base">↗</span>
          <span
            className={cn(
              "underline underline-offset-4 decoration-text-muted font-medium",
              {
                "text-accent": editor.isActive("link"),
                "text-text-primary": !editor.isActive("link"),
              },
            )}
          >
            Link
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-0" sideOffset={10}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.currentTarget as HTMLFormElement)[0] as HTMLInputElement;
            const url = getUrlFromString(input.value);
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
              onOpenChange(false);
            }
          }}
          className="flex p-1"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Paste a link"
            className="flex-1 bg-transparent p-1 text-sm text-text-primary outline-none placeholder:text-text-muted"
            defaultValue={editor.getAttributes("link").href || ""}
          />
          {editor.getAttributes("link").href ? (
            <button
              type="button"
              className="flex h-8 items-center rounded p-1.5 text-danger transition-all hover:bg-danger/10 cursor-pointer"
              onClick={() => {
                editor.chain().focus().unsetLink().run();
                if (inputRef.current) inputRef.current.value = "";
                onOpenChange(false);
              }}
            >
              <Trash className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              className="flex h-8 items-center rounded p-1.5 text-accent transition-all hover:bg-bg-hover cursor-pointer"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
        </form>
      </PopoverContent>
    </Popover>
  );
};
