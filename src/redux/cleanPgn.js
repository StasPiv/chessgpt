export function cleanPgn(pgn) {
    if (!pgn) {
        return '';
    }

    // Remove non-printable characters (including NUL) and trim whitespace
    let cleanedPgn = pgn.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
    
    // Separate headers and moves
    const parts = cleanedPgn.split(/\n\s*\n/);
    let headers = '', moves = '';
    
    if (parts.length >= 2) {
        // If there's an empty line between headers and moves
        headers = parts[0];
        moves = parts.slice(1).join('\n\n');
    } else {
        // If there's no clear separation, try to determine by first character
        if (cleanedPgn.startsWith('[')) {
            // Find the last header
            const lastHeaderIndex = cleanedPgn.lastIndexOf(']');
            headers = cleanedPgn.substring(0, lastHeaderIndex + 1);
            moves = cleanedPgn.substring(lastHeaderIndex + 1).trim();
        } else {
            moves = cleanedPgn;
        }
    }

    // If there are no headers, add minimal set
    if (!headers.includes('[Event')) {
        headers = '[Event "Casual Game"]\n[Site "?"]\n[Date "????.??.??"]\n[Round "?"]\n[White "?"]\n[Black "?"]\n[Result "*"]';
    }

    // Process only specific problems in move notation
    if (moves) {
        // Fix only shortened variation notation from Arena (5. .. -> 5...)
        moves = moves.replace(/(\d+)\.\s*\.\./g, '$1...');
        
        // Check for game result presence
        if (!moves.match(/1-0|0-1|1\/2-1\/2|\*$/)) {
            moves += ' *';
        }
        
        // Remove extra whitespace at the end, but keep one line break
        moves = moves.replace(/\s+$/, '\n');
    }

    // Reassemble PGN
    if (parts.length >= 2) {
        // If there was originally an empty line, keep it
        return headers + '\n\n' + moves;
    } else {
        // If there was no empty line, but there are headers, add one
        if (headers && moves) {
            return headers + '\n\n' + moves;
        } else if (headers) {
            return headers;
        } else {
            return moves;
        }
    }
}