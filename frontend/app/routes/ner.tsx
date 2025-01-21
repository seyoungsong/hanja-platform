// app/routes/ner.tsx
import { MetaFunction, useNavigate, useSearchParams } from "@remix-run/react"
import { Languages, Quote } from "lucide-react"
import { useEffect, useState } from "react"
import { InteractiveGlossary } from "~/components/InteractiveGlossary"
import { MyContainer, MyHeader } from "~/components/MyCommon"
import {
  applyEntityStyles,
  BaseEntity,
  DEFAULT_STATS,
  NERResult,
  parseIOBToAnnotations,
  Stats,
  StyledEntity,
} from "~/components/NERHelper"
import { NERWorkspace } from "~/components/NERWorkspace"
import { Button } from "~/components/ui/button"
import { useToast } from "~/hooks/use-toast"
import { getPocketBaseBrowserClient } from "~/lib/pocketbase"

export const meta: MetaFunction = () => {
  return [{ title: "Hanja Platform | NER" }]
}

const MAX_TOKENS = 512

interface TokenizeResponse {
  taskType: string
  text: string
  tokens: string[]
  token_ids: number[]
}

const NamedEntityRecognition = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sourceText, setSourceText] = useState("")
  const [modelAnnotations, setModelAnnotations] = useState<StyledEntity[]>([])
  const [userAnnotations, setUserAnnotations] = useState<StyledEntity[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<Stats>({
    source: DEFAULT_STATS,
    model: DEFAULT_STATS,
    user: DEFAULT_STATS,
  })

  // Load history item if ID is provided
  const loadHistoryItem = async (id: string) => {
    setIsLoading(true)
    try {
      const pb = getPocketBaseBrowserClient()
      const record = await pb.collection("history").getOne(id)

      if (record.action !== "NER") {
        throw new Error("Invalid history item type")
      }

      const details = record.details as {
        text?: string
        pred?: BaseEntity[]
        user?: BaseEntity[]
      }

      if (details.text) setSourceText(details.text)
      if (details.pred) setModelAnnotations(details.pred.map(applyEntityStyles))
      if (details.user) setUserAnnotations(details.user.map(applyEntityStyles))
    } catch (error) {
      console.error("Failed to load history item:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load history item",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle URL parameters
  useEffect(() => {
    const id = searchParams.get("id")
    if (id) {
      loadHistoryItem(id)
      setSearchParams({}, { replace: true })
      return
    }

    const textParam = searchParams.get("text")
    const runParam = searchParams.get("run")
    const annotationsParam = searchParams.get("annotations")

    if (textParam) {
      const decodedText = decodeURIComponent(textParam)
      setSourceText(decodedText)

      if (annotationsParam) {
        try {
          const decodedAnnotations = JSON.parse(
            decodeURIComponent(annotationsParam),
          )
          const styledAnnotations = decodedAnnotations.map(applyEntityStyles)
          setModelAnnotations(styledAnnotations)
          setUserAnnotations(styledAnnotations)
        } catch (error) {
          console.error("Failed to parse annotations:", error)
        }
      }

      if (runParam) {
        processText(decodedText).catch(console.error)
      }
    }

    setSearchParams({}, { replace: true })
  }, [])

  const updateTextStats = async (text: string, section: keyof Stats) => {
    try {
      const response = await fetch("/api/tokenize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, taskType: "NER" }),
      })

      if (!response.ok) throw new Error("Failed to count tokens")

      const data: TokenizeResponse = await response.json()

      setStats(prev => ({
        ...prev,
        [section]: {
          chars: text.length,
          tokenCount: data.token_ids.length,
          tokens: data.tokens,
          token_ids: data.token_ids,
        },
      }))
    } catch (error) {
      console.error("Token counting error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to count tokens",
      })
    }
  }

  const processText = async (textToProcess?: string) => {
    const textToUse = textToProcess || sourceText

    if (!textToUse.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter some text to process",
      })
      return
    }

    setIsProcessing(true)
    try {
      // First get the tokens
      const tokenResponse = await fetch("/api/tokenize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToUse, taskType: "NER" }),
      })

      if (!tokenResponse.ok) throw new Error("Failed to tokenize text")

      const tokenData: TokenizeResponse = await tokenResponse.json()

      // Then process NER
      const response = await fetch("/api/ner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToUse,
          tokens: tokenData.tokens,
          token_ids: tokenData.token_ids,
        }),
      })

      if (!response.ok) throw new Error("Failed to process text")

      const data = await response.json()
      const result: NERResult = data.result
      const iobTags = result.iob.split(",")

      const newAnnotations = parseIOBToAnnotations(textToUse, iobTags)
      const styledAnnotations = newAnnotations.map(applyEntityStyles)
      setModelAnnotations(styledAnnotations)
      setUserAnnotations(styledAnnotations)

      // Update stats for model and user annotations
      setStats(prev => ({
        ...prev,
        model: {
          chars: textToUse.length,
          tokenCount: tokenData.token_ids.length,
          tokens: tokenData.tokens,
          token_ids: tokenData.token_ids,
        },
        user: {
          chars: textToUse.length,
          tokenCount: tokenData.token_ids.length,
          tokens: tokenData.tokens,
          token_ids: tokenData.token_ids,
        },
      }))
    } catch (error) {
      console.error("Error processing text:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to process text",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Update stats when text changes
  useEffect(() => {
    if (sourceText.trim()) updateTextStats(sourceText, "source")
  }, [sourceText])

  // Update stats when annotations change
  useEffect(() => {
    if (modelAnnotations.length) updateTextStats(sourceText, "model")
    if (userAnnotations.length) updateTextStats(sourceText, "user")
  }, [modelAnnotations, userAnnotations])

  const sendToPage = (page: "translation" | "punc") => {
    if (!sourceText.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter some text to send",
      })
      return
    }

    const encodedText = encodeURIComponent(sourceText)
    const url = `/${page}?text=${encodedText}&run=true`

    navigate(url)
  }

  const headerButtons = (
    <div className="flex justify-center gap-2">
      <Button
        variant="outline"
        onClick={() => sendToPage("punc")}
        className="flex items-center gap-2"
        disabled={!sourceText.trim()}
      >
        <Quote className="h-4 w-4" />
        <span className="hidden sm:inline">Open in Punctuation</span>
      </Button>
      <Button
        variant="outline"
        onClick={() => sendToPage("translation")}
        className="flex items-center gap-2"
        disabled={!sourceText.trim()}
      >
        <Languages className="h-4 w-4" />
        <span className="hidden sm:inline">Open in Translation</span>
      </Button>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <MyContainer>
      <MyHeader
        title="Named Entity Recognition"
        description="Identify and classify named entities in historical documents with advanced natural language processing."
        buttons={headerButtons}
      />

      <NERWorkspace
        sourceText={sourceText}
        setSourceText={setSourceText}
        modelAnnotations={modelAnnotations}
        userAnnotations={userAnnotations}
        setUserAnnotations={setUserAnnotations}
        isProcessing={isProcessing}
        processText={processText}
        stats={stats}
        MAX_TOKENS={MAX_TOKENS}
        navigate={navigate}
        toast={toast}
      />

      <InteractiveGlossary text={sourceText} />
    </MyContainer>
  )
}

export default NamedEntityRecognition
