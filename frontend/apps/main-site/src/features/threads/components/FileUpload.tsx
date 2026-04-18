import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  formatFileSize,
  MAX_ATTACHMENT_SIZE,
  validateAttachment,
} from "../api/thread-api"

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
  maxFiles?: number
}

export function FileUpload({ onFilesSelected, disabled, maxFiles = 5 }: FileUploadProps) {
  const { t } = useTranslation("threads")
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateFiles = (files: FileList | null): File[] | null => {
    setValidationError(null)

    if (!files || files.length === 0) return null

    const fileArray = Array.from(files)

    if (fileArray.length > maxFiles) {
      setValidationError(t("upload.tooManyFiles", { max: maxFiles }))
      return null
    }

    const invalidFiles: string[] = []
    for (const file of fileArray) {
      const result = validateAttachment(file)
      if (!result.valid) {
        invalidFiles.push(t("upload.invalidFile", { fileName: file.name, error: result.error }))
      }
    }

    if (invalidFiles.length > 0) {
      setValidationError(invalidFiles.join("\n"))
      return null
    }

    return fileArray
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const validFiles = validateFiles(e.dataTransfer.files)
      if (validFiles) {
        onFilesSelected(validFiles)
      }
    },
    [disabled, onFilesSelected, maxFiles],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const validFiles = validateFiles(e.target.files)
      if (validFiles) {
        onFilesSelected(validFiles)
      }
      e.target.value = ""
    },
    [onFilesSelected, maxFiles],
  )

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className="p-24 text-center"
        style={{
          border: `2px dashed ${isDragging ? "var(--accent)" : "var(--line)"}`,
          borderRadius: 12,
          backgroundColor: isDragging ? "var(--accent-soft)" : disabled ? "var(--panel)" : "var(--panel)",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,application/pdf"
          onChange={handleFileSelect}
          disabled={disabled}
          style={{ display: "none" }}
        />

        <div className="text-muted text-base">
          <p style={{ margin: "0 0 8px" }}>
            <strong>{t("upload.dropLine1")}</strong>{t("upload.dropLine2Prefix")}
          </p>
          <p className="text-sm text-muted" style={{ margin: 0 }}>
            {t("upload.helperText", { max: maxFiles, maxSize: formatFileSize(MAX_ATTACHMENT_SIZE) })}
          </p>
        </div>
      </div>

      {validationError && (
        <div
          className="mt-12 p-12 text-danger text-base"
          style={{
            backgroundColor: "var(--danger-soft)",
            borderRadius: 8,
            whiteSpace: "pre-line",
          }}
        >
          {validationError}
        </div>
      )}
    </div>
  )
}

interface UploadingFile {
  file: File
  id: string
  progress: number
}

interface UploadingFileListProps {
  files: UploadingFile[]
  onRemove: (id: string) => void
}

export function UploadingFileList({ files, onRemove }: UploadingFileListProps) {
  const { t } = useTranslation("threads")
  if (files.length === 0) return null

  return (
    <div className="flex flex-col gap-8 mt-12">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-12 p-12"
          style={{
            backgroundColor: "var(--panel)",
            borderRadius: 8,
          }}
        >
          <div className="flex-1">
            <div
              className="text-base font-medium"
              style={{
                color: "var(--ink)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {file.file.name}
            </div>
            <div className="text-sm text-muted">
              {formatFileSize(file.file.size)}
            </div>
            <div
              className="mt-8 overflow-hidden"
              style={{
                height: 4,
                backgroundColor: "var(--line)",
                borderRadius: 2,
              }}
            >
              <div
                className="h-full"
                style={{
                  width: `${file.progress}%`,
                  backgroundColor: "var(--accent)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>

          <button
            onClick={() => onRemove(file.id)}
            className="cursor-pointer text-muted text-xl"
            style={{
              padding: 6,
              backgroundColor: "transparent",
              border: "none",
              lineHeight: 1,
            }}
            aria-label={t("upload.removeAria")}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
