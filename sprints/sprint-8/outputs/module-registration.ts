export interface ModuleLicense {
  type: 'free' | 'trial' | 'licensed';
  sku?: string;
  exp?: string; // ISO date-time
}

export interface ModuleRegistration {
  id: string; // machine id - lowercase, hyphen or underscore
  name: string;
  version: string;
  category: 'PMS' | 'CMS' | 'BMS' | 'EMS' | 'COMMON';
  description?: string;
  openapi?: string; // url to OpenAPI fragment
  uiBundle?: string; // url to JS/HTML bundle
  license?: ModuleLicense;
  requiredRoles?: string[];
}

// Example usage:
// const mod: ModuleRegistration = { id: 'pms-door-lock', name: 'Door Lock', version: '0.1.0', category: 'PMS' };
