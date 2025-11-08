import { updateTeamLogo, TEAM_IDS } from '../lib/teams'

async function updateLogos() {
  console.log('Updating team logos...')

  // Update T1 logo
  const t1Success = await updateTeamLogo(TEAM_IDS.t1, '/logos/t1.png')
  if (t1Success) {
    console.log('✓ T1 logo updated successfully')
  } else {
    console.error('✗ Failed to update T1 logo')
  }

  // Update Team CC logo
  const teamCCSuccess = await updateTeamLogo(TEAM_IDS.teamCC, '/logos/team-cc.png')
  if (teamCCSuccess) {
    console.log('✓ Team CC logo updated successfully')
  } else {
    console.error('✗ Failed to update Team CC logo')
  }

  console.log('Logo update complete!')
  process.exit(0)
}

updateLogos()
