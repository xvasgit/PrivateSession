export const mediaExtensions = [
  ".mp3",
  ".wav",
  ".mp4",
  ".m4v",
  ".mov",
] as const;
export interface MediaSelection {
  name: string;
  size: number;
  category: "Audio" | "Video";
}
export function validateMediaFile(
  file: Pick<File, "name" | "size">,
): string | undefined {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!mediaExtensions.some((allowed) => allowed === extension))
    return "Choose an MP3, WAV, MP4, M4V, or MOV file.";
  if (file.size === 0)
    return "The selected file is empty. Choose a non-empty recording.";
}
export function describeMediaFile(
  file: Pick<File, "name" | "size">,
): MediaSelection {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return {
    name: file.name,
    size: file.size,
    category: [".mp3", ".wav"].includes(extension) ? "Audio" : "Video",
  };
}
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
