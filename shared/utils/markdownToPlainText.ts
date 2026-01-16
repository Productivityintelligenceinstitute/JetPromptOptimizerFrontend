/**
 * Converts markdown formatted text to formatted plain text for copying
 * Preserves visual formatting as displayed in UI (bullet points, structure, emphasis)
 * Matches the exact visual appearance shown in the chat interface
 */
export const markdownToPlainText = (content: string): string => {
    let text = content;
    
    // Convert emoji shortcuts to actual characters (matches UI display)
    text = text.replace(/:point_right:/g, '→');
    text = text.replace(/:([a-z_]+):/g, ''); // Remove other emoji shortcuts
    
    // Process line by line to preserve structure
    const lines = text.split('\n');
    const processedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const trimmedLine = line.trim();
        
        // Skip empty lines but preserve them for spacing
        if (!trimmedLine) {
            processedLines.push('');
            continue;
        }
        
        // Handle section headers (starts with ** and ends with **)
        // Keep bold formatting for headers to match UI appearance
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
            // Preserve the bold markdown for headers
            processedLines.push(trimmedLine);
            continue;
        }
        
        // Handle bullet points - preserve the • character and bold formatting (matches UI)
        if (trimmedLine.startsWith('•')) {
            // Preserve bold markdown and bullet, show links with URL
            let bulletContent = trimmedLine;
            // Handle bold links first: **[text](url)** -> **text → url**
            bulletContent = bulletContent.replace(/\*\*\[([^\]]+)\]\(([^\)]+)\)\*\*/g, '**$1 → $2**');
            // Handle regular links: [text](url) -> text → url
            bulletContent = bulletContent.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '$1 → $2');
            processedLines.push(bulletContent);
            continue;
        }
        
        // Handle lines with arrows (→) - preserve the arrow, bold formatting, and show URL prominently
        if (trimmedLine.includes('→')) {
            let arrowLine = trimmedLine;
            // Handle bold links first: **[text](url)** -> **text → url**
            arrowLine = arrowLine.replace(/\*\*\[([^\]]+)\]\(([^\)]+)\)\*\*/g, '**$1 → $2**');
            // Handle regular links: [text](url) -> text → url
            arrowLine = arrowLine.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '$1 → $2');
            processedLines.push(arrowLine);
            continue;
        }
        
        // Handle horizontal rules
        if (trimmedLine === '---') {
            processedLines.push('');
            continue;
        }
        
        // Regular lines - preserve bold formatting, show links with URL
        let processedLine = trimmedLine;
        
        // Handle bold links first: **[text](url)** -> **text → url**
        processedLine = processedLine.replace(/\*\*\[([^\]]+)\]\(([^\)]+)\)\*\*/g, '**$1 → $2**');
        // Handle regular links: [text](url) -> text → url
        processedLine = processedLine.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '$1 → $2');
        
        // Preserve bold markdown: **text** stays as **text** (for markdown-aware editors)
        // Don't remove bold formatting - keep it as is
        
        // Remove italic markdown: *text* -> text (but not **)
        processedLine = processedLine.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '$1');
        
        // Remove code blocks: `code` -> code
        processedLine = processedLine.replace(/`([^`]+)`/g, '$1');
        
        processedLines.push(processedLine);
    }
    
    // Join lines back together
    text = processedLines.join('\n');
    
    // Remove code fences: ```language\ncode\n``` -> code
    text = text.replace(/```[\s\S]*?```/g, (match) => {
        const codeLines = match.split('\n');
        codeLines.shift(); // Remove first line (```language)
        codeLines.pop(); // Remove last line (```)
        return codeLines.join('\n');
    });
    
    // Clean up multiple consecutive empty lines (keep max 2 for readability)
    text = text.replace(/\n{3,}/g, '\n\n');
    
    // Remove leading/trailing whitespace from entire text
    return text.trim();
};

/**
 * Converts markdown formatted text to HTML for rich text copying
 * Preserves bold formatting as HTML <strong> tags
 */
