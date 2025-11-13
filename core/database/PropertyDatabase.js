/**
 * PropertyDatabase - Multi-Tenant Data Isolation System
 * 
 * Provides complete data isolation per property with:
 * - Isolated localStorage namespace per property
 * - Schema versioning and migrations
 * - CRUD operations with automatic timestamping
 * - Data validation and integrity checks
 * - Backup and restore capabilities
 * 
 * @version 1.0.0
 * @date 2025-11-08
 * @author NEXEFII Development Team
 */
if (typeof PropertyDatabase === 'undefined') {
class PropertyDatabase {
  /**
   * Creates a database instance for a specific property
   * @param {string} propertyKey - Unique identifier for the property (e.g., 'modelhotel', 'demo-luxury')
   */
  constructor(propertyKey) {
    if (!propertyKey || typeof propertyKey !== 'string') {
      throw new Error('PropertyDatabase: propertyKey is required and must be a string');
    }

    this.propertyKey = propertyKey;
    this.prefix = `property_${propertyKey}_`;
    this.schemaVersion = null;
    this.migrations = [];

    // Initialize schema version
    this._initializeSchema();
  }

  /**
   * Initialize or load schema version
   * @private
   */
  _initializeSchema() {
    const versionKey = `${this.prefix}schema_version`;
    const version = localStorage.getItem(versionKey);
    
    if (!version) {
      // First time initialization
      this.schemaVersion = '1.0.0';
      localStorage.setItem(versionKey, this.schemaVersion);
      this._logOperation('schema_init', { version: this.schemaVersion });
    } else {
      this.schemaVersion = version;
    }
  }

  /**
   * Set (create or update) a record in a collection
   * @param {string} collection - Collection name (e.g., 'users', 'reservations')
   * @param {string} id - Record ID
   * @param {object} data - Data to store
   * @returns {object} Stored record with metadata
   */
  set(collection, id, data) {
    if (!collection || !id) {
      throw new Error('PropertyDatabase.set: collection and id are required');
    }

    const key = `${this.prefix}${collection}_${id}`;
    
    // Get existing record to preserve createdAt
    const existing = this.get(collection, id);
    
    const record = {
      ...data,
      _propertyId: this.propertyKey,
      _collection: collection,
      _id: id,
      _version: this.schemaVersion,
      _createdAt: existing?._createdAt || data._createdAt || new Date().toISOString(),
      _updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(key, JSON.stringify(record));
      this._logOperation('set', { collection, id, size: JSON.stringify(record).length });
      return record;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('PropertyDatabase: Storage quota exceeded. Consider cleaning old data.');
      }
      throw error;
    }
  }

  /**
   * Get a record from a collection
   * @param {string} collection - Collection name
   * @param {string} id - Record ID
   * @returns {object|null} Record or null if not found
   */
  get(collection, id) {
    if (!collection || !id) {
      throw new Error('PropertyDatabase.get: collection and id are required');
    }

    const key = `${this.prefix}${collection}_${id}`;
    const value = localStorage.getItem(key);

    if (!value) {
      return null;
    }

    try {
      const record = JSON.parse(value);
      
      // Validate that record belongs to this property
      if (record._propertyId !== this.propertyKey) {
        console.warn(`PropertyDatabase: Record ${id} belongs to different property`);
        return null;
      }

      return record;
    } catch (error) {
      console.error(`PropertyDatabase: Error parsing record ${collection}/${id}`, error);
      return null;
    }
  }

  /**
   * Get all records from a collection
   * @param {string} collection - Collection name
   * @param {function} [filter] - Optional filter function
   * @returns {array} Array of records
   */
  getAll(collection, filter = null) {
    if (!collection) {
      throw new Error('PropertyDatabase.getAll: collection is required');
    }

    const pattern = `${this.prefix}${collection}_`;
    const records = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key.startsWith(pattern)) {
        const value = localStorage.getItem(key);
        try {
          const record = JSON.parse(value);
          
          // Validate property ownership
          if (record._propertyId === this.propertyKey) {
            if (!filter || filter(record)) {
              records.push(record);
            }
          }
        } catch (error) {
          console.error(`PropertyDatabase: Error parsing record ${key}`, error);
        }
      }
    }

    return records;
  }

  /**
   * Delete a record from a collection
   * @param {string} collection - Collection name
   * @param {string} id - Record ID
   * @returns {boolean} True if deleted, false if not found
   */
  delete(collection, id) {
    if (!collection || !id) {
      throw new Error('PropertyDatabase.delete: collection and id are required');
    }

    const key = `${this.prefix}${collection}_${id}`;
    const record = this.get(collection, id);

    if (!record) {
      return false;
    }

    localStorage.removeItem(key);
    this._logOperation('delete', { collection, id });
    return true;
  }

  /**
   * Delete all records from a collection
   * @param {string} collection - Collection name
   * @returns {number} Number of records deleted
   */
  deleteAll(collection) {
    if (!collection) {
      throw new Error('PropertyDatabase.deleteAll: collection is required');
    }

    const pattern = `${this.prefix}${collection}_`;
    const keysToDelete = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => localStorage.removeItem(key));
    this._logOperation('deleteAll', { collection, count: keysToDelete.length });
    
    return keysToDelete.length;
  }

  /**
   * Query records with advanced filtering
   * @param {string} collection - Collection name
   * @param {object} query - Query object { field: value, ... }
   * @returns {array} Matching records
   */
  query(collection, query) {
    const allRecords = this.getAll(collection);
    
    return allRecords.filter(record => {
      return Object.entries(query).every(([field, value]) => {
        if (typeof value === 'function') {
          return value(record[field]);
        }
        return record[field] === value;
      });
    });
  }

  /**
   * Count records in a collection
   * @param {string} collection - Collection name
   * @returns {number} Number of records
   */
  count(collection) {
    return this.getAll(collection).length;
  }

  /**
   * Check if a record exists
   * @param {string} collection - Collection name
   * @param {string} id - Record ID
   * @returns {boolean} True if exists
   */
  exists(collection, id) {
    return this.get(collection, id) !== null;
  }

  /**
   * Get storage size for this property
   * @returns {object} Storage statistics
   */
  getStorageStats() {
    let totalSize = 0;
    let recordCount = 0;
    const collections = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith(this.prefix) && !key.includes('operation_log') && !key.includes('schema_version')) {
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        totalSize += size;
        recordCount++;

        // Extract collection name
        const match = key.match(new RegExp(`${this.prefix}([^_]+)_`));
        if (match) {
          const collection = match[1];
          if (!collections[collection]) {
            collections[collection] = { count: 0, size: 0 };
          }
          collections[collection].count++;
          collections[collection].size += size;
        }
      }
    }

    return {
      propertyKey: this.propertyKey,
      totalSize: totalSize,
      totalRecords: recordCount,
      collections: collections,
      schemaVersion: this.schemaVersion
    };
  }

  /**
   * Clear all data for this property
   * @param {boolean} confirm - Must be true to execute
   * @returns {number} Number of records deleted
   */
  clearAll(confirm = false) {
    if (!confirm) {
      throw new Error('PropertyDatabase.clearAll: Must pass confirm=true to clear all data');
    }

    const keysToDelete = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.prefix)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => localStorage.removeItem(key));
    this._logOperation('clearAll', { count: keysToDelete.length });

    // Reinitialize schema
    this._initializeSchema();

    return keysToDelete.length;
  }

  /**
   * Export all data for this property
   * @returns {object} Complete property data export
   */
  exportData() {
    const exportData = {
      propertyKey: this.propertyKey,
      schemaVersion: this.schemaVersion,
      exportedAt: new Date().toISOString(),
      collections: {}
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key.startsWith(this.prefix) && !key.includes('schema_version')) {
        const value = localStorage.getItem(key);
        try {
          const record = JSON.parse(value);
          const collection = record._collection;
          
          if (!exportData.collections[collection]) {
            exportData.collections[collection] = [];
          }
          
          exportData.collections[collection].push(record);
        } catch (error) {
          console.error(`PropertyDatabase: Error exporting ${key}`, error);
        }
      }
    }

    return exportData;
  }

  /**
   * Import data for this property
   * @param {object} importData - Data to import
   * @param {boolean} merge - If true, merge with existing data. If false, clear first.
   * @returns {object} Import statistics
   */
  importData(importData, merge = false) {
    if (!merge) {
      this.clearAll(true);
    }

    let imported = 0;
    let errors = 0;

    Object.entries(importData.collections || {}).forEach(([collection, records]) => {
      records.forEach(record => {
        try {
          // Remove metadata before setting to avoid conflicts
          const { _propertyId, _collection, _id, _version, _createdAt, _updatedAt, ...cleanData } = record;
          this.set(collection, record._id, {
            ...cleanData,
            _createdAt: record._createdAt  // Preserve original timestamp
          });
          imported++;
        } catch (error) {
          console.error(`PropertyDatabase: Error importing ${collection}/${record._id}`, error);
          errors++;
        }
      });
    });

    this._logOperation('import', { imported, errors, merge });

    return { imported, errors };
  }

  /**
   * Log database operations
   * @private
   */
  _logOperation(operation, details) {
    const logKey = `${this.prefix}operation_log`;
    const logs = JSON.parse(localStorage.getItem(logKey) || '[]');
    
    logs.push({
      operation,
      details,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 operations
    if (logs.length > 100) {
      logs.shift();
    }

    localStorage.setItem(logKey, JSON.stringify(logs));
  }

  /**
   * Get operation logs for this property
   * @param {number} [limit=50] - Number of logs to return
   * @returns {array} Operation logs
   */
  getOperationLogs(limit = 50) {
    const logKey = `${this.prefix}operation_log`;
    const logs = JSON.parse(localStorage.getItem(logKey) || '[]');
    return logs.slice(-limit);
  }

  /**
   * Static method: Get all properties in the system
   * @returns {array} Array of property keys
   */
  static getAllProperties() {
    const properties = new Set();
    const pattern = /^property_([^_]+)_/;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const match = key.match(pattern);
      if (match) {
        properties.add(match[1]);
      }
    }

    return Array.from(properties);
  }

  /**
   * Static method: Get database instance for a property
   * @param {string} propertyKey - Property key
   * @returns {PropertyDatabase} Database instance
   */
  static forProperty(propertyKey) {
    return new PropertyDatabase(propertyKey);
  }

  /**
   * Static method: Clear all data for a property
   * @param {string} propertyKey - Property key
   * @param {boolean} confirm - Must be true
   * @returns {number} Number of records deleted
   */
  static clearProperty(propertyKey, confirm = false) {
    const db = new PropertyDatabase(propertyKey);
    return db.clearAll(confirm);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PropertyDatabase;
}
if (typeof window !== 'undefined' && !window.PropertyDatabase) {
  window.PropertyDatabase = PropertyDatabase;
  console.log('✅ PropertyDatabase loaded successfully');
}
}
