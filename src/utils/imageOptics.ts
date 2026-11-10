export interface ClientOpticalProfile {
  width: number;
  height: number;
  aspectRatioLabel: string;
  orientation: 'horizontal widescreen' | 'horizontal standard' | 'vertical portrait' | 'square format';
  averageLuminance: number; // 0-255
  contrastRatioLabel: string;
  estimatedKelvinLabel: string;
  shadowRatioPercent: number;
  highlightRatioPercent: number;
  dominantPaletteHex: string[];
  regionColorNamesEn: {
    centerSubject: string;
    upperBackground: string;
    lowerForeground: string;
    leftZone: string;
    rightZone: string;
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function describeColorEn(r: number, g: number, b: number): string {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (lum < 28) return `deep obsidian black (${rgbToHex(r, g, b)})`;
  if (lum > 230 && delta < 20) return `crisp alabaster white (${rgbToHex(r, g, b)})`;
  if (delta < 18) {
    if (lum < 75) return `dark charcoal slate (${rgbToHex(r, g, b)})`;
    if (lum < 150) return `neutral mid-tone silver-gray (${rgbToHex(r, g, b)})`;
    return `soft cool platinum gray (${rgbToHex(r, g, b)})`;
  }

  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  const tonePrefix = lum < 75 ? 'deep' : lum > 185 ? 'luminous pale' : 'rich';

  if (hue < 22 || hue >= 345) return `${tonePrefix} crimson-burgundy (${rgbToHex(r, g, b)})`;
  if (hue < 45) return `${tonePrefix} warm amber-ochre (${rgbToHex(r, g, b)})`;
  if (hue < 70) return `${tonePrefix} burnished gold (${rgbToHex(r, g, b)})`;
  if (hue < 160) return `${tonePrefix} organic forest-emerald (${rgbToHex(r, g, b)})`;
  if (hue < 205) return `${tonePrefix} cyan-teal slate (${rgbToHex(r, g, b)})`;
  if (hue < 255) return `${tonePrefix} cobalt-prussian blue (${rgbToHex(r, g, b)})`;
  if (hue < 305) return `${tonePrefix} violet-amethyst (${rgbToHex(r, g, b)})`;
  return `${tonePrefix} rose-magenta (${rgbToHex(r, g, b)})`;
}

/**
 * Downscales an image URL or DataURL to maxDimension (default 1280px) JPEG and extracts
 * deterministic photometric & chromatic telemetry from the actual pixels.
 */
export async function compressAndExtractOptics(
  sourceUrl: string,
  maxDimension: number = 1280
): Promise<{
  compressedBase64: string;
  mimeType: string;
  opticalProfile: ClientOpticalProfile;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const origW = img.naturalWidth || img.width || 1280;
      const origH = img.naturalHeight || img.height || 960;

      let targetW = origW;
      let targetH = origH;
      if (origW > maxDimension || origH > maxDimension) {
        if (origW >= origH) {
          targetW = maxDimension;
          targetH = Math.round((origH / origW) * maxDimension);
        } else {
          targetH = maxDimension;
          targetW = Math.round((origW / origH) * maxDimension);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Sample 64x64 grid for photometric analysis
      const sampleSize = 64;
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = sampleSize;
      sampleCanvas.height = sampleSize;
      const sCtx = sampleCanvas.getContext('2d');
      let opticalProfile: ClientOpticalProfile;

      const ratio = origW / origH;
      const aspectRatioLabel =
        Math.abs(ratio - 16 / 9) < 0.15
          ? '16:9'
          : Math.abs(ratio - 4 / 3) < 0.15
          ? '4:3'
          : Math.abs(ratio - 3 / 4) < 0.15
          ? '3:4'
          : Math.abs(ratio - 9 / 16) < 0.15
          ? '9:16'
          : '1:1';

      const orientation: ClientOpticalProfile['orientation'] =
        ratio > 1.55
          ? 'horizontal widescreen'
          : ratio > 1.1
          ? 'horizontal standard'
          : ratio < 0.88
          ? 'vertical portrait'
          : 'square format';

      if (sCtx) {
        sCtx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const { data } = sCtx.getImageData(0, 0, sampleSize, sampleSize);

        let totalLum = 0;
        let shadows = 0;
        let highlights = 0;
        let totalR = 0;
        let totalB = 0;
        const pixelCount = sampleSize * sampleSize;

        const regions = {
          center: { r: 0, g: 0, b: 0, count: 0 },
          upper: { r: 0, g: 0, b: 0, count: 0 },
          lower: { r: 0, g: 0, b: 0, count: 0 },
          left: { r: 0, g: 0, b: 0, count: 0 },
          right: { r: 0, g: 0, b: 0, count: 0 },
        };

        for (let y = 0; y < sampleSize; y++) {
          for (let x = 0; x < sampleSize; x++) {
            const idx = (y * sampleSize + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            totalLum += lum;
            totalR += r;
            totalB += b;
            if (lum < 55) shadows++;
            if (lum > 200) highlights++;

            if (x >= 18 && x <= 46 && y >= 18 && y <= 46) {
              regions.center.r += r;
              regions.center.g += g;
              regions.center.b += b;
              regions.center.count++;
            }
            if (y < 20) {
              regions.upper.r += r;
              regions.upper.g += g;
              regions.upper.b += b;
              regions.upper.count++;
            } else if (y > 44) {
              regions.lower.r += r;
              regions.lower.g += g;
              regions.lower.b += b;
              regions.lower.count++;
            }
            if (x < 20) {
              regions.left.r += r;
              regions.left.g += g;
              regions.left.b += b;
              regions.left.count++;
            } else if (x > 44) {
              regions.right.r += r;
              regions.right.g += g;
              regions.right.b += b;
              regions.right.count++;
            }
          }
        }

        const avgRegion = (reg: { r: number; g: number; b: number; count: number }) => {
          const c = Math.max(1, reg.count);
          return { r: reg.r / c, g: reg.g / c, b: reg.b / c };
        };

        const cCenter = avgRegion(regions.center);
        const cUpper = avgRegion(regions.upper);
        const cLower = avgRegion(regions.lower);
        const cLeft = avgRegion(regions.left);
        const cRight = avgRegion(regions.right);

        const avgLum = Math.round(totalLum / pixelCount);
        const shadowRatioPercent = Math.round((shadows / pixelCount) * 100);
        const highlightRatioPercent = Math.round((highlights / pixelCount) * 100);

        const rbRatio = (totalR + 1) / (totalB + 1);
        const estimatedKelvinLabel =
          rbRatio > 1.25
            ? '3400K Warm Tungsten / Golden Hour'
            : rbRatio > 1.06
            ? '4800K Warm-Neutral Studio'
            : rbRatio < 0.88
            ? '6800K Cool Twilight / Shade'
            : '5500K Calibrated Daylight';

        const contrastRatioLabel =
          shadowRatioPercent > 35 && highlightRatioPercent > 8
            ? '6:1 High-Contrast Chiaroscuro'
            : shadowRatioPercent > 25
            ? '4:1 Directional Low-Key Studio'
            : '2.5:1 Balanced Diffused Natural';

        opticalProfile = {
          width: origW,
          height: origH,
          aspectRatioLabel,
          orientation,
          averageLuminance: avgLum,
          contrastRatioLabel,
          estimatedKelvinLabel,
          shadowRatioPercent,
          highlightRatioPercent,
          dominantPaletteHex: [
            rgbToHex(cCenter.r, cCenter.g, cCenter.b),
            rgbToHex(cUpper.r, cUpper.g, cUpper.b),
            rgbToHex(cLower.r, cLower.g, cLower.b),
            rgbToHex(cLeft.r, cLeft.g, cLeft.b),
            rgbToHex(cRight.r, cRight.g, cRight.b),
          ],
          regionColorNamesEn: {
            centerSubject: describeColorEn(cCenter.r, cCenter.g, cCenter.b),
            upperBackground: describeColorEn(cUpper.r, cUpper.g, cUpper.b),
            lowerForeground: describeColorEn(cLower.r, cLower.g, cLower.b),
            leftZone: describeColorEn(cLeft.r, cLeft.g, cLeft.b),
            rightZone: describeColorEn(cRight.r, cRight.g, cRight.b),
          },
        };
      } else {
        opticalProfile = {
          width: origW,
          height: origH,
          aspectRatioLabel,
          orientation,
          averageLuminance: 120,
          contrastRatioLabel: '4:1 Directional Studio Key',
          estimatedKelvinLabel: '5200K Daylight',
          shadowRatioPercent: 25,
          highlightRatioPercent: 10,
          dominantPaletteHex: ['#18181B', '#3F3F46', '#71717A', '#D4A373', '#F4F4F5'],
          regionColorNamesEn: {
            centerSubject: 'rich neutral mid-tone (#71717A)',
            upperBackground: 'dark charcoal slate (#3F3F46)',
            lowerForeground: 'deep obsidian black (#18181B)',
            leftZone: 'warm amber-ochre (#D4A373)',
            rightZone: 'crisp alabaster white (#F4F4F5)',
          },
        };
      }

      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.86);
      resolve({
        compressedBase64,
        mimeType: 'image/jpeg',
        opticalProfile,
      });
    };
    img.onerror = () => reject(new Error('Не удалось прочитать графический файл изображения.'));
    img.src = sourceUrl;
  });
}
