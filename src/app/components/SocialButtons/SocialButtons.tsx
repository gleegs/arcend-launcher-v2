import DiscordIcon from '../../assets/icon/discord-icon.svg?react'
import WebIcon from '../../assets/icon/web-icon.svg?react'
import Button from '../Button/Button'

const DISCORD_URL = 'https://discord.gg/nkUZCTJyu8'
const WEBSITE_URL = 'https://www.arcend.fr'

export default function SocialButtons() {
  return (
    <div className="gap-3 absolute top-2/5 right-0 p-8 flex flex-col">
      <Button className="p-2">
        <a href={WEBSITE_URL} target="_blank" rel="noopener noreferrer">
          <WebIcon />
        </a>
      </Button>
      <Button className="p-2">
        <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
          <DiscordIcon />
        </a>
      </Button>
    </div>
  )
}
