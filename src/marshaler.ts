import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

function forwardDifferentialCoding(numbers: number[]): number[] {
  return numbers.reduce((acc: number[], curr: number, idx: number) => {
    if (idx === 0) {
      // keep first number as-is
      acc.push(curr);
    } else {
      // store difference from previous number
      acc.push(curr - numbers[idx - 1]); 
    }
    return acc;
  }, []);
}

function variableLengthEncode(num: number): number[] {
  const bytes: number[] = [];

  let value = Math.abs(num);
  while (true) {
    const hasMore = value > 0xFF;
    bytes.push(value & 0xFF);
    value = value >> 8;
    if (!hasMore) break;
  }

  return bytes;
}

function variableLengthDecode(bytes: number[]): number {
  let value = 0;
  for (let i = bytes.length - 1; i >= 0; i--) {
    value = (value << 8) | (bytes[i] & 0xFF);
  }
  return value;
}

function reverseDifferentialCoding(numbers: number[]): number[] {
  return numbers.reduce((acc: number[], curr: number, idx: number) => {
    if (idx === 0) {
      acc.push(curr);
    } else {
      acc.push(acc[idx - 1] + curr);
    }
    return acc;
  }, []);
}


export function marshal(map: Map<string, string>): string {
    // invert the map
    const groupedByValue = Array.from(map.entries()).reduce((groups, [jobId, decision]) => {
        const group = groups.get(decision) || [];
        group.push(jobId);
        groups.set(decision, group);
        return groups;
    }, new Map<string, string[]>());

    const encoded = Array.from(groupedByValue.entries()).map(([decision, jobIds]) => {
        const jobIdsInt: number[] = jobIds.map((jobId) => parseInt(jobId, 10));
        const sortedJobIdsInt = jobIdsInt.sort((a, b) => a - b);
        const forwardDifferentialCodingNumbers = forwardDifferentialCoding(sortedJobIdsInt);
        const variableLengthEncodedNumbers = forwardDifferentialCodingNumbers.map((number) => {
            const bytes = variableLengthEncode(number);
            return bytes.map((byte) => String.fromCharCode(byte)).join('');
        });
        return [decision, variableLengthEncodedNumbers.join(',')].join('|');
    });

    const compressed = compressToEncodedURIComponent(encoded.join(';'));
    return compressed;
}


export function unMarshal(str: string): Map<string, string> {
    const decompressed = decompressFromEncodedURIComponent(str);
    const result = new Map<string, string>();
    
    // Split into decision groups
    const groups = decompressed.split(';');
    
    for (const group of groups) {
        const [decision, encodedNumbers] = group.split('|');

        // Split the encoded numbers string into individual encoded numbers
        const encodedNumbersList = encodedNumbers.split(',');
        
        // Decode each variable length encoded number
        const decodedNumbers = encodedNumbersList.map(encoded => {
            const bytes: number[] = [];
            for (let i = 0; i < encoded.length; i++) {
                bytes.push(encoded.charCodeAt(i));
            }
            return variableLengthDecode(bytes);
        });

        // Reverse the differential coding
        const originalNumbers = reverseDifferentialCoding(decodedNumbers);
        
        // Convert numbers back to strings and add to result map
        originalNumbers.forEach(num => {
            result.set(num.toString(), decision);
        });
    }

    return result;
}