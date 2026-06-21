import DiscordIcon from '../../assets/icon/discord-icon.svg?react'
import WebIcon from '../../assets/icon/web-icon.svg?react'

const DISCORD_URL = 'https://discord.gg/nkUZCTJyu8'
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
        <WebIcon />
      </a>
      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <DiscordIcon />
      </a>
    </div>
  )
}
