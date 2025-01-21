// app/components/NERHelper.tsx
import { CSSProperties } from "react"
import { MarkedSpan, Span } from "~/components/TextAnnotate"

// Extend the base types for NER-specific needs
export interface BaseEntity extends Span {
  tag: string // Make tag required instead of optional
}

// Additional styles for NER entities
export interface StyledEntity extends BaseEntity {
  markStyle?: CSSProperties
  tagStyle?: CSSProperties
}

// Marked version of styled entity
export type MarkedStyledEntity = MarkedSpan<StyledEntity>

export interface NERResult {
  original: string
  xml: string
  iob: string
}

export interface TextStats {
  chars: number
  tokenCount: number
  tokens: string[]
  token_ids?: number[]
}

export interface Stats {
  source: TextStats
  model: TextStats
  user: TextStats
}

export const DEFAULT_STATS: TextStats = {
  chars: 0,
  tokenCount: 0,
  tokens: [],
  token_ids: [],
}

export const TAG_MAPPING = {
  ajd_person: "PER",
  ajd_location: "LOC",
  ajd_other: "MISC",
  klc_other: "MISC",
  wyweb_bookname: "MISC",
  wyweb_other: "MISC",
} as const

export const ENTITY_TYPES = {
  PER: {
    label: "Person",
    color: "#fecaca",
  },
  LOC: {
    label: "Location",
    color: "#bbf7d0",
  },
  ORG: {
    label: "Organization",
    color: "#bfdbfe",
  },
  MISC: {
    label: "Miscellaneous",
    color: "#e9d5ff",
  },
} as const

export const parseIOBToAnnotations = (
  text: string,
  iobTags: string[],
): BaseEntity[] => {
  const annotations: BaseEntity[] = []
  let currentEntity: Partial<BaseEntity> | null = null

  const tags = iobTags.map(tag => tag.trim())
  const characters = [...text]

  tags.forEach((tag, index) => {
    if (tag === "O") {
      if (currentEntity) {
        annotations.push(currentEntity as BaseEntity)
        currentEntity = null
      }
    } else {
      const [prefix, rawEntityType] = tag.split("-")
      const entityType =
        TAG_MAPPING[rawEntityType as keyof typeof TAG_MAPPING] || "MISC"

      if (prefix === "B" || (prefix === "I" && !currentEntity)) {
        if (currentEntity) {
          annotations.push(currentEntity as BaseEntity)
        }
        currentEntity = {
          start: index,
          end: index + 1,
          text: characters[index],
          tag: entityType,
        }
      } else if (prefix === "I" && currentEntity) {
        currentEntity.end = index + 1
        currentEntity.text = text.slice(currentEntity.start, index + 1)
      }
    }
  })

  if (currentEntity) {
    annotations.push(currentEntity as BaseEntity)
  }

  return annotations
}

const getEntityStyles = (entityType: keyof typeof ENTITY_TYPES) => {
  const entityStyle = ENTITY_TYPES[entityType]

  return {
    color: entityStyle.color,
  }
}

export const applyEntityStyles = (entity: BaseEntity): StyledEntity => {
  const styles = getEntityStyles(entity.tag as keyof typeof ENTITY_TYPES)
  return {
    ...entity,
    ...styles,
  }
}

export const getNewAnnotationStyle = (selectedType: string) => {
  return getEntityStyles(selectedType as keyof typeof ENTITY_TYPES)
}
