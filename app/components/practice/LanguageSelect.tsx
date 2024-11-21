import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import type { SupportedLanguage } from '~/routes/practice'
import { SUPPORTED_LANGUAGES } from '~/routes/practice'

interface LanguageSelectProps {
  value: SupportedLanguage
  onChange: (value: SupportedLanguage) => void
}

export function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  const languageLabels = {
    python: '🐍 Python',
    cpp: '⚡ C++',
  }

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
