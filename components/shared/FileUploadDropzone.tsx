"use client";

import React, { useCallback, useState } from "react";
import { UploadCloud, CheckCircle, AlertCircle, X, File as FileIcon } from "lucide-react";
import { useB2Upload } from "@/hooks/useB2Upload";

interface FileUploadDropzoneProps {
  onUploadSuccess: (url: string, file: File) => void;
  onUploadError?: (error: Error) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  helperText?: string;
}

export function FileUploadDropzone({
  onUploadSuccess,
  onUploadError,
  accept = "*/*",
  maxSizeMB = 50,
  label = "Click or drag file to upload",
  helperText = "Supports all valid files",
}: FileUploadDropzoneProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const { upload } = useB2Upload();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setStatus("error");
      const err = `File size exceeds ${maxSizeMB}MB`;
      setErrorMessage(err);
      if (onUploadError) onUploadError(new Error(err));
      return false;
    }
    setFile(selectedFile);
    setStatus("idle");
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (validateAndSetFile(e.dataTransfer.files[0])) {
         handleUpload(e.dataTransfer.files[0]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (validateAndSetFile(e.target.files[0])) {
         handleUpload(e.target.files[0]);
      }
    }
  };

  const handleUpload = async (fileToUpload?: File) => {
    const activeFile = fileToUpload || file;
    if (!activeFile) return;

    try {
      setStatus("uploading");
      setProgress(0);
      const url = await upload(activeFile, (percent) => {
        setProgress(percent);
      });
      setStatus("success");
      onUploadSuccess(url, activeFile);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "An error occurred during upload");
      if (onUploadError) onUploadError(err);
    }
  };

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setErrorMessage("");
  };

  return (
    <div className="w-full">
      {status === "idle" && !file && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer group ${
            isHovering
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
              : "border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          }`}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <UploadCloud
            className={`w-10 h-10 mx-auto mb-3 transition-colors ${
              isHovering ? "text-blue-500" : "text-zinc-400 group-hover:text-blue-500"
            }`}
          />
          <div className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{label}</div>
          <div className="text-xs text-zinc-500">{helperText} (Max {maxSizeMB}MB)</div>
        </div>
      )}

      {file && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <FileIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate text-zinc-800 dark:text-zinc-200">
                {file.name}
              </div>
              <div className="text-xs text-zinc-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
            {status !== "uploading" && status !== "success" && (
              <button
                type="button"
                onClick={reset}
                className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                title="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {status === "uploading" && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1 text-zinc-600 dark:text-zinc-400">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="mt-4 flex items-center text-sm text-green-600 gap-2 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              Upload complete!
            </div>
          )}

          {status === "error" && (
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center text-sm text-red-600 gap-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg break-all">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMessage}
              </div>
              <button
                type="button"
                onClick={() => handleUpload()}
                className="text-sm text-blue-600 font-semibold hover:underline bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg w-full text-center mt-1"
              >
                Retry Upload
              </button>
            </div>
          )}

          {status === "idle" && (
            <div className="mt-4 text-xs font-medium text-zinc-500 flex justify-center items-center">
               <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin mr-2"></div> Preparing upload...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
