import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FolderOpen, UploadCloud, Download, Trash2, File as FileIcon, Loader2 } from "lucide-react";
import { useListFiles, useUploadFile, useDeleteFile, getDownloadFileUrl } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export function FilesPanel() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useListFiles();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/files/list"] });

  const uploadMutation = useUploadFile({ mutation: { onSuccess: invalidate } });
  const deleteMutation = useDeleteFile({ mutation: { onSuccess: invalidate } });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0]; // Just handle one for now based on spec
    uploadMutation.mutate({ data: { file, path: "/" } });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-background p-4 sm:p-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3 text-primary">
          <FolderOpen className="w-8 h-8" />
          <h1 className="text-2xl font-mono uppercase text-glow">Data Core</h1>
        </div>
      </header>

      {/* Upload Zone */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-2xl p-8 mb-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive ? 'border-primary bg-primary/10 terminal-glow' : 'border-primary/30 bg-card hover:bg-secondary'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
        <h3 className="font-mono text-lg text-primary mb-2">UPLOAD_DATA_CHUNKS</h3>
        <p className="text-muted-foreground text-sm">Drag & drop files here, or tap to select</p>
        {uploadMutation.isPending && (
          <div className="mt-4 flex items-center justify-center text-primary">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Uploading...
          </div>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto glass-panel rounded-xl border border-primary/20">
        <div className="bg-secondary/50 p-4 border-b border-primary/20 font-mono text-sm text-primary/70 flex justify-between">
          <span>DIRECTORY: {data?.path || '/'}</span>
          <span>{data?.files?.length || 0} ENTRIES</span>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : data?.files?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground font-mono">
            NO_FILES_FOUND
          </div>
        ) : (
          <div className="divide-y divide-primary/10">
            {data?.files?.map((file) => (
              <div key={file.name} className="flex items-center justify-between p-4 hover:bg-primary/5 transition-colors group">
                <div className="flex items-center gap-4 overflow-hidden">
                  <FileIcon className="w-6 h-6 text-primary flex-shrink-0" />
                  <div className="truncate">
                    <p className="font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {formatBytes(file.size)} • {format(new Date(file.modified), "yyyy-MM-dd HH:mm")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => window.open(getDownloadFileUrl(file.name), '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-destructive hover:bg-destructive/20"
                    onClick={() => deleteMutation.mutate({ data: { filename: file.name } })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
