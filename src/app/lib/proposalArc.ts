// Arcs « à proposer » : ce ne sont pas de vrais arcs jouables. Pour ceux-ci,
// le panneau n'affiche pas l'onglet Serveur et le bouton Jouer devient
// « Proposer un arc » (ouvre un channel Discord, sans installation ni
// paramètres). Liste maintenue en dur par slug.
const PROPOSAL_ARC_SLUGS = new Set(['arc-undefined'])

// TODO: remplacer par le lien du channel Discord « proposer un arc ».
export const PROPOSE_ARC_DISCORD_URL = 'https://discord.gg/CgMdQsptNW'

export function isProposalArc(slug: string | null | undefined): boolean {
  return !!slug && PROPOSAL_ARC_SLUGS.has(slug)
}
