// app/components/TextAnnotate.tsx
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useCallback, useMemo } from "react"

// Base types
export interface BaseSpan {
  start: number
  end: number
  text?: string
}

export interface StyleProps {
  color?: string
  textColor?: string
}

export interface TagProps {
  tag?: string
}

export type Span = BaseSpan & StyleProps & TagProps

export interface TagDisplayProps {
  tag: string
  className?: string
  style?: React.CSSProperties
  position: "right" | "above"
}

export type UnmarkedSpan = {
  start: number
  end: number
  content: string
  mark: false
}

export type MarkedSpan<T> = Omit<T, "content" | "mark"> & {
  content: string
  mark: true
}

export type SplitSpan<T> = UnmarkedSpan | MarkedSpan<T>

interface TextAnnotatorProps<T extends Span> {
  content: string
  value: T[]
  onChange?: (value: T[]) => void
  getSpan?: (span: T) => T
  className?: string
  style?: React.CSSProperties
  markClassName?: string
  markStyle?: React.CSSProperties
  tagClassName?: string
  tagStyle?: React.CSSProperties
  showTag?: "hide" | "right" | "above"
}

const TagDisplay = ({ tag, className, style, position }: TagDisplayProps) => {
  const baseStyles: React.CSSProperties = {
    fontSize: "0.7em",
    fontWeight: 500,
    ...(position === "right"
      ? {
          marginLeft: 6,
          marginRight: 6,
          display: "inline-block",
        }
      : {
          marginBottom: 1,
          marginTop: 6,
          display: "block",
        }),
    ...style,
  }

  return (
    <div className={className} style={baseStyles}>
      {tag}
    </div>
  )
}

const AnnotationMark = <T extends Span>({
  split,
  markClassName,
  markStyle,
  showTag,
  tagClassName,
  tagStyle,
  onClick,
}: {
  split: MarkedSpan<T>
  markClassName?: string
  markStyle?: React.CSSProperties
  showTag?: "hide" | "right" | "above"
  tagClassName?: string
  tagStyle?: React.CSSProperties
  onClick: () => void
}) => {
  const renderTag = () => {
    if (!showTag || showTag === "hide" || !split.tag) return null
    return (
      <TagDisplay
        tag={split.tag}
        className={tagClassName}
        style={tagStyle}
        position={showTag}
      />
    )
  }

  return (
    <div
      style={{
        display: "inline-block",
        position: "relative",
      }}
    >
      {showTag === "above" && renderTag()}
      <mark
        className={markClassName}
        style={{
          backgroundColor: split.color || "#84d2ff",
          padding: 0,
          cursor: "pointer",
          color: split.textColor,
          borderRadius: "4px",
          ...markStyle,
        }}
        data-start={split.start}
        onClick={onClick}
      >
        {split.content}
        {showTag === "right" && renderTag()}
      </mark>
    </div>
  )
}

export const TextAnnotate = <T extends Span>({
  content,
  value,
  onChange,
  getSpan,
  className,
  style,
  markClassName,
  markStyle,
  tagClassName,
  tagStyle,
  showTag = "above",
}: TextAnnotatorProps<T>) => {
  const handleMouseUp = useCallback(() => {
    if (!onChange) return

    const selection = window.getSelection()
    if (!selection?.anchorNode || !selection.focusNode || selection.isCollapsed)
      return

    const getSelectionPoint = (node: Node, offset: number): number | null => {
      const base = node.parentElement?.getAttribute("data-start")
      return base ? parseInt(base, 10) + offset : null
    }

    const start = getSelectionPoint(
      selection.anchorNode,
      selection.anchorOffset,
    )
    const end = getSelectionPoint(selection.focusNode, selection.focusOffset)

    if (!start || !end) return

    const [finalStart, finalEnd] = start <= end ? [start, end] : [end, start]

    const hasOverlap = value.some(
      span =>
        (finalStart >= span.start && finalStart < span.end) ||
        (finalEnd > span.start && finalEnd <= span.end),
    )

    if (!hasOverlap) {
      const newSpan = {
        start: finalStart,
        end: finalEnd,
        text: content.slice(finalStart, finalEnd),
        textColor: "black",
      } as T

      const processedSpan = getSpan ? getSpan(newSpan) : newSpan
      onChange([...value, processedSpan])
      selection.empty()
    }
  }, [content, onChange, value, getSpan])

  const handleAnnotationClick = useCallback(
    (span: T) => {
      if (!onChange || window.getSelection()?.toString()) return
      onChange(
        value.filter(v => !(v.start === span.start && v.end === span.end)),
      )
    },
    [onChange, value],
  )

  const splits = useMemo(() => {
    const sortedSpans = [...value].sort(
      (a, b) => a.start - b.start || b.end - a.end,
    )
    const result: SplitSpan<T>[] = []
    let lastEnd = 0

    for (const span of sortedSpans) {
      if (lastEnd < span.start) {
        result.push({
          start: lastEnd,
          end: span.start,
          content: content.slice(lastEnd, span.start),
          mark: false,
        })
      }
      result.push({
        ...span,
        content: content.slice(span.start, span.end),
        mark: true as const,
      })
      lastEnd = span.end
    }

    if (lastEnd < content.length) {
      result.push({
        start: lastEnd,
        end: content.length,
        content: content.slice(lastEnd),
        mark: false,
      })
    }

    return result
  }, [content, value])

  return (
    <div className={className} style={style} onMouseUp={handleMouseUp}>
      {splits.map((split, index) =>
        split.mark ? (
          <AnnotationMark
            key={`${split.start}-${split.end}-${index}`}
            split={split as MarkedSpan<T>}
            markClassName={markClassName}
            markStyle={markStyle}
            showTag={showTag}
            tagClassName={tagClassName}
            tagStyle={tagStyle}
            onClick={() => handleAnnotationClick(split as unknown as T)}
          />
        ) : (
          <span
            key={`${split.start}-${split.end}-${index}`}
            data-start={split.start}
          >
            {split.content}
          </span>
        ),
      )}
    </div>
  )
}

export const ResizableTextAnnotate = <T extends Span>(
  props: TextAnnotatorProps<T>,
) => {
  return (
    <div className="relative">
      <div
        className={`overflow-auto ${props.className}`}
        style={{
          ...props.style,
          resize: "vertical",
          minHeight: "60px",
        }}
      >
        <TextAnnotate {...props} className="h-full w-full" />
      </div>
    </div>
  )
}
