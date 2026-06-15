export function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], {type: "text/plain;charset=utf-8"});
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
}

export async function shareText(title: string, text: string): Promise<boolean> {
  if (!navigator.share) return false;
  await navigator.share({title, text});
  return true;
}
