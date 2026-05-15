'use client'

import { useEffect } from 'react'

export default function OneSignalInit() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    if (!appId) return

    const script = document.createElement('script')
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
    script.defer = true
    document.head.appendChild(script)

    script.onload = () => {
      ;(window as any).OneSignalDeferred = (window as any).OneSignalDeferred || []
      ;(window as any).OneSignalDeferred.push(async function (OneSignal: any) {
        await OneSignal.init({
          appId,
          notifyButton: { enable: false },
          promptOptions: {
            slidedown: {
              prompts: [
                {
                  type: 'push',
                  autoPrompt: true,
                  text: {
                    actionMessage: '🌸 Ative as notificações para saber quando suas criadoras favoritas estão online!',
                    acceptButton: 'Ativar',
                    cancelButton: 'Agora não',
                  },
                  delay: {
                    pageViews: 1,
                    timeDelay: 5,
                  },
                },
              ],
            },
          },
        })
      })
    }
  }, [])

  return null
}