export default function Arc({
  src,
  installed,
  showOverlay = true,
}: {
  src: string
  installed: boolean
  showOverlay?: boolean
}) {
  return (
    <div
      className="w-full aspect-square rounded-lg flex justify-center items-center relative group cursor-pointer active:scale-95 transition-transform duration-150"
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      <img src={src} alt="" className="rounded-lg w-full aspect-square" />
      {showOverlay && !installed && (
        <div className="absolute inset-0 bg-black/40 rounded-lg group-hover:bg-black/50 transition-all duration-300" />
      )}
    </div>
  )
}
