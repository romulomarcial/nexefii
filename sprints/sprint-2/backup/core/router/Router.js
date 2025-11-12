/**
 * NEXEFII Router - SPA Multi-Tenant Routing System
 * 
 * Provides intelligent routing for multi-property architecture with:
 * - Dynamic URL patterns (/property/{slug})
 * - Route guards (authentication, authorization)
 * - Property context resolution (slug → property object)
 * - Integration with PropertyDatabase
 * - History API management
 * - Middleware pipeline
 * 
 * @version 1.0.0
 * @date 2025-11-08
 */

class Router {
  /**
   * Initialize Router
   * @param {Object} options - Configuration options
   * @param {string} options.mode - 'hash' or 'history' (default: 'history')
   * @param {string} options.root - Base path (default: '/')
   * @param {boolean} options.debug - Enable debug logs (default: false)
   */
  constructor(options = {}) {
    this.mode = options.mode || 'history';
    this.root = options.root || '/';
    this.debug = options.debug || false;
    
    // Route registry
    this.routes = [];
    
    // Middleware registry
    this.globalMiddleware = [];
    
    // Current state
    this.currentRoute = null;
    this.currentParams = {};
    this.currentProperty = null;
    
    // Route guards
    this.guards = {
      auth: null,
      propertyAccess: null,
      custom: []
    };
    
    // Property resolver function
    this.propertyResolver = null;
    
    // 404 handler
    this.notFoundHandler = null;
    
    // Navigation hooks
    this.beforeNavigate = [];
    this.afterNavigate = [];
    
    this._log('Router initialized', { mode: this.mode, root: this.root });
  }
  
  /**
   * Register a route
   * @param {string} path - Route pattern (e.g., '/property/:slug/dashboard')
   * @param {Function} handler - Route handler function
   * @param {Object} options - Route options (guards, middleware, meta)
   */
  route(path, handler, options = {}) {
    const route = {
      path: this._normalizePath(path),
      pattern: this._pathToRegex(path),
      handler,
      guards: options.guards || [],
      middleware: options.middleware || [],
      meta: options.meta || {},
      name: options.name || null
    };
    
    this.routes.push(route);
    this._log('Route registered', { path, name: route.name });
    
    return this; // Chainable
  }
  
  /**
   * Register multiple routes at once
   * @param {Array} routes - Array of route configurations
   */
  routes(routes) {
    routes.forEach(config => {
      this.route(config.path, config.handler, config);
    });
    return this;
  }
  
  /**
   * Set property resolver function
   * @param {Function} resolver - Function that resolves slug to property object
   */
  setPropertyResolver(resolver) {
    if (typeof resolver !== 'function') {
      throw new Error('Property resolver must be a function');
    }
    this.propertyResolver = resolver;
    this._log('Property resolver set');
    return this;
  }
  
  /**
   * Set authentication guard
   * @param {Function} guard - Function that checks if user is authenticated
   */
  setAuthGuard(guard) {
    if (typeof guard !== 'function') {
      throw new Error('Auth guard must be a function');
    }
    this.guards.auth = guard;
    this._log('Auth guard set');
    return this;
  }
  
  /**
   * Set property access guard
   * @param {Function} guard - Function that checks if user can access property
   */
  setPropertyAccessGuard(guard) {
    if (typeof guard !== 'function') {
      throw new Error('Property access guard must be a function');
    }
    this.guards.propertyAccess = guard;
    this._log('Property access guard set');
    return this;
  }
  
  /**
   * Add global middleware (runs on every route)
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }
    this.globalMiddleware.push(middleware);
    this._log('Global middleware added');
    return this;
  }
  
  /**
   * Set 404 handler
   * @param {Function} handler - Handler for not found routes
   */
  notFound(handler) {
    this.notFoundHandler = handler;
    return this;
  }
  
  /**
   * Navigate to a path
   * @param {string} path - Path to navigate to
   * @param {Object} options - Navigation options
   * @returns {Promise<boolean>} - Success status
   */
  async navigate(path, options = {}) {
    const normalizedPath = this._normalizePath(path);
    
    this._log('Navigation requested', { path: normalizedPath });
    
    // Run before navigate hooks
    for (const hook of this.beforeNavigate) {
      const result = await hook(normalizedPath, this.currentRoute);
      if (result === false) {
        this._log('Navigation cancelled by beforeNavigate hook');
        return false;
      }
    }
    
    // Update browser history
    if (!options.replace) {
      if (this.mode === 'history') {
        window.history.pushState({ path: normalizedPath }, '', normalizedPath);
      } else {
        window.location.hash = normalizedPath;
      }
    } else {
      if (this.mode === 'history') {
        window.history.replaceState({ path: normalizedPath }, '', normalizedPath);
      } else {
        window.location.replace('#' + normalizedPath);
      }
    }
    
    // Handle the route
    const success = await this._handleRoute(normalizedPath);
    
    // Run after navigate hooks
    for (const hook of this.afterNavigate) {
      await hook(normalizedPath, this.currentRoute, success);
    }
    
    return success;
  }
  
