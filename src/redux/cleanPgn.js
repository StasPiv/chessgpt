export function cleanPgn(pgn) {
    if (!pgn) {
        return '';
    }

    // Remove non-printable characters including Windows-specific line endings
    let cleanedPgn = pgn
        .replace(/\r\n/g, '\n')  // Convert CRLF to LF
        .replace(/\r/g, '\n')    // Convert remaining CR to LF
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // Remove control chars
        .replace(/\uFEFF/g, '')  // Remove BOM (Byte Order Mark)
        .trim();
    
    // Rest of the function remains the same...
    const parts = cleanedPgn.split(/\n\s*\n/);
    let headers = '', moves = '';
    
    if (parts.length >= 2) {
        headers = parts[0];
        moves = parts.slice(1).join('\n\n');
    } else {
        if (cleanedPgn.startsWith('[')) {
            const lastHeaderIndex = cleanedPgn.lastIndexOf(']');
            headers = cleanedPgn.substring(0, lastHeaderIndex + 1);
            moves = cleanedPgn.substring(lastHeaderIndex + 1).trim();
        } else {
            moves = cleanedPgn;
        }
    }

    if (!headers.includes('[Event')) {
        headers = '[Event "Casual Game"]\n[Site "?"]\n[Date "????.??.??"]\n[Round "?"]\n[White "?"]\n[Black "?"]\n[Result "*"]';
    }

    if (moves) {
        moves = moves.replace(/(\d+)\.\s*\.\./g, '$1...');
        
        if (!moves.match(/1-0|0-1|1\/2-1\/2|\*$/)) {
            moves += ' *';
        }
        
        moves = moves.replace(/\s+$/, '\n');
    }

    if (parts.length >= 2) {
        return headers + '\n\n' + moves;
    } else {
        if (headers && moves) {
            return headers + '\n\n' + moves;
        } else if (headers) {
            return headers;
        } else {
            return moves;
        }
    }
}