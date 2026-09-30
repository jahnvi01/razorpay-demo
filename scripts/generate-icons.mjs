// Generates PWA icons: the Razorpay mark (from Blade, MIT) on black. Run: node scripts/generate-icons.mjs
import sharp from "sharp";

const mark =
  "M9.71749 12.3339L10.7149 8.66299L21 2L15.4844 22.5753L11.6926 22.5722L15.4262 8.64209L9.71749 12.3339ZM3 22.5756L4.57044 16.7193L13.9519 10.6624L10.7718 22.5756H3Z";

const svg = (maskable) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${maskable ? 0 : 112}" fill="#000000"/>
  <g transform="translate(${maskable ? 136 : 96} ${maskable ? 136 : 96}) scale(${maskable ? 10 : 13.33})">
    <path d="${mark}" fill="hsl(218, 89%, 51%)" fill-rule="evenodd"/>
  </g>
</svg>`;

const out = [
  ["public/icons/icon-192.png", 192, false],
  ["public/icons/icon-512.png", 512, false],
  ["public/icons/maskable-512.png", 512, true],
  ["public/icons/apple-touch-icon.png", 180, true],
];

for (const [file, size, maskable] of out) {
  await sharp(Buffer.from(svg(maskable))).resize(size, size).png().toFile(file);
  console.log("wrote", file);
}
