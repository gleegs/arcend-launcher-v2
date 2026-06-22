// Icône Discord — Meteor Icons (identique au site arcend.fr).
export default function DiscordIcon({
  size = 24,
  color = 'currentColor',
}: {
  size?: number
  color?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="M9 3q-2.5.5-5 2q-3 5-3 12q2 2.5 6 4q1-1.5 1.5-3.5M7 17q5 2 10 0m-1.5.5q.5 2 1.5 3.5q4-1.5 6-4q0-7-3-12q-2.5-1.5-5-2l-1 2q-2-.5-4 0L9 3" />
        <circle cx="8" cy="12" r="1" />
        <circle cx="16" cy="12" r="1" />
      </g>
    </svg>
  )
}
