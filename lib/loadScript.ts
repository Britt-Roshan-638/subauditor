// lib/loadScript.ts — Helper to dynamically load external scripts

/**
 * Dynamically loads a script element and returns a promise that resolves when loaded
 * @param src - The URL of the script to load
 * @returns Promise that resolves when the script is loaded
 */
export default function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Avoid adding duplicate scripts
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;

    script.onload = () => {
      resolve();
    };

    script.onerror = () => {
      reject(new Error(`Failed to load script: ${src}`));
    };

    document.body.appendChild(script);
  });
}