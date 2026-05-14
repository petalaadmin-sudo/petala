'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugPage() {
  const supabase = createClient()
  const [info, setInfo] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setInfo({ erro: 'sem usuario logado' }); return }

      const { data: userData } = await supabase
        .from('users')
        .select('email, role')
        .eq('id', user.id)
        .single()

      setInfo({ user_id: user.id, email: user.email, role: userData?.role })
    }
    load()
  }, [])

  return (
    <div className="p-8 text-white">
      <pre>{JSON.stringify(info, null, 2)}</pre>
    </div>
  )
}