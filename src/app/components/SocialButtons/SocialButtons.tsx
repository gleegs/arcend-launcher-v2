import { Globe } from 'lucide-react'
import DiscordIcon from '../DiscordIcon/DiscordIcon'

const DISCORD_URL = 'https://discord.gg/Pt4EQjN2gm'
const WEBSITE_URL = 'https://www.arcend.fr'

const linkClassName =
  'bg-black rounded-full cursor-pointer border border-transparent hover:border-white transition-colors duration-250 shadow-button p-2'

export default function SocialButtons() {
  return (
    <div className="gap-3 absolute top-2/5 right-0 p-8 flex flex-col">
      <a
        href={WEBSITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <Globe color="#fff" />
      </a>
      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <DiscordIcon color="#fff" />
      </a>
    </div>
  )
}
