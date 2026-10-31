import { Capacitor, registerPlugin } from '@capacitor/core';

interface NativePrintPlugin {
  print(options: { html: string; title: string }): Promise<void>;
}
const NativePrint = registerPlugin<NativePrintPlugin>('CashaBaPrint');

export async function saveExportFile(blob: Blob, filename: string): Promise<'shared' | 'downloaded'> {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/.test(filename)) throw new Error('Invalid export filename.');
  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'), import('@capacitor/share'),
    ]);
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(new Error('The export could not be prepared.'));
      reader.readAsDataURL(blob);
    });
    const file = await Filesystem.writeFile({
      path: `exports/${Date.now()}-${filename}`, data: base64, directory: Directory.Cache, recursive: true,
    });
    await Share.share({ title: filename, files: [file.uri], dialogTitle: 'Save or share your Casha-Ba export' });
    return 'shared';
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

export async function printNativeReport(html: string): Promise<void> {
  await NativePrint.print({ html, title: 'Casha-Ba Financial Report' });
}
