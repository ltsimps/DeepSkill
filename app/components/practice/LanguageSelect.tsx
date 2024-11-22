import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import type { ProgrammingLanguage } from '~/types/practice'
import { SUPPORTED_LANGUAGES } from '~/utils/language'

interface LanguageSelectProps {
  value: ProgrammingLanguage
  onChange: (value: ProgrammingLanguage) => void
}

export function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  const languageLabels: Record<ProgrammingLanguage, string> = {
    python: '🐍 Python'
  } as const

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map(lang => (
          <SelectItem key={lang} value={lang}>
            {languageLabels[lang]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
