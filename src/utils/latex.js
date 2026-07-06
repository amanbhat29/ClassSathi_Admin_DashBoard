import katex from 'katex';
import 'katex/dist/katex.min.css';

// Superscript mappings for Unicode representation
const unicodeSuperscripts = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '-': '⁻', '+': '⁺', '=': '⁼', '(': '⁽', ')': '⁾',
  'n': 'ⁿ', 'i': 'ⁱ'
};

// Subscript mappings for Unicode representation
const unicodeSubscripts = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '-': '₋', '+': '₊', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ'
};

const greekSymbolMap = {
  'alpha': { unicode: 'α', ascii: 'alpha' },
  'beta': { unicode: 'β', ascii: 'beta' },
  'gamma': { unicode: 'γ', ascii: 'gamma' },
  'delta': { unicode: 'δ', ascii: 'delta' },
  'Delta': { unicode: 'Δ', ascii: 'Delta' },
  'theta': { unicode: 'θ', ascii: 'theta' },
  'pi': { unicode: 'π', ascii: 'pi' },
  'mu': { unicode: 'μ', ascii: 'mu' },
  'lambda': { unicode: 'λ', ascii: 'lambda' },
  'sigma': { unicode: 'σ', ascii: 'sigma' },
  'omega': { unicode: 'ω', ascii: 'omega' },
  'phi': { unicode: 'φ', ascii: 'phi' },
  'epsilon': { unicode: 'ε', ascii: 'epsilon' },
  'eta': { unicode: 'η', ascii: 'eta' },
  'tau': { unicode: 'τ', ascii: 'tau' },
  'rho': { unicode: 'ρ', ascii: 'rho' }
};

const mathCommandMap = {
  'pm': { unicode: '±', ascii: '+/-' },
  'times': { unicode: '×', ascii: 'x' },
  'div': { unicode: '÷', ascii: '/' },
  'approx': { unicode: '≈', ascii: '≈' },
  'neq': { unicode: '≠', ascii: '!=' },
  'le': { unicode: '≤', ascii: '<=' },
  'leq': { unicode: '≤', ascii: '<=' },
  'ge': { unicode: '≥', ascii: '>=' },
  'geq': { unicode: '≥', ascii: '>=' },
  'infty': { unicode: '∞', ascii: 'infinity' },
  'degree': { unicode: '°', ascii: '°' },
  'Delta': { unicode: 'Δ', ascii: 'Delta' }
};

/**
 * Converts a LaTeX math block (without delimiters) into clean text format.
 * Mode can be 'unicode' (for DOCX) or 'ascii' (for PDF standard fonts).
 */
export function convertMathToText(mathStr, mode = 'unicode') {
  if (!mathStr) return '';
  let str = mathStr.trim();

  // 1. Handle fractions: \frac{A}{B} -> A/B
  const fracRegex = /\\frac\s*{(.*?)}{(.*?)}/g;
  str = str.replace(fracRegex, (match, p1, p2) => {
    const top = convertMathToText(p1, mode);
    const bottom = convertMathToText(p2, mode);
    return `(${top})/(${bottom})`;
  });

  // 2. Handle square roots: \sqrt{x} -> sqrt(x)
  const sqrtRegex = /\\sqrt\s*{(.*?)}/g;
  str = str.replace(sqrtRegex, (match, p1) => {
    const inside = convertMathToText(p1, mode);
    return mode === 'unicode' ? `√(${inside})` : `sqrt(${inside})`;
  });

  // 3. Handle superscripts: ^{11} or ^2
  const superBraceRegex = /\^{(.*?)}/g;
  str = str.replace(superBraceRegex, (match, p1) => {
    const content = p1.trim();
    if (mode === 'unicode') {
      return [...content].map(char => unicodeSuperscripts[char] || char).join('');
    } else {
      // In PDF, standard onesuperior/twosuperior/threesuperior are supported.
      if (content === '1') return '¹';
      if (content === '2') return '²';
      if (content === '3') return '³';
      return `^${content}`;
    }
  });

  const superSingleRegex = /\^([0-9a-zA-Z\-\+])/g;
  str = str.replace(superSingleRegex, (match, p1) => {
    if (mode === 'unicode') {
      return unicodeSuperscripts[p1] || `^${p1}`;
    } else {
      if (p1 === '1') return '¹';
      if (p1 === '2') return '²';
      if (p1 === '3') return '³';
      return `^${p1}`;
    }
  });

  // 4. Handle subscripts: _{12} or _n
  const subBraceRegex = /_{(.*?)}/g;
  str = str.replace(subBraceRegex, (match, p1) => {
    const content = p1.trim();
    if (mode === 'unicode') {
      return [...content].map(char => unicodeSubscripts[char] || char).join('');
    } else {
      return `_${content}`;
    }
  });

  const subSingleRegex = /_([0-9a-zA-Z\-\+])/g;
  str = str.replace(subSingleRegex, (match, p1) => {
    if (mode === 'unicode') {
      return unicodeSubscripts[p1] || `_${p1}`;
    } else {
      return `_${p1}`;
    }
  });

  // 5. Replace standard LaTeX commands and symbols
  const commandRegex = /\\([a-zA-Z]+|[,;!\s])/g;
  str = str.replace(commandRegex, (match, p1) => {
    if (p1 === ',' || p1 === ';' || p1 === '!' || p1 === ' ') {
      return ' ';
    }
    if (greekSymbolMap[p1]) {
      return mode === 'unicode' ? greekSymbolMap[p1].unicode : greekSymbolMap[p1].ascii;
    }
    if (mathCommandMap[p1]) {
      return mode === 'unicode' ? mathCommandMap[p1].unicode : mathCommandMap[p1].ascii;
    }
    return p1; // fallback
  });

  // Remove any remaining curly braces
  str = str.replace(/[{}]/g, '');

  return str;
}

/**
 * Parses mixed text containing LaTeX and converts the LaTeX parts to plain text.
 */
export function parseLatexToText(text, mode = 'unicode') {
  if (!text) return '';
  // Match standard LaTeX inline \( ... \) or block \[ ... \]
  const regex = /(\\\[[\s\S]*?\\\])|(\\\([\s\S]*?\\\))/g;

  return text.split(regex).map(part => {
    if (!part) return '';
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      const math = part.slice(2, -2);
      return convertMathToText(math, mode);
    } else if (part.startsWith('\\\[') && part.endsWith('\\\]')) {
      const math = part.slice(2, -2);
      return convertMathToText(math, mode);
    }
    return part;
  }).join('');
}

/**
 * Renders a mixed text string containing LaTeX inline/block delimiters to rich HTML using KaTeX.
 */
export function parseLatexToHtml(text) {
  if (!text) return '';
  const regex = /(\\\[[\s\S]*?\\\])|(\\\([\s\S]*?\\\))/g;

  return text.split(regex).map(part => {
    if (!part) return '';
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      const math = part.slice(2, -2);
      try {
        return katex.renderToString(math, { displayMode: false, throwOnError: false });
      } catch (err) {
        console.error("[Latex] Inline render failed for:", math, err);
        return part;
      }
    } else if (part.startsWith('\\\[') && part.endsWith('\\\]')) {
      const math = part.slice(2, -2);
      try {
        return katex.renderToString(math, { displayMode: true, throwOnError: false });
      } catch (err) {
        console.error("[Latex] Block render failed for:", math, err);
        return part;
      }
    }
    return part;
  }).join('');
}
