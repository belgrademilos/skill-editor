import { EditorProvider } from "@tiptap/react";
import type { EditorProviderProps } from "@tiptap/react";
import type { Content } from "@tiptap/core";
import { Provider } from "jotai";
import { forwardRef, useRef } from "react";
import type { FC, ReactNode } from "react";
import tunnel from "tunnel-rat";
import { novelStore } from "../utils/store";
import { EditorCommandTunnelContext } from "./editor-command";

interface EditorRootProps {
  readonly children: ReactNode;
}

export const EditorRoot: FC<EditorRootProps> = ({ children }) => {
  const tunnelInstance = useRef(tunnel()).current;

  return (
    <Provider store={novelStore}>
      <EditorCommandTunnelContext.Provider value={tunnelInstance}>
        {children}
      </EditorCommandTunnelContext.Provider>
    </Provider>
  );
};

export type EditorContentProps = Omit<EditorProviderProps, "content"> & {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly initialContent?: Content;
};

export const EditorContent = forwardRef<HTMLDivElement, EditorContentProps>(
  ({ className, children, initialContent, ...rest }, ref) => (
    <div ref={ref} className={className}>
      <EditorProvider {...rest} content={initialContent}>
        {children}
      </EditorProvider>
    </div>
  ),
);

EditorContent.displayName = "EditorContent";
