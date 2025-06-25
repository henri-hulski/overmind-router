export type ParamsT = Record<string, string>

export type RouteConfigT = {
  params?: string[]
}

export type RoutesT = Record<string, RouteConfigT>

export type ParsedRouteT = {
  pattern: string
  path?: string
  params?: ParamsT
  routeParams?: ParamsT
}

export function matchRoute(
  pattern: string,
  path: string
): { match: boolean; params: ParamsT } {
  const patternParts = pattern.split('/')
  const pathParts = path.split('/')

  if (patternParts.length !== pathParts.length) {
    return { match: false, params: {} }
  }

  const params: ParamsT = {}

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]
    const pathPart = pathParts[i]

    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = pathPart
    } else if (patternPart !== pathPart) {
      return { match: false, params: {} }
    }
  }

  return { match: true, params }
}

function findMatchingRoute(
  path: string,
  routes: RoutesT
): { pattern: string; routeParams: ParamsT } | null {
  for (const pattern of Object.keys(routes)) {
    const { match, params } = matchRoute(pattern, path)
    if (match) {
      return { pattern, routeParams: params }
    }
  }
  return null
}

function buildPath(pattern: string, routeParams: ParamsT): string {
  let path = pattern
  for (const [key, value] of Object.entries(routeParams)) {
    path = path.replace(`:${key}`, value)
  }
  return path
}

export const router = {
  getBaseUrl(): string {
    return (location.origin + import.meta.env.BASE_URL).replace(/\/$/, '')
  },

  getCurrentPath(): string {
    try {
      const url = new URL(location.href)
      const path = url.pathname.replace(/\/$/, '')
      return path === '' ? '/' : path
    } catch (error) {
      console.error('Error getting current path:', error)
      return '/'
    }
  },

  getCurrentPathWithParams(): string {
    try {
      const url = new URL(location.href)
      let path = url.pathname.replace(/\/$/, '')
      if (path === '') path = '/'

      if (url.search) {
        path += url.search
      }

      return path
    } catch (error) {
      console.error('Error getting current path with params:', error)
      return '/'
    }
  },

  getCurrentRoute(routes: RoutesT): ParsedRouteT | null {
    try {
      const url = new URL(location.href)
      let path = url.pathname.replace(/\/$/, '')
      path = path === '' ? '/' : path

      const matchResult = findMatchingRoute(path, routes)
      if (!matchResult) {
        return null
      }

      const { pattern, routeParams } = matchResult
      const routeConfig = routes[pattern]
      const expectedParams = routeConfig?.params || []

      const queryParams: ParamsT = {}
      const urlParams = new URLSearchParams(url.search)

      for (const paramName of expectedParams) {
        const value = urlParams.get(paramName)
        if (value !== null) {
          queryParams[paramName] = value
        }
      }

      return {
        pattern,
        path,
        params: queryParams,
        routeParams,
      }
    } catch (error) {
      console.error('Error parsing route from URL:', error)
      return null
    }
  },

  getUrlFromRoute(
    pattern: string,
    routeParams: ParamsT = {},
    params: ParamsT = {}
  ): string {
    const path = buildPath(pattern, routeParams)
    let url = this.getBaseUrl() + path

    if (Object.keys(params).length > 0) {
      const urlParams = new URLSearchParams(params)
      url += '?' + urlParams.toString()
    }
    return url
  },

  setUrlFromRoute(
    pattern: string,
    routeParams: ParamsT = {},
    params: ParamsT = {}
  ): void {
    const url = this.getUrlFromRoute(pattern, routeParams, params)
    history.replaceState({}, '', url)
  },

  navigateTo(
    pattern: string,
    routeParams: ParamsT = {},
    params: ParamsT = {}
  ): void {
    const url = this.getUrlFromRoute(pattern, routeParams, params)
    history.pushState({}, '', url)
  },

  navigateToUrl(url: string): void {
    if (this.isValidUrl(url)) {
      history.pushState({}, '', url)
    } else {
      console.error('Invalid URL:', url)
    }
  },

  navigateBack(): void {
    history.back()
  },

  navigateForward(): void {
    history.forward()
  },

  redirectTo(
    pattern: string,
    routeParams: ParamsT = {},
    params: ParamsT = {}
  ): void {
    const url = this.getUrlFromRoute(pattern, routeParams, params)
    location.href = url
  },

  redirectToUrl(url: string): void {
    if (this.isValidUrl(url)) {
      location.href = url
    } else {
      console.error('Invalid URL:', url)
    }
  },

  replaceUrlWithParams(
    pattern: string,
    routeParams: ParamsT = {},
    params: ParamsT = {}
  ): void {
    this.setUrlFromRoute(pattern, routeParams, params)
  },

  isValidUrl(url: string): boolean {
    try {
      new URL(url, this.getBaseUrl())
      return true
    } catch {
      return false
    }
  },

  isExternalUrl(url: string): boolean {
    try {
      const urlObj = new URL(url, this.getBaseUrl())
      return urlObj.origin !== location.origin
    } catch {
      return false
    }
  },

  validateRoute(pattern: string, routes: RoutesT): boolean {
    return pattern in routes
  },

  getRoutePatterns(routes: RoutesT): string[] {
    return Object.keys(routes)
  },
}
