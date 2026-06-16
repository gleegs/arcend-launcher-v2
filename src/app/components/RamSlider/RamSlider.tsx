export default function RamSlider({
  value,
  onChange,
}: {
  value: number
  onChange: (gb: number) => void
}) {
  const min = 2
  const max = 16
  const percent = ((value - min) / (max - min)) * 100

  return (
    <div className="w-full">
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ram-slider w-full h-2 cursor-pointer"
        style={{
          WebkitAppRegion: 'no-drag',
          background: `linear-gradient(90deg, #12B95D ${percent}%, var(--color-white) ${percent}%)`,
        }}
      />
      <div className="flex justify-between text-xs text-white/50">
        <span className=" text-[10px]">Séléctionné : {value} Go (conseillé : 8 Go)</span>
      </div>
    </div>
  )
}
