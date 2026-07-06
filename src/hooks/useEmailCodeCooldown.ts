import { useCallback, useEffect, useState } from 'react'
import type { SendCodePurpose } from '../types'
import {
  EMAIL_CODE_COOLDOWN_SECONDS,
  getEmailCodeCooldownRemaining,
  recordEmailCodeSent,
} from '../storage/emailCodeCooldown'

export function useEmailCodeCooldown(purpose: SendCodePurpose, email: string) {
  const [cooldown, setCooldown] = useState(() => getEmailCodeCooldownRemaining(purpose, email))

  useEffect(() => {
    setCooldown(getEmailCodeCooldownRemaining(purpose, email))
  }, [purpose, email])

  useEffect(() => {
    if (cooldown <= 0) return

    const timer = window.setInterval(() => {
      setCooldown(getEmailCodeCooldownRemaining(purpose, email))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [cooldown, purpose, email])

  const startCooldown = useCallback(() => {
    recordEmailCodeSent(purpose, email)
    setCooldown(EMAIL_CODE_COOLDOWN_SECONDS)
  }, [purpose, email])

  return { cooldown, startCooldown }
}
