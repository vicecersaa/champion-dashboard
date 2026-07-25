import { useCallback, useRef, useState, DragEvent } from 'react';
import { UploadCloud, X, FileVideo, ImageIcon } from 'lucide-react';

interface FileUploadProps {
  type: 'image' | 'video';
  multiple?: boolean;
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  maxFiles?: number;
}

export function FileUpload({ type, multiple = false, value, onChange, label, maxFiles = 10 }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = multiple ? maxFiles - value.length : 1 - value.length;
  const canAdd = remaining > 0;

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newUrls: string[] = [];
    const slice = Array.from(files).slice(0, multiple ? maxFiles - value.length : 1);
    slice.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        newUrls.push(result);
        if (newUrls.length === slice.length) {
          onChange(multiple ? [...value, ...newUrls] : [newUrls[0]]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [value, onChange, multiple, maxFiles]);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const trigger = () => {
    if (canAdd) inputRef.current?.click();
  };

  const accept = type === 'image' ? 'image/*' : 'video/*';
  const isVideo = type === 'video';
  const noun = isVideo ? 'video' : 'gambar';

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
          {multiple && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{value.length}/{maxFiles} {noun}</span>
          )}
        </div>
      )}

      {value.length > 0 && (
        <div className={`grid gap-3 mb-3 ${isVideo ? 'grid-cols-1' : 'grid-cols-3 sm:grid-cols-4'}`}>
          {value.map((url, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {isVideo ? (
                <div className="aspect-video flex items-center justify-center bg-gray-900">
                  <video src={url} className="max-h-full max-w-full" controls />
                </div>
              ) : (
                <div className="aspect-square">
                  <img src={url} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemove(idx); }}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                aria-label={`Hapus ${noun} ${idx + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {!isVideo && idx === 0 && multiple && (
                <span className="absolute bottom-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded bg-brand-600 text-white font-medium">Utama</span>
              )}
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <div
          onClick={trigger}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
            dragging
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isVideo ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-500' : 'bg-brand-50 dark:bg-brand-900/20 text-brand-500'}`}>
              {isVideo ? <FileVideo className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1 justify-center">
                <UploadCloud className="h-4 w-4" />
                {dragging ? `Lepaskan ${noun} di sini` : 'Klik untuk memilih atau tarik ke sini'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isVideo ? 'MP4, MOV hingga 50MB' : `PNG, JPG hingga 5MB${multiple ? ` — sisa ${remaining} slot` : ''}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {!canAdd && multiple && (
        <div className="rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4 text-center text-xs text-gray-400 dark:text-gray-500">
          Batas {maxFiles} {noun} tercapai. Hapus salah satu untuk menambah yang baru.
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
