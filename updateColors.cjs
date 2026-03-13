const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'src', 'views');
const componentsDir = path.join(__dirname, 'src', 'components');

const replaceColorsInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalLength = content.length;

  content = content.replace(/blue-50/g, 'orange-50');
  content = content.replace(/blue-100/g, 'orange-100');
  content = content.replace(/blue-200/g, 'orange-200');
  content = content.replace(/blue-300/g, 'orange-300');
  content = content.replace(/blue-400/g, 'orange-400');
  content = content.replace(/blue-500/g, 'orange-500');
  content = content.replace(/blue-600/g, 'orange-600');
  content = content.replace(/blue-700/g, 'orange-700');
  content = content.replace(/blue-800/g, 'orange-800');
  content = content.replace(/blue-900/g, 'orange-900');

  content = content.replace(/indigo-50/g, 'amber-50');
  content = content.replace(/indigo-100/g, 'amber-100');
  content = content.replace(/indigo-200/g, 'amber-200');
  content = content.replace(/indigo-300/g, 'amber-300');
  content = content.replace(/indigo-400/g, 'amber-400');
  content = content.replace(/indigo-500/g, 'amber-500');
  content = content.replace(/indigo-600/g, 'amber-600');
  content = content.replace(/indigo-700/g, 'amber-700');
  content = content.replace(/indigo-800/g, 'amber-800');
  content = content.replace(/indigo-900/g, 'amber-900');

  content = content.replace(/emerald-50/g, 'lime-50');
  content = content.replace(/emerald-100/g, 'lime-100');
  content = content.replace(/emerald-200/g, 'lime-200');
  
  content = content.replace(/bg-\[#1E1E2E\]/g, 'bg-[#FFFBF7]');
  content = content.replace(/bg-\[#27273A\]/g, 'bg-white');
  content = content.replace(/bg-\[#161622\]/g, 'bg-orange-50/50');
  content = content.replace(/border-\[#36364A\]/g, 'border-orange-200');
  content = content.replace(/text-white/g, 'text-gray-800');
  content = content.replace(/text-white\/40/g, 'text-gray-400');
  content = content.replace(/text-white\/10/g, 'text-gray-200');
  content = content.replace(/bg-white\/5/g, 'bg-orange-50 rounded-xl border border-orange-100/50');
  content = content.replace(/border-white\/5/g, 'border-orange-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]');
  content = content.replace(/border-white\/10/g, 'border-orange-200');
  content = content.replace(/border-white\/20/g, 'border-orange-300');
  content = content.replace(/bg-[#27273A]/g, 'bg-[#FFFBF7]');

  // Restore white text on primary buttons
  content = content.replace(/bg-orange-([567]00) text-gray-800/g, 'bg-orange-$1 text-white');
  content = content.replace(/bg-amber-([567]00) text-gray-800/g, 'bg-amber-$1 text-white');
  content = content.replace(/bg-emerald-([567]00) text-gray-800/g, 'bg-emerald-$1 text-white');
  content = content.replace(/bg-lime-([567]00) text-gray-800/g, 'bg-lime-$1 text-white');
  content = content.replace(/bg-gradient-to-r from-orange-600 to-orange-500 text-gray-800/g, 'bg-gradient-to-r from-orange-600 to-orange-500 text-white');

  content = content.replace(/Rossember Parking/gi, 'PochiParking');
  content = content.replace(/Rossember Park/gi, 'PochiParking');
  content = content.replace(/Rossember/gi, 'PochiParking');

  if (content.length !== originalLength || content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated colors in', parseInt(content.length) > 0 ? filePath : 'none');
  }
};

const processDirectory = (dir) => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      replaceColorsInFile(fullPath);
    }
  }
};

processDirectory(viewsDir);
processDirectory(componentsDir);

// App.tsx
if(fs.existsSync(path.join(__dirname, 'src', 'App.tsx'))) {
  replaceColorsInFile(path.join(__dirname, 'src', 'App.tsx'));
}

console.log('Done replacement.');
