// app/lib/normalize.ts
interface PuncItem {
  src: string
  tgt: string
  src_name: string
  tgt_name: string
}

const PuncDict: PuncItem[] = [
  {
    src: "“",
    tgt: '"',
    src_name: "LeftDoubleQuotationMark",
    tgt_name: "QuotationMark",
  },
  {
    src: "”",
    tgt: '"',
    src_name: "RightDoubleQuotationMark",
    tgt_name: "QuotationMark",
  },
  {
    src: "‟",
    tgt: '"',
    src_name: "DoubleHigh-Reversed-9QuotationMark",
    tgt_name: "QuotationMark",
  },
  {
    src: "‘",
    tgt: "'",
    src_name: "LeftSingleQuotationMark",
    tgt_name: "Apostrophe",
  },
  {
    src: "’",
    tgt: "'",
    src_name: "RightSingleQuotationMark",
    tgt_name: "Apostrophe",
  },
  {
    src: "‐",
    tgt: "-",
    src_name: "Hyphen",
    tgt_name: "Hyphen-Minus",
  },
  {
    src: "–",
    tgt: "-",
    src_name: "EnDash",
    tgt_name: "Hyphen-Minus",
  },
  {
    src: "—",
    tgt: "-",
    src_name: "EmDash",
    tgt_name: "Hyphen-Minus",
  },
  {
    src: "―",
    tgt: "-",
    src_name: "HorizontalBar",
    tgt_name: "Hyphen-Minus",
  },
  {
    src: "−",
    tgt: "-",
    src_name: "MinusSign",
    tgt_name: "Hyphen-Minus",
  },
  {
    src: "∶",
    tgt: ":",
    src_name: "Ratio",
    tgt_name: "Colon",
  },
  {
    src: "ᆞ",
    tgt: "·",
    src_name: "HangulJungseongAraea",
    tgt_name: "MiddleDot",
  },
  {
    src: "∙",
    tgt: "·",
    src_name: "BulletOperator",
    tgt_name: "MiddleDot",
  },
  {
    src: "⋅",
    tgt: "·",
    src_name: "DotOperator",
    tgt_name: "MiddleDot",
  },
  {
    src: "・",
    tgt: "·",
    src_name: "KatakanaMiddleDot",
    tgt_name: "MiddleDot",
  },
  {
    src: "ㆍ",
    tgt: "·",
    src_name: "HangulLetterAraea",
    tgt_name: "MiddleDot",
  },
]

const createPuncMap = (): Map<string, string> => {
  const map = new Map<string, string>()
  PuncDict.forEach(entry => {
    map.set(entry.src, entry.tgt)
  })
  return map
}

const PuncMap = createPuncMap()

const normalizePunc = (s: string): string => {
  return s
    .split("")
    .map(char => PuncMap.get(char) || char)
    .join("")
}

export const normalizeStr = (s: string): string => {
  // NFKC normalization
  s = s.normalize("NFKC")

  // Normalize horizontal whitespaces while preserving newlines
  // [^\S\n] matches any whitespace character except newline
  s = s.replace(/[^\S\n]+/g, " ")

  // Normalize punctuations
  s = normalizePunc(s)

  // Trim start and end of each line
  s = s.trim()

  return s
}