export const markdownToHTML = (content: string): string => {
    let text = content;
    
    // Convert emoji shortcuts to actual characters
    text = text.replace(/:point_right:/g, '→');
    text = text.replace(/:([a-z_]+):/g, '');
    
    // Process line by line
    const lines = text.split('\n');
    const processedLines: string[] = [];
    let lastWasEmpty = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const trimmedLine = line.trim();
        
        // Handle empty lines - only add one break, skip consecutive empty lines
        if (!trimmedLine) {
            if (!lastWasEmpty && i > 0 && i < lines.length - 1) {
                processedLines.push('<br>');
            }
            lastWasEmpty = true;
            continue;
        }
        lastWasEmpty = false;
        
        // Handle section headers - convert to HTML <strong> tags
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
            const headerText = trimmedLine.slice(2, -2);
            processedLines.push(`<strong>${escapeHTML(headerText)}</strong>`);
            continue;
        }
        
        // Handle bullet points
        if (trimmedLine.startsWith('•')) {
            let bulletContent = trimmedLine;
            // Process links BEFORE other processing (convert to HTML <a> tags)
            const linkPlaceholders: Array<{placeholder: string, text: string, url: string}> = [];
            
            // Handle bold links first: **[text](url)**
            bulletContent = bulletContent.replace(/\*\*\[([^\]]+)\]\(([^\)]+)\)\*\*/g, (match, text, url) => {
                const placeholder = `__BOLDLINK_${linkPlaceholders.length}__`;
                linkPlaceholders.push({ placeholder, text, url });
                return placeholder;
            });
            
            // Handle regular links: [text](url)
            bulletContent = bulletContent.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (match, text, url) => {
                const placeholder = `__LINK_${linkPlaceholders.length}__`;
                linkPlaceholders.push({ placeholder, text, url });
                return placeholder;
            });
            
            // Remove bold markdown from bullet points (only headings should be bold)
            bulletContent = bulletContent.replace(/\*\*([^*]+)\*\*/g, '$1');
            
            // Escape HTML (this won't affect our placeholders)
            bulletContent = escapeHTML(bulletContent);
            
            // Replace link placeholders with HTML <a> tags - make URL visible in link text
            linkPlaceholders.forEach(({ placeholder, text, url }) => {
                // Include URL in link text to make it visible
                const linkText = text.includes('→') ? `${escapeHTML(text)} ${escapeHTML(url)}` : `${escapeHTML(text)} → ${escapeHTML(url)}`;
                const linkHTML = `<a href="${escapeHTML(url)}">${linkText}</a>`;
                bulletContent = bulletContent.replace(placeholder, linkHTML);
            });
            
            processedLines.push(bulletContent);
            continue;
        }
        
        // Handle lines with arrows (often contains links)
        if (trimmedLine.includes('→')) {
            let arrowLine = trimmedLine;
            // Use placeholders to protect links from escaping
            const linkPlaceholders: Array<{placeholder: string, text: string, url: string}> = [];
            
            // Handle bold links first: **[text](url)**
            arrowLine = arrowLine.replace(/\*\*\[([^\]]+)\]\(([^\)]+)\)\*\*/g, (match, text, url) => {
                const placeholder = `__BOLDLINK_${linkPlaceholders.length}__`;
                linkPlaceholders.push({ placeholder, text, url });
                return placeholder;
            });
            
            // Handle regular links: [text](url)
            arrowLine = arrowLine.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (match, text, url) => {
                const placeholder = `__LINK_${linkPlaceholders.length}__`;
                linkPlaceholders.push({ placeholder, text, url });
                return placeholder;
            });
            
            // Remove remaining bold markdown (only headings should be bold)
            arrowLine = arrowLine.replace(/\*\*([^*]+)\*\*/g, '$1');
            
            // Escape HTML (this won't affect our placeholders)
            arrowLine = escapeHTML(arrowLine);
            
            // Replace placeholders with actual HTML links - make URL visible in link text
            linkPlaceholders.forEach(({ placeholder, text, url }) => {
                // Include URL in link text to make it visible: "text → url" (text already has →)
                const linkText = text.includes('→') ? `${escapeHTML(text)} ${escapeHTML(url)}` : `${escapeHTML(text)} → ${escapeHTML(url)}`;
                const linkHTML = `<a href="${escapeHTML(url)}">${linkText}</a>`;
                arrowLine = arrowLine.replace(placeholder, linkHTML);
            });
            
            processedLines.push(arrowLine);
            continue;
        }
        
        // Handle horizontal rules
        if (trimmedLine === '---') {
            processedLines.push('<br>');
            continue;
        }
        
        // Regular lines - convert markdown to HTML
        // Only headings should be bold, regular text should not be bold
        let processedLine = trimmedLine;
        
        // Process links BEFORE other processing (convert to HTML <a> tags)
        const linkPlaceholders: Array<{placeholder: string, text: string, url: string}> = [];
        
        // Handle bold links first: **[text](url)**
        processedLine = processedLine.replace(/\*\*\[([^\]]+)\]\(([^\)]+)\)\*\*/g, (match, text, url) => {
            const placeholder = `__BOLDLINK_${linkPlaceholders.length}__`;
            linkPlaceholders.push({ placeholder, text, url });
            return placeholder;
        });
        
        // Handle regular links: [text](url)
        processedLine = processedLine.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (match, text, url) => {
            const placeholder = `__LINK_${linkPlaceholders.length}__`;
            linkPlaceholders.push({ placeholder, text, url });
            return placeholder;
        });
        
        // Remove bold markdown from regular text (only headings should be bold)
        // Just remove the ** markers, don't make it bold
        processedLine = processedLine.replace(/\*\*([^*]+)\*\*/g, '$1');
        
        // Process italic markdown (but not **)
        const italicPlaceholders: string[] = [];
        processedLine = processedLine.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, (match, text) => {
            const placeholder = `__ITALIC_${italicPlaceholders.length}__`;
            italicPlaceholders.push(text);
            return placeholder;
        });
        
        // Process code blocks
        const codePlaceholders: string[] = [];
        processedLine = processedLine.replace(/`([^`]+)`/g, (match, text) => {
            const placeholder = `__CODE_${codePlaceholders.length}__`;
            codePlaceholders.push(text);
            return placeholder;
        });
        
        // Escape HTML (this won't affect our placeholders)
        processedLine = escapeHTML(processedLine);
        
        // Replace placeholders with HTML tags
        // Replace links first (before other formatting) - make URL visible in link text
        linkPlaceholders.forEach(({ placeholder, text, url }) => {
            // Include URL in link text to make it visible
            const linkText = text.includes('→') ? `${escapeHTML(text)} ${escapeHTML(url)}` : `${escapeHTML(text)} → ${escapeHTML(url)}`;
            const linkHTML = `<a href="${escapeHTML(url)}">${linkText}</a>`;
            processedLine = processedLine.replace(placeholder, linkHTML);
        });
        // Don't add bold tags for regular text - only headings are bold
        italicPlaceholders.forEach((text, index) => {
            processedLine = processedLine.replace(`__ITALIC_${index}__`, `<em>${escapeHTML(text)}</em>`);
        });
        codePlaceholders.forEach((text, index) => {
            processedLine = processedLine.replace(`__CODE_${index}__`, `<code>${escapeHTML(text)}</code>`);
        });
        
        processedLines.push(processedLine);
    }
    
    // Join lines with single breaks (no extra spacing)
    const htmlContent = processedLines.join('<br>');
    
    // Clean up multiple consecutive breaks
    const cleanedHTML = htmlContent.replace(/<br><br><br>+/g, '<br><br>');
    
    return cleanedHTML;
};

/**
 * Escapes HTML special characters
 */
function escapeHTML(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

