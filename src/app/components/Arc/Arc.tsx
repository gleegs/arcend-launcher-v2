export default function Arc({ src }: { src: string }) {
  return (
    <div
      className="w-full aspect-square rounded-lg flex justify-center items-center relative group cursor-pointer active:scale-95 transition-transform duration-150"
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      <img src={src} alt="" className="rounded-lg w-full aspect-square" />
    </div>
  )
}
