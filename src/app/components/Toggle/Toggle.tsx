export default function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer ${
        checked ? 'bg-[#12B95D]' : 'bg-white/50'
      }`}
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      <span
        className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white"
        style={{
          transform: checked ? 'translateX(1.25rem)' : 'translateX(0)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />
    </button>
  )
}
