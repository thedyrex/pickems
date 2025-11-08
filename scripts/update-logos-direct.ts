import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function updateLogos() {
  console.log('Connecting to Supabase...')
  console.log('URL:', supabaseUrl)

  // Update T1
  console.log('\nUpdating T1...')
  const { data: t1Data, error: t1Error } = await supabase
    .from('teams')
    .update({ logo: '/logos/t1.png' })
    .eq('id', 't1')
    .select()

  if (t1Error) {
    console.error('T1 Error:', t1Error)
  } else {
    console.log('T1 updated:', t1Data)
  }

  // Update Team CC
  console.log('\nUpdating Team CC...')
  const { data: ccData, error: ccError } = await supabase
    .from('teams')
    .update({ logo: '/logos/team-cc.png' })
    .eq('id', 'team-cc')
    .select()

  if (ccError) {
    console.error('Team CC Error:', ccError)
  } else {
    console.log('Team CC updated:', ccData)
  }

  // Verify
  console.log('\nVerifying...')
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .in('id', ['t1', 'team-cc'])

  console.log('Current data:', teams)

  process.exit(0)
}

updateLogos()
