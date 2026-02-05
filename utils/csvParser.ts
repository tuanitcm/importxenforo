import { CsvRow } from '../types';

export const parseCSV = (content: string): CsvRow[] => {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length < 2) return [];

  // Simple CSV parser handling basic commas. 
  // For complex CSVs with quoted commas, a more robust regex is needed.
  // This regex matches: "quoted field" OR unquoted_field
  const parseLine = (line: string) => {
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
        // Fix for infinite loop if matches empty string at end
        if (match.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        if (match[1] !== undefined) {
             // Remove surrounding quotes and unescape double quotes
             let val = match[1].trim();
             if (val.startsWith('"') && val.endsWith('"')) {
                 val = val.slice(1, -1).replace(/""/g, '"');
             }
             matches.push(val);
        }
    }
    // The regex usually adds an empty match at the end, remove it if it exceeds headers
    return matches;
  };

  const headers = parseLine(lines[0]).map(h => h.trim());
  const data: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = parseLine(lines[i]);
    if (currentLine.length === 0) continue;

    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = currentLine[index] || '';
    });
    data.push(row);
  }

  return data;
};