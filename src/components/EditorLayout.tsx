import { useState, useCallback, useEffect, useRef } from 'react';
import { FileTree } from './Sidebar/FileTree';
import { ContextMenu } from './Sidebar/ContextMenu';
import { EditorTabs } from './Editor/EditorTabs';
import { SkillHeader } from './Editor/SkillHeader';
import { NovelEditor } from './Editor/NovelEditor';
import { PlainTextEditor } from './Editor/PlainTextEditor';
import { ImagePreview } from './Editor/ImagePreview';
import { HtmlPreview } from './Editor/HtmlPreview';
import { TopBar } from './Toolbar/TopBar';
import { isImageFile } from '../lib/zip';
import { ModalManager } from './ModalManager';
import { useSkillStore } from '../store/skillStore';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function EditorLayout() {
  const { activeFile, files, updateFile, frontmatterMap } = useSkillStore();
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => files.size <= 1);
  const [isResizing, setIsResizing] = useState(false);
  const prevFileCountRef = useRef(files.size);

  // Auto-collapse/expand sidebar when a new skill is loaded (file count changes)
  useEffect(() => {
    if (files.size !== prevFileCountRef.current) {
      prevFileCountRef.current = files.size;
      setSidebarCollapsed(files.size <= 1);
    }
  }, [files.size]);

  const hasFrontmatter = activeFile ? frontmatterMap.has(activeFile) : false;
  const fileContent = activeFile ? files.get(activeFile) ?? '' : '';

  const handleEditorChange = useCallback(
    (md: string) => {
      if (activeFile && md !== files.get(activeFile)) {
        updateFile(activeFile, md);
      }
    },
    [activeFile, files, updateFile]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);

      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const onMouseMove = (e: MouseEvent) => {
        const newWidth = Math.max(180, Math.min(500, startWidth + e.clientX - startX));
        setSidebarWidth(newWidth);
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [sidebarWidth]
  );

  return (
    <div className="flex flex-col h-full">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className="bg-bg-sidebar border-r border-border shrink-0 flex flex-col overflow-hidden transition-[width] duration-200"
          style={{ width: sidebarCollapsed ? 0 : sidebarWidth }}
        >
          {!sidebarCollapsed && <FileTree />}
        </div>

        {/* Resize Handle */}
        {!sidebarCollapsed && (
          <div
            className={`
              w-1 cursor-col-resize hover:bg-accent/30 transition-colors shrink-0
              ${isResizing ? 'bg-accent/40' : ''}
            `}
            onMouseDown={handleMouseDown}
          />
        )}

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-bg-primary">
          {/* Sidebar toggle + tabs */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-text-muted hover:text-text-secondary transition-colors shrink-0"
              title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
            <div className="flex-1 overflow-hidden">
              <EditorTabs />
            </div>
          </div>

          {/* Editor Content */}
          {activeFile ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {hasFrontmatter && <SkillHeader />}
              {isImageFile(activeFile) ? (
                <ImagePreview
                  key={activeFile}
                  src={fileContent}
                  fileName={activeFile.split('/').pop() || activeFile}
                />
              ) : activeFile.endsWith('.html') || activeFile.endsWith('.htm') ? (
                <HtmlPreview
                  key={activeFile}
                  content={fileContent}
                  onChange={handleEditorChange}
                />
              ) : activeFile.endsWith('.md') ? (
                <NovelEditor
                  key={activeFile}
                  content={fileContent}
                  onChange={handleEditorChange}
                  filePath={activeFile}
                />
              ) : (
                <PlainTextEditor
                  key={activeFile}
                  content={fileContent}
                  onChange={handleEditorChange}
                />
              )}
            </div>

          ) : (
            <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
              Select a file from the sidebar to start editing
            </div>
          )}
        </div>
      </div>


      {/* Context Menu */}
      <ContextMenu />

      {/* Modal */}
      <ModalManager />
    </div>
  );
}
