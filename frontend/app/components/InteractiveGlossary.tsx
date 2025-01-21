/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
// app/components/InteractiveGlossary.tsx
import hanja from "hanja"
import { HelpCircle } from "lucide-react"
import { type FC, Suspense, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card"
import { cenv } from "~/lib/cenv"

interface Character {
  char: string
  reading: string
  id: string
  type: "char" | "space" | "newline"
  definitions?: string[]
}

interface HanjaReadingProps {
  text: string
  className?: string
}

const GlossaryUsageGuide = () => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
          <HelpCircle className="h-4 w-4" />
          How to use
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium">Interactive Glossary Guide</h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Hover over any character to see its definition</li>
            <li>Click on a character to search it in External Dictionary</li>
            <li>Reading shown above each character</li>
            <li>Multiple definitions will be shown when available</li>
          </ul>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

const fetchDefinitions = async (
  text: string,
): Promise<Record<string, string[]>> => {
  try {
    const response = await fetch("/api/hanzi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch definitions")
    }

    const { definitions } = await response.json()
    return definitions
  } catch (error) {
    console.error("Error fetching definitions:", error)
    return {}
  }
}

const safeHanjaTranslate = (char: string): string => {
  try {
    return hanja.translate(char, "SUBSTITUTION") || char
  } catch (error) {
    console.debug(`Failed to translate character: ${char}`, error)
    return char
  }
}

const processCharacters = (
  text: string,
  definitionsMap: Record<string, string[]>,
): Character[] => {
  const characters: Character[] = []
  let index = 0

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (char === "\n") {
      characters.push({
        char: char,
        reading: "",
        id: `newline-${index}`,
        type: "newline",
      })
    } else if (char === " ") {
      characters.push({
        char: char,
        reading: "",
        id: `space-${index}`,
        type: "space",
      })
    } else {
      characters.push({
        char: char,
        reading: safeHanjaTranslate(char),
        id: `${char}-${index}`,
        type: "char",
        definitions: definitionsMap[char],
      })
    }
    index++
  }

  return characters
}

const CharacterDisplay: FC<Character> = ({
  char,
  reading,
  id,
  type,
  definitions,
}) => {
  if (type === "newline") {
    return <br key={id} />
  }

  if (type === "space") {
    return <span key={id}>&nbsp;</span>
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const encodedChar = encodeURIComponent(char)
    window.open(
      `https://hanja.dict.naver.com/#/search?range=all&query=${encodedChar}`,
      "_blank",
    )
  }

  return (
    <HoverCard key={id} openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <ruby className="group relative cursor-pointer text-base">
          <span
            onClick={handleClick}
            className="rounded-md transition-colors group-hover:bg-primary/20 group-hover:text-primary"
          >
            {char}
          </span>
          <rt className="text-xs font-semibold text-muted-foreground transition-colors group-hover:text-primary">
            {reading}
          </rt>
        </ruby>
      </HoverCardTrigger>
      {definitions && definitions.length > 0 && (
        <HoverCardContent
          className="w-80"
          side="top"
          align="center"
          sideOffset={20}
        >
          <div className="max-h-48 overflow-y-auto">
            {definitions.map((definition, idx) => (
              <div key={`${id}-def-${idx}`} className="space-y-1">
                <p className="whitespace-pre-wrap break-words text-sm">
                  {definition}
                </p>
                {idx < definitions.length - 1 && (
                  <div className="my-2 border-t" />
                )}
              </div>
            ))}
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  )
}

const LoadingState = () => (
  <div className="flex items-center justify-center p-4">
    <div className="text-muted-foreground">Processing characters...</div>
  </div>
)

const HanjaReadingContent: FC<HanjaReadingProps> = ({ text }) => {
  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadCharacters = async () => {
      try {
        const definitionsMap = await fetchDefinitions(text)
        const processed = processCharacters(text, definitionsMap)

        if (mounted) {
          setCharacters(processed)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error processing text:", error)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadCharacters()
    return () => {
      mounted = false
    }
  }, [text])

  if (isLoading) return <LoadingState />

  return (
    <div style={{ lineHeight: "2.75rem" }}>
      {characters.map(char => (
        <CharacterDisplay key={char.id} {...char} />
      ))}
    </div>
  )
}

export const InteractiveGlossary: FC<HanjaReadingProps> = ({
  text,
  className = cenv.isCompact ? "mb-2" : "mb-6",
}) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Interactive Glossary</CardTitle>
        <GlossaryUsageGuide />
      </CardHeader>
      <CardContent>
        <Suspense fallback={<LoadingState />}>
          <HanjaReadingContent text={text} />
        </Suspense>
      </CardContent>
    </Card>
  )
}
