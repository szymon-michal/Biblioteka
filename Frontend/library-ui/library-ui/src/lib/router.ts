import { useEffect, useMemo, useState } from 'react'

function getHashPath() {
  const raw = window.location.hash.replace(/^#/, '')
  return raw || ''
}

export function useHashRoute<T extends string>(defaultRoute: T) {
  const [path, setPath] = useState(() => getHashPath())

  useEffect(() => {
    const onHashChange = () => setPath(getHashPath())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const route = useMemo(() => {
    const clean = (path || '').split('?')[0].replace(/^\//, '')
    return ((clean || defaultRoute) as unknown) as T
  }, [path, defaultRoute])

  function navigate(next: T) {
    window.location.hash = `#/${next}`
  }

  return { route, navigate, raw: path }
}
