// SCRIPT.JS TAKES MD FILES AND MAKES THEM LEGIBLE FOR HTML FORMAT

function parseMarkdown(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let i = 0;

  function inline(text) {
    // Inline code
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Italic
    text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
    // Images (must come before links)
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return text;
  }

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, "").trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const escaped = codeLines
        .join("\n")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      html += `<pre><code class="lang-${lang}">${escaped}</code></pre>\n`;
      continue;
    }

    // Table (header row + separator row like |---|---|)
    if (/^\|.*\|$/.test(line) && lines[i + 1] && /^\|?[\s:|-]+\|?$/.test(lines[i + 1])) {
      const headerCells = line.split("|").map(c => c.trim()).filter(c => c !== "");
      i += 2; // skip header + separator
      const rows = [];
      while (i < lines.length && /^\|.*\|$/.test(lines[i])) {
        rows.push(lines[i].split("|").map(c => c.trim()).filter(c => c !== ""));
        i++;
      }
      html += "<table>\n<thead><tr>";
      headerCells.forEach(cell => (html += `<th>${inline(cell)}</th>`));
      html += "</tr></thead>\n<tbody>\n";
      rows.forEach(row => {
        html += "<tr>";
        row.forEach(cell => (html += `<td>${inline(cell)}</td>`));
        html += "</tr>\n";
      });
      html += "</tbody>\n</table>\n";
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html += `<h${level}>${inline(headingMatch[2])}</h${level}>\n`;
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      html += `<blockquote>${inline(quoteLines.join(" "))}</blockquote>\n`;
      continue;
    }

    // Unordered list
    if (/^\s*-\s+/.test(line)) {
      html += "<ul>\n";
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        html += `<li>${inline(lines[i].replace(/^\s*-\s+/, ""))}</li>\n`;
        i++;
      }
      html += "</ul>\n";
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      html += "<ol>\n";
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        html += `<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>\n`;
        i++;
      }
      html += "</ol>\n";
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph (collect until blank line or a line that starts a new block)
    const paraLines = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3}\s|```|\||>|\s*-\s|\s*\d+\.\s)/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    html += `<p>${inline(paraLines.join(" "))}</p>\n`;
  }

  return html;
}

const contentEl = document.getElementById("content");
const navLinks = document.querySelectorAll(".nav-link");

async function loadPage(pageName) {
  try {
    const response = await fetch(`documentation/${pageName}.md`);
    if (!response.ok) throw new Error("Page not found");
    const markdown = await response.text();
    contentEl.innerHTML = parseMarkdown(markdown);
  } catch (err) {
    contentEl.innerHTML = `<p>Could not load this page.</p>`;
  }
}

navLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    loadPage(link.dataset.page);
  });
});

loadPage("quickstart");