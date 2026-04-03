import { useCallback, useRef, useState } from "react"
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
      setValidationError(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`)
      return null
    }

    const invalidFiles: string[] = []
    for (const file of fileArray) {
      const result = validateAttachment(file)
      if (!result.valid) {
        invalidFiles.push(`${file.name}: ${result.error}`)
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
        style={{
          padding: 24,
          border: `2px dashed ${isDragging ? "var(--accent)" : "var(--line)"}`,
          borderRadius: 12,
          backgroundColor: isDragging ? "var(--accent-soft)" : disabled ? "var(--panel)" : "var(--panel)",
          textAlign: "center",
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

        <div style={{ color: "var(--muted)", fontSize: 14 }}>
          <p style={{ margin: "0 0 8px" }}>
            <strong>파일을 드래그하여 업로드</strong>하거나 클릭하여 선택하세요
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
            최대 {maxFiles}개, {formatFileSize(MAX_ATTACHMENT_SIZE)} 이하 (JPEG, PNG, GIF, PDF)
          </p>
        </div>
      </div>

      {validationError && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            backgroundColor: "var(--danger-soft)",
            borderRadius: 8,
            color: "var(--danger)",
            fontSize: 14,
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
  if (files.length === 0) return null

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
      {files.map((file) => (
        <div
          key={file.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 12,
            backgroundColor: "var(--panel)",
            borderRadius: 8,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--ink)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {file.file.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {formatFileSize(file.file.size)}
            </div>
            <div
              style={{
                height: 4,
                backgroundColor: "var(--line)",
                borderRadius: 2,
                marginTop: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${file.progress}%`,
                  backgroundColor: "var(--accent)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>

          <button
            onClick={() => onRemove(file.id)}
            style={{
              padding: 6,
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: 20,
              lineHeight: 1,
            }}
            aria-label="Remove file"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
