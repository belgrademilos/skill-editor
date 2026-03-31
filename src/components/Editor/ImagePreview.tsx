interface ImagePreviewProps {
  src: string;
  fileName: string;
}

export function ImagePreview({ src, fileName }: ImagePreviewProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center overflow-auto p-8 bg-bg-primary">
      <img
        src={src}
        alt={fileName}
        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
      />
      <p className="mt-4 text-text-muted text-sm">{fileName}</p>
    </div>
  );
}
