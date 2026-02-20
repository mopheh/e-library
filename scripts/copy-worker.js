const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js');
const dest = path.join(__dirname, '..', 'public', 'pdf.worker.min.js');

// Ensure public directory exists
const publicDir = path.dirname(dest);
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

try {
    fs.copyFileSync(src, dest);
    console.log('PDF Worker copied to public folder successfully.');
} catch (err) {
    console.error('Error copying PDF worker:', err.message);
    // Fallback or exit 0 if you don't want to break build, but better to fail if essential
    process.exit(1);
}
