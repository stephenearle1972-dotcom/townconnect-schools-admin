import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type Props = {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}

export function ChipsInput({ value, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState('')

  const add = (raw: string) => {
    const next = raw.trim()
    if (!next) return
    if (value.includes(next)) return
    onChange([...value, next])
    setDraft('')
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const remove = (item: string) => onChange(value.filter((v) => v !== item))

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {value.map((item) => (
          <Badge key={item} variant="secondary" className="gap-1">
            {item}
            <button type="button" onClick={() => remove(item)} aria-label={`Remove ${item}`}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => add(draft)}
        placeholder={placeholder ?? 'Type and press Enter or comma'}
      />
    </div>
  )
}
