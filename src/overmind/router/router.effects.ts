export type ParamsT = Record<string, string>

export type RouteConfigT = {
  params?: string[]
}

export type RoutesT = Record<string, RouteConfigT>

type BaseRouteT = {
  pattern: string
  params?: ParamsT
  routeParams?: ParamsT
}

export type ParsedRouteT = BaseRouteT & {
  path: string
}

export type RouteT = string | BaseRouteT

function findMatchingRoute(
  path: string,
  routes: RoutesT
): { pattern: string; routeParams: ParamsT } | null {
  for (const pattern of Object.keys(routes)) {
    const { match, params } = router.matchRoute(pattern, path)
    if (match) {
      return { pattern, routeParams: params }
    }
  }
  return null
}

function buildPath(
  pattern: string,
  params: ParamsT,
  routeParams: ParamsT
): string {
  let path = pattern
  for (const [key, value] of Object.entries(routeParams)) {
    path = path.replace(`:${key}`, value)
  }
  if (Object.keys(params).length > 0) {
    const pathParams = new URLSearchParams(params)
    path += '?' + pathParams.toString()
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

  getRouteFromUrl(url: string, routes: RoutesT): ParsedRouteT | null {
    try {
      const urlObj = new URL(url, this.getBaseUrl())
      let path = urlObj.pathname.replace(/\/$/, '')
      path = path === '' ? '/' : path

      const matchResult = findMatchingRoute(path, routes)
      if (!matchResult) {
        return null
      }

      const { pattern, routeParams } = matchResult
      const routeConfig = routes[pattern]
      const expectedParams = routeConfig?.params || []

      // Build result object conditionally
      const result: ParsedRouteT = {
        pattern,
        path,
      }

      // Include routeParams if there are route parameters in the URL path
      if (routeParams && Object.keys(routeParams).length > 0) {
        result.routeParams = routeParams
      }

      // Include params if the route configuration defines query params
      if (expectedParams.length > 0) {
        const queryParams: ParamsT = {}
        const urlParams = new URLSearchParams(urlObj.search)

        for (const paramName of expectedParams) {
          const value = urlParams.get(paramName)
          if (value !== null) {
            queryParams[paramName] = value
          }
        }

        result.params = queryParams
      }

      return result
    } catch (error) {
      console.error('Error parsing route from URL:', error)
      return null
    }
  },

  getCurrentRoute(routes: RoutesT): ParsedRouteT | null {
    return this.getRouteFromUrl(location.href, routes)
  },

  getUrlFromRoute(
    pattern: string,
    params: ParamsT = {},
    routeParams: ParamsT = {}
  ): string {
    const path = buildPath(pattern, params, routeParams)
    return this.getBaseUrl() + path
  },

  setUrlFromRoute(
    pattern: string,
    params: ParamsT = {},
    routeParams: ParamsT = {}
  ): void {
    const url = this.getUrlFromRoute(pattern, params, routeParams)
    history.replaceState({}, '', url)
  },

  navigateTo(
    pattern: string,
    params: ParamsT = {},
    routeParams: ParamsT = {}
  ): void {
    const url = this.getUrlFromRoute(pattern, params, routeParams)
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
    params: ParamsT = {},
    routeParams: ParamsT = {}
  ): void {
    const url = this.getUrlFromRoute(pattern, params, routeParams)
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
    params: ParamsT = {},
    routeParams: ParamsT = {}
  ): void {
    this.setUrlFromRoute(pattern, params, routeParams)
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

  parseRoute(routeTo: RouteT, routes: RoutesT): ParsedRouteT {
    // Handle string input by parsing URL
    if (typeof routeTo === 'string') {
      const parsedRoute = this.getRouteFromUrl(routeTo, routes)
      if (parsedRoute) {
        const result: ParsedRouteT = {
          pattern: parsedRoute.pattern,
          path: routeTo,
        }

        if (parsedRoute.params !== undefined) {
          result.params = parsedRoute.params
        }

        if (parsedRoute.routeParams !== undefined) {
          result.routeParams = parsedRoute.routeParams
        }

        return result
      } else {
        // If parsing fails, treat as simple pattern
        const [pathPart] = routeTo.split('?')
        return {
          pattern: pathPart,
          path: routeTo,
        }
      }
    }
    const route = routeTo as ParsedRouteT
    const path = buildPath(
      route.pattern,
      route.params || {},
      route.routeParams || {}
    )
    route.path = path

    return route
  },

  matchRoute(
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
  },

  getRoutePatterns(routes: RoutesT): string[] {
    return Object.keys(routes)
  },
}
