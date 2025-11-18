const OpenCC = require('opencc-js');
const fs = require('fs');

// Create converter from Simplified Chinese to Traditional Chinese (Taiwan standard)
const converter = OpenCC.Converter({ from: 'cn', to: 'tw' });

// Read the zh section
const zhSection = fs.readFileSync('/tmp/zh_section.txt', 'utf8');

// Convert to Traditional Chinese
const zhTWSection = zhSection
  .replace(/^  zh: \{/, '  \'zh-TW\': {')  // Change section name
  .split('\n')
  .map(line => {
    // Skip comment lines and braces
    if (line.trim().startsWith('//') || line.trim() === '{' || line.trim() === '},') {
      return line;
    }
    
    // For lines with Chinese text, convert the Chinese part
    if (line.includes("'")) {
      const match = line.match(/^(\s+'[^']+'\s*:\s*')(.*)(',?\s*)$/);
      if (match) {
        const prefix = match[1];
        const value = match[2];
        const suffix = match[3];
        
        // Only convert the value part if it contains Chinese characters
        if (/[\u4e00-\u9fa5]/.test(value)) {
          const convertedValue = converter(value);
          return prefix + convertedValue + suffix;
        }
      }
    }
    
    return line;
  })
  .join('\n');

// Write the converted section
fs.writeFileSync('/tmp/zh_tw_section.txt', zhTWSection);

console.log('Conversion complete! Check /tmp/zh_tw_section.txt');
console.log('First 30 lines:');
console.log(zhTWSection.split('\n').slice(0, 30).join('\n'));
