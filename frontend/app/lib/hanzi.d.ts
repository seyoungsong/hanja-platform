// app/types/hanzi.d.ts
declare module "hanzi" {
  interface DecompositionResult {
    character: string
    components1?: string[]
    components2?: string[]
    components3?: string[]
    components?: string[]
  }

  interface Definition {
    traditional: string
    simplified: string
    pinyin: string
    definition: string
  }

  interface FrequencyData {
    number: string
    character: string
    count: string
    percentage: string
    pinyin: string
    meaning: string
  }

  interface PhoneticRegularityResult {
    [pinyin: string]: {
      character: string
      component: string[]
      phoneticpinyin: string[]
      regularity: number[]
    }
  }

  interface Hanzi {
    start(): void
    decompose(character: string, type?: 1 | 2 | 3): DecompositionResult
    decomposeMany(
      characters: string,
      type?: 1 | 2 | 3,
    ): { [key: string]: DecompositionResult }
    ifComponentExists(component: string): boolean
    definitionLookup(character: string, scriptType?: "s" | "t"): Definition[]
    dictionarySearch(
      characters: string,
      searchType?: "only" | null,
    ): Definition[][]
    getExamples(character: string): Definition[][]
    segment(phrase: string): string[]
    getPinyin(character: string): string[]
    getCharacterFrequency(character: string): FrequencyData
    getCharacterInFrequencyListByPosition(position: number): FrequencyData
    getCharactersWithComponent(component: string): string[]

    getRadicalMeaning(radical: string): string
    determinePhoneticRegularity(
      input: string | DecompositionResult,
    ): PhoneticRegularityResult
  }

  const hanzi: Hanzi
  export default hanzi
}
