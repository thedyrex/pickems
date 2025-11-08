import { updateTeamLogo, TEAM_IDS } from '../lib/teams'

async function updateAllLogos() {
  console.log('Updating all team logos...\n')

  const logoUpdates = [
    { id: TEAM_IDS.spacestation, path: '/logos/spacestation.png', name: 'Spacestation' },
    { id: TEAM_IDS.teamPeps, path: '/logos/team-peps.png', name: 'Team Peps' },
    { id: TEAM_IDS.crazyRaccoon, path: '/logos/crazy-racoon.png', name: 'Crazy Raccoon' },
    { id: TEAM_IDS.geekayEsports, path: '/logos/geekay-esports.png', name: 'Geekay Esports' },
    { id: TEAM_IDS.weiboGaming, path: '/logos/weibo-gaming.png', name: 'Weibo Gaming' },
    { id: TEAM_IDS.teamCC, path: '/logos/team-cc.png', name: 'Team CC' },
    { id: TEAM_IDS.t1, path: '/logos/t1.png', name: 'T1' },
    { id: TEAM_IDS.twistedMinds, path: '/logos/twisted-minds.png', name: 'Twisted Minds' },
    { id: TEAM_IDS.teamFalcons, path: '/logos/team-falcons.png', name: 'Team Falcons' },
    { id: TEAM_IDS.varrel, path: '/logos/varrel.png', name: 'VARREL' },
    { id: TEAM_IDS.teamLiquid, path: '/logos/team-liquid.png', name: 'Team Liquid' },
  ]

  let successCount = 0
  let failCount = 0

  for (const { id, path, name } of logoUpdates) {
    const success = await updateTeamLogo(id, path)
    if (success) {
      console.log(`✓ ${name} logo updated successfully`)
      successCount++
    } else {
      console.error(`✗ Failed to update ${name} logo`)
      failCount++
    }
  }

  console.log(`\nUpdate complete! ${successCount} successful, ${failCount} failed`)

  if (failCount > 0) {
    console.log('\nNote: Updates may fail due to RLS policies. You may need to:')
    console.log('1. Run the SQL migration in Supabase dashboard')
    console.log('2. Or sign in to the app first and run this as an authenticated user')
  }

  process.exit(failCount > 0 ? 1 : 0)
}

updateAllLogos()
