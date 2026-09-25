import { MAX_FILE_CHARS, MAX_FILES_PER_ORDER } from "./catalog";

export type PackedFile = {
  name: string;
  mimeType: string;
  size: number;
  dataBase64: string;
};

const ALLOWED = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/zip",
]);

export async function packFiles(list: FileList | File[]): Promise<PackedFile[]> {
  const files = Array.from(list).slice(0, MAX_FILES_PER_ORDER);
  const packed: PackedFile[] = [];
  for (const file of files) {
    if (!ALLOWED.has(file.type)) {
      throw new Error(`Tipo não permitido: ${file.name}`);
    }
    const dataBase64 = await readBase64(file);
    if (dataBase64.length > MAX_FILE_CHARS) {
      throw new Error(`${file.name} é demasiado grande (máx. ~900 KB neste canal).`);
    }
    packed.push({
      name: file.name,
      mimeType: file.type,
      size: file.size,
      dataBase64,
    });
  }
  return packed;
}

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha a ler o ficheiro."));
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

export function downloadBase64(name: string, mime: string | null, data: string) {
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mime || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
