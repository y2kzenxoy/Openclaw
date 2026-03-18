import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FolderOpen, UploadCloud, Download, Trash2, File as FileIcon, Loader2 } from "lucide-react";
import { useListFiles, useUploadFile, useDeleteFile, getDownloadFileUrl } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function FilesPanel() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useListFiles();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/files/list"] });

  const uploadMutation = useUploadFile({ mutation: { onSuccess: invalidate } });
  const deleteMutation = useDeleteFile({ mutation: { onSuccess: invalidate } });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      uploadMutation.mutate({ data: { file: acceptedFiles[0], path: "/" } });
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card">
        <FolderOpen className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">File Manager</span>
        <span className="ml-auto text-xs text-muted-foreground">{data?.files?.length ?? 0} files</span>
      </div>

      <div className="flex-1 p-4 sm:p-6 flex flex-col gap-5">
        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent/30"
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className={cn("w-10 h-10 mx-auto mb-3", isDragActive ? "text-primary" : "text-muted-foreground")} />
          <p className="text-sm font-medium text-foreground">
            {isDragActive ? "Drop to upload" : "Drag & drop files here"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">or tap to browse · max 100 MB</p>
          {uploadMutation.isPending && (
            <div className="mt-3 flex items-center justify-center gap-2 text-primary text-xs">
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
            </div>
          )}
        </div>

        {/* File list */}
        <div className="panel flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
            <span className="text-xs text-muted-foreground font-mono">{data?.path ?? "/"}</span>
            <span className="text-xs text-muted-foreground">{data?.files?.length ?? 0} entries</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : data?.files?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">No files uploaded yet</div>
            ) : (
              <div className="divide-y divide-border">
                {data?.files?.map((file) => (
                  <div key={file.name} className="flex items-center justify-between px-4 py-3 hover:bg-accent/30 group transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileIcon className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {formatBytes(file.size)} · {format(new Date(file.modified), "MMM d, HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => window.open(getDownloadFileUrl(file.name), "_blank")}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
      </div>
    </div>
  );
}
