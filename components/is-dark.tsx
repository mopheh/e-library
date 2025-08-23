import { useEffect, useState } from "react"

export function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const classList = document.documentElement.classList
    const checkDark = () => setIsDark(classList.contains("dark"))
    checkDark()

    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true })

    return () => observer.disconnect()
  }, [])

  return isDark
}
