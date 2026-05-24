'use client'

type Props = {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  disabled?: boolean
}

export default function Switch({ checked, onChange, label, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full',
        'transition-colors duration-200 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
        checked ? 'bg-[var(--accent)]' : 'bg-[var(--border)]',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ].join(' ')}
    >
      <span
        aria-hidden
        className={[
          'pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow ring-0',
          'transform transition-transform duration-200 ease-out',
          'absolute top-0.5',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        ].join(' ')}
      />
    </button>
  )
}
