const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE = path.join(__dirname, '../public/favicon.png');
const ANDROID_RES = path.join(__dirname, '../android/app/src/main/res');

// Android icon sizes for different densities
const ANDROID_ICONS = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// Foreground icons are larger (for adaptive icons)
const ANDROID_FOREGROUND = [
  { folder: 'mipmap-mdpi', size: 108 },
  { folder: 'mipmap-hdpi', size: 162 },
  { folder: 'mipmap-xhdpi', size: 216 },
  { folder: 'mipmap-xxhdpi', size: 324 },
  { folder: 'mipmap-xxxhdpi', size: 432 },
];

async function generateAndroidIcons() {
  console.log('Generating Android icons from', SOURCE);

  for (const { folder, size } of ANDROID_ICONS) {
    const outputPath = path.join(ANDROID_RES, folder, 'ic_launcher.png');
    await sharp(SOURCE)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Created ${folder}/ic_launcher.png (${size}x${size})`);

    // Also create round version
    const roundPath = path.join(ANDROID_RES, folder, 'ic_launcher_round.png');
    await sharp(SOURCE)
      .resize(size, size)
      .png()
      .toFile(roundPath);
    console.log(`Created ${folder}/ic_launcher_round.png (${size}x${size})`);
  }

  // Generate foreground icons for adaptive icons
  for (const { folder, size } of ANDROID_FOREGROUND) {
    const outputPath = path.join(ANDROID_RES, folder, 'ic_launcher_foreground.png');

    // For foreground, we need padding around the icon
    // The icon should be about 66% of the total size, centered
    const iconSize = Math.round(size * 0.66);
    const padding = Math.round((size - iconSize) / 2);

    await sharp(SOURCE)
      .resize(iconSize, iconSize)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    console.log(`Created ${folder}/ic_launcher_foreground.png (${size}x${size})`);
  }

  console.log('Done!');
}

generateAndroidIcons().catch(console.error);