  /**
   * Go back in history
   */
  back() {
    window.history.back();
  }
  
  /**
   * Go forward in history
   */
  forward() {
    window.history.forward();
  }
  
  /**
   * Navigate by route name
   * @param {string} name - Route name
   * @param {Object} params - Route parameters
   */
  async navigateByName(name, params = {}) {
    const route = this.routes.find(r => r.name === name);
    if (!route) {
      throw new Error(`Route with name "${name}" not found`);
    }
    
    // Build path from pattern and params
    let path = route.path;
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, value);
    }
    
    return this.navigate(path);
  }
  
  /**
   * Start the router (listen to navigation events)
   */
  start() {
    // Handle popstate (back/forward buttons)
    window.addEventListener('popstate', (event) => {
      const path = this.mode === 'history' 
        ? window.location.pathname 
        : window.location.hash.slice(1);
      
      this._handleRoute(path);
    });
    
    // Handle initial route
    const initialPath = this.mode === 'history'
      ? window.location.pathname
      : window.location.hash.slice(1) || '/';
    
    this._handleRoute(initialPath);
    
    // Intercept link clicks
    document.addEventListener('click', (event) => {
      // Find closest <a> tag
      const link = event.target.closest('a');
      if (!link) return;
      
      // Check if it's an internal link
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('//') || href.startsWith('#')) {
        return;
      }
      
      // Check if it has data-router-ignore
      if (link.hasAttribute('data-router-ignore')) {
        return;
      }
      
      // Prevent default and navigate
      event.preventDefault();
      this.navigate(href);
    });
    
    this._log('Router started');
  }
  
  /**
   * Get current route information
   * @returns {Object} - Current route info
   */
  getCurrentRoute() {
    return {
      route: this.currentRoute,
      params: this.currentParams,
      property: this.currentProperty,
      path: this.mode === 'history' 
        ? window.location.pathname 
        : window.location.hash.slice(1)
    };
  }
  
  /**
   * Check if a path matches current route
   * @param {string} path - Path to check
   * @returns {boolean}
   */
  isActive(path) {
    const currentPath = this.mode === 'history'
      ? window.location.pathname
      : window.location.hash.slice(1);
    
    return this._normalizePath(currentPath) === this._normalizePath(path);
  }
  
  /**
   * Add before navigate hook
   * @param {Function} hook - Hook function
   */
  beforeEach(hook) {
    this.beforeNavigate.push(hook);
    return this;
  }
  
  /**
   * Add after navigate hook
   * @param {Function} hook - Hook function
   */
  afterEach(hook) {
    this.afterNavigate.push(hook);
    return this;
  }
  
  // ============================================================
  // PRIVATE METHODS
  // ============================================================
  
  /**
   * Handle route matching and execution
   * @private
   */
  async _handleRoute(path) {
    const normalizedPath = this._normalizePath(path);
    
    // Find matching route
    let matchedRoute = null;
    let params = {};
    
    for (const route of this.routes) {
      const match = normalizedPath.match(route.pattern);
      if (match) {
        matchedRoute = route;
        params = this._extractParams(route.path, match);
        break;
      }
    }
    
    // No match found
    if (!matchedRoute) {
      this._log('No route matched', { path: normalizedPath });
      if (this.notFoundHandler) {
        await this.notFoundHandler(normalizedPath);
      }
      return false;
    }
    
    this._log('Route matched', { path: normalizedPath, name: matchedRoute.name });
    
    // Extract property slug if present
    const propertySlug = params.slug || params.property || null;
    let property = null;
    
    // Resolve property
    if (propertySlug && this.propertyResolver) {
      try {
        property = await this.propertyResolver(propertySlug);
        if (!property) {
          this._log('Property not found', { slug: propertySlug });
          if (this.notFoundHandler) {
            await this.notFoundHandler(normalizedPath, 'property_not_found');
          }
          return false;
        }
      } catch (error) {
        this._log('Property resolver error', { error: error.message });
        throw error;
      }
    }
    
    // Run auth guard
    if (this.guards.auth) {
      const isAuthenticated = await this.guards.auth();
      if (!isAuthenticated) {
        this._log('Auth guard failed');
        // Redirect to login or show error
        this.navigate('/login', { replace: true });
        return false;
      }
    }
    
    // Run property access guard
    if (property && this.guards.propertyAccess) {
      const hasAccess = await this.guards.propertyAccess(property);
      if (!hasAccess) {
        this._log('Property access guard failed', { slug: propertySlug });
        if (this.notFoundHandler) {
          await this.notFoundHandler(normalizedPath, 'access_denied');
        }
        return false;
      }
    }
    
    // Run route-specific guards
    for (const guard of matchedRoute.guards) {
      const result = await guard(params, property);
      if (result === false) {
        this._log('Route guard failed');
        return false;
      }
    }
    
    // Build context
    const context = {
      params,
      property,
      route: matchedRoute,
      path: normalizedPath,
      query: this._parseQuery()
    };
    
    // Run global middleware
    for (const middleware of this.globalMiddleware) {
      await middleware(context);
    }
    
    // Run route-specific middleware
    for (const middleware of matchedRoute.middleware) {
      await middleware(context);
    }
    
    // Update current state
    this.currentRoute = matchedRoute;
    this.currentParams = params;
    this.currentProperty = property;
    
    // Execute handler
    try {
      await matchedRoute.handler(context);
      this._log('Route handler executed', { path: normalizedPath });
      return true;
    } catch (error) {
      this._log('Route handler error', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Convert path pattern to regex
   * @private
   */
  _pathToRegex(path) {
    // Escape special regex characters except :
    let pattern = path.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    
    // Replace :param with capture group
    pattern = pattern.replace(/:(\w+)/g, '([^/]+)');
    
    // Add start and end anchors
    pattern = '^' + pattern + '$';
    
    return new RegExp(pattern);
  }
  
  /**
   * Extract parameters from matched route
   * @private
   */
  _extractParams(pathPattern, match) {
    const params = {};
    const paramNames = pathPattern.match(/:(\w+)/g) || [];
    
    paramNames.forEach((paramName, index) => {
      const name = paramName.slice(1); // Remove :
      params[name] = match[index + 1]; // match[0] is full match
    });
    
    return params;
  }
  
  /**
   * Normalize path (remove trailing slash, etc.)
   * @private
   */
  _normalizePath(path) {
    if (!path) return '/';
    
    // Remove hash if present
    if (path.startsWith('#')) {
      path = path.slice(1);
    }
    
    // Ensure starts with /
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // Remove trailing slash (except root)
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    return path;
  }
  
  /**
   * Parse query string
   * @private
   */
  _parseQuery() {
    const queryString = window.location.search.slice(1);
    if (!queryString) return {};
    
    const params = {};
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
    
    return params;
  }
  
  /**
   * Debug logger
   * @private
   */
  _log(message, data = {}) {
    if (this.debug) {
      console.log(`[Router] ${message}`, data);
    }
  }
}

// ============================================================
// STATIC HELPER METHODS
// ============================================================

/**
 * Create a router instance with default configuration
 * @param {Object} options - Configuration options
 * @returns {Router}
 */
Router.create = function(options = {}) {
  return new Router(options);
};

/**
 * Build URL with parameters
 * @param {string} pattern - URL pattern (e.g., '/property/:slug/dashboard')
 * @param {Object} params - Parameters to fill in
 * @returns {string} - Built URL
 */
Router.buildUrl = function(pattern, params = {}) {
  let url = pattern;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, encodeURIComponent(value));
  }
  return url;
};

/**
 * Parse URL and extract parameters
 * @param {string} url - URL to parse
 * @param {string} pattern - Pattern to match against
 * @returns {Object|null} - Extracted parameters or null if no match
 */
Router.parseUrl = function(url, pattern) {
  const regex = new RegExp(
    '^' + pattern.replace(/:(\w+)/g, '([^/]+)') + '$'
  );
  
  const match = url.match(regex);
  if (!match) return null;
  
  const paramNames = pattern.match(/:(\w+)/g) || [];
  const params = {};
  
  paramNames.forEach((name, index) => {
    params[name.slice(1)] = decodeURIComponent(match[index + 1]);
  });
  
  return params;
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Router;
}

console.log('✅ Router.js loaded (v1.0.0)');
