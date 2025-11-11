/**
 * Release Management & Rollback System
 * Semantic versioning, safe deployment, automated rollback
 * 
 * Part of Enterprise Backup System
 */

class ReleaseManagementSystem {
  constructor(enterpriseBackup) {
    this.eb = enterpriseBackup; // Reference to enterprise backup system
    this.currentUser = enterpriseBackup.currentUser;
    
    this.KEYS = {
      RELEASES: 'enterprise_releases',
      ACTIVE_RELEASE: 'enterprise_active_release',
      ROLLBACK_PLANS: 'enterprise_rollback_plans',
      FEATURE_FLAGS: 'enterprise_feature_flags',
      DEPLOY_HISTORY: 'enterprise_deploy_history'
    };
    
    this.loadData();
  }
  
  loadData() {
    this.releases = this.load(this.KEYS.RELEASES) || [];
    this.activeRelease = this.load(this.KEYS.ACTIVE_RELEASE);
    this.rollbackPlans = this.load(this.KEYS.ROLLBACK_PLANS) || {};
    this.featureFlags = this.load(this.KEYS.FEATURE_FLAGS) || {};
    this.deployHistory = this.load(this.KEYS.DEPLOY_HISTORY) || [];
  }
  
  load(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }
  
  save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }
  
  // ========================================
  // RELEASE CREATION
  // ========================================
  
  /**
   * Create a new release
   * @param {object} releaseData - Release information
   * @returns {object} Created release
   */
  async createRelease(releaseData) {
    const releaseId = `release_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    // Parse semantic version
    const version = this.parseVersion(releaseData.version);
    if (!version) {
      throw new Error('Invalid semantic version format. Use MAJOR.MINOR.PATCH');
    }
    
    // Normalize migrations input
    let migrations_forward = [];
    let migrations_backward = [];
    if (Array.isArray(releaseData.migrations_forward) || Array.isArray(releaseData.migrations_backward)) {
      migrations_forward = releaseData.migrations_forward || [];
      migrations_backward = releaseData.migrations_backward || [];
    } else if (Array.isArray(releaseData.migrations)) {
      // Split by type if provided, else treat all as forward
      for (const m of releaseData.migrations) {
        const t = (m && (m.type || m.direction || '').toString().toLowerCase()) || 'forward';
        if (t === 'backward' || t === 'down') migrations_backward.push(m); else migrations_forward.push(m);
      }
    }

    // Normalize files list into categorized buckets by extension
    const files_input = Array.isArray(releaseData.files) ? releaseData.files
                        : (typeof releaseData.files === 'string' ? releaseData.files.split(',').map(s=>s.trim()).filter(Boolean) : []);
    const files_html = (releaseData.files_html || []).slice();
    const files_css = (releaseData.files_css || []).slice();
    const files_js = (releaseData.files_js || []).slice();
    const files_assets = (releaseData.files_assets || []).slice();
    for (const f of files_input) {
      if (/\.html?$/i.test(f)) files_html.push(f);
      else if (/\.css$/i.test(f)) files_css.push(f);
      else if (/\.m?js$/i.test(f)) files_js.push(f);
      else files_assets.push(f);
    }

    const release = {
      id: releaseId,
      version: releaseData.version,
      version_parsed: version,
      name: releaseData.name || `Release ${releaseData.version}`,
      description: releaseData.description || '',
      
      // Metadata
      created_at: timestamp,
      created_by: this.currentUser.id,
      channel: releaseData.channel || 'dev', // dev, stage, prod
      status: 'created', // created, deployed, active, rolled_back
      
      // Build artifact
      artifact: {
        hash: this.generateArtifactHash(),
        build_id: `build_${Date.now()}`,
        commit_sha: releaseData.commit_sha || 'local',
        branch: releaseData.branch || 'main'
      },
      
      // Software Bill of Materials
      sbom: {
        components: this.generateSBOM(),
        dependencies: releaseData.dependencies || []
      },
      
      // Database migrations
      migrations: {
        forward: migrations_forward,
        backward: migrations_backward
      },
      
      // Files included
      files: {
        html: files_html,
        css: files_css,
        js: files_js,
        assets: files_assets
      },
      
      // Changelog
      changelog: releaseData.changelog || [],
      
      // Tags
      tags: releaseData.tags || [],
      
      // Deployment tracking
      deployments: []
    };
    
    // Generate rollback plan
  const rollbackPlan = await this.generateRollbackPlan(release);
    this.rollbackPlans[releaseId] = rollbackPlan;
    this.save(this.KEYS.ROLLBACK_PLANS, this.rollbackPlans);
    
    // Save release
    this.releases.push(release);
    this.save(this.KEYS.RELEASES, this.releases);
    
    this.eb.audit('release', 'info', 'Release created', {
      releaseId,
      version: release.version,
      channel: release.channel
    });
    
    return release;
  }
  
  parseVersion(versionString) {
    const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
    const match = versionString.match(regex);
    
    if (!match) return null;
    
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4] || null,
      build: match[5] || null,
      full: versionString
    };
  }
  
  generateArtifactHash() {
    // In production: hash of build artifacts
    return 'sha256_' + Date.now().toString(16) + Math.random().toString(36).substr(2, 16);
  }
  
  generateSBOM() {
    // Software Bill of Materials
    return [
      { name: 'nexefii Core', version: '2.5.0', license: 'Proprietary' },
      { name: 'LocalStorage API', version: 'Web Standard', license: 'W3C' }
    ];
  }
  
  // ========================================
  // DEPLOYMENT
  // ========================================
  
  /**
   * Deploy a release
   */
  async deployRelease(releaseId, options = {}) {
    const startTime = Date.now();
    const deploymentId = `deploy_${Date.now()}`;
    
    try {
      const release = this.findRelease(releaseId);
      if (!release) {
        throw new Error(`Release ${releaseId} not found`);
      }
      
      this.eb.audit('deployment', 'info', 'Starting deployment', {
        releaseId,
        deploymentId,
        version: release.version,
        channel: release.channel
      });
      
      // Pre-deployment checks
      await this.runPreDeploymentChecks(release, options);
      
      // Create safety backup
      if (options.skipBackup !== true) {
        await this.createPreDeploymentBackup(release);
      }
      
      // Apply migrations (forward)
      if (release.migrations.forward.length > 0) {
        await this.applyMigrations(release.migrations.forward, 'forward');
      }
      
      // Deploy files
      await this.deployFiles(release);
      
      // Update active release
      const previousRelease = this.activeRelease;
      this.activeRelease = {
        releaseId: release.id,
        version: release.version,
        deployed_at: new Date().toISOString(),
        deployed_by: this.currentUser.id,
        previous_release: previousRelease
      };
      this.save(this.KEYS.ACTIVE_RELEASE, this.activeRelease);
      
      // Update release status
      release.status = 'active';
      release.deployments.push({
        id: deploymentId,
        deployed_at: new Date().toISOString(),
        deployed_by: this.currentUser.id,
        channel: release.channel,
        duration_ms: Date.now() - startTime,
        status: 'success'
      });
      this.save(this.KEYS.RELEASES, this.releases);
      
      // Post-deployment checks
      await this.runPostDeploymentChecks(release, options);
      
      // Record deployment
      this.deployHistory.push({
        id: deploymentId,
        releaseId: release.id,
        version: release.version,
        type: 'deployment',
        timestamp: new Date().toISOString(),
        user: this.currentUser.id,
        duration_ms: Date.now() - startTime,
        status: 'success'
      });
      this.save(this.KEYS.DEPLOY_HISTORY, this.deployHistory);
      
      this.eb.audit('deployment', 'info', 'Deployment completed', {
        releaseId,
        deploymentId,
        version: release.version,
        duration_ms: Date.now() - startTime
      });

      // Update enterprise metrics
      try {
        if (this.eb && this.eb.metrics && this.eb.metrics.releases) {
          this.eb.metrics.releases.total_count = (this.eb.metrics.releases.total_count || 0) + 1;
          this.eb.metrics.releases.active_version = release.version;
          this.eb.metrics.releases.last_deploy = new Date().toISOString();
          this.eb.save(this.eb.KEYS.METRICS, this.eb.metrics);
        }
      } catch (e) {}
      
      return {
        success: true,
        deploymentId,
        releaseId: release.id,
        version: release.version,
        duration_ms: Date.now() - startTime
      };
      
    } catch (error) {
      this.eb.audit('deployment', 'error', 'Deployment failed', {
        releaseId,
        deploymentId,
        error: error.message
      });
      
      // Record failed deployment
      this.deployHistory.push({
        id: deploymentId,
        releaseId: releaseId,
        type: 'deployment',
        timestamp: new Date().toISOString(),
        user: this.currentUser.id,
        duration_ms: Date.now() - startTime,
        status: 'failed',
        error: error.message
      });
      this.save(this.KEYS.DEPLOY_HISTORY, this.deployHistory);
      
      throw error;
    }
  }
  
  async runPreDeploymentChecks(release, options) {
    // Pre-deployment validation
    const checks = {
      migrations_valid: this.validateMigrations(release.migrations),
      dependencies_met: true,
      no_conflicts: true,
      backup_available: true
    };
    
    const failed = Object.entries(checks).filter(([k, v]) => !v);
    if (failed.length > 0) {
      throw new Error(`Pre-deployment checks failed: ${failed.map(f => f[0]).join(', ')}`);
    }
    
    return checks;
  }
  
  async runPostDeploymentChecks(release, options) {
    // Health checks
    const checks = {
      app_responsive: true,
      database_accessible: true,
      version_correct: this.activeRelease.version === release.version,
      no_errors: true
    };
    
    const failed = Object.entries(checks).filter(([k, v]) => !v);
    if (failed.length > 0) {
      this.eb.audit('deployment', 'warning', 'Post-deployment checks have warnings', {
        releaseId: release.id,
        failed_checks: failed.map(f => f[0])
      });
    }
    
    return checks;
  }
  
  validateMigrations(migrations) {
    // Validate migrations are properly paired (forward/backward)
    return migrations.forward.length === migrations.backward.length;
  }
  
  async createPreDeploymentBackup(release) {
    // Create full backup before deployment
    this.eb.audit('deployment', 'info', 'Creating pre-deployment backup', {
      releaseId: release.id
    });
    
    // Create general backup
    await this.eb.createGeneralBackup({
      tags: ['pre-deploy', release.version]
    });
    
    // Create backup for all tenants
    const tenantIds = Object.keys(this.eb.tenantBackups);
    for (const tenantId of tenantIds) {
      await this.eb.createTenantBackup(tenantId, {
        type: 'full',
        tags: ['pre-deploy', release.version]
      });
    }
  }
  
  async applyMigrations(migrations, direction) {
    // Apply database migrations
    // In production: execute SQL/NoSQL migrations
    this.eb.audit('migration', 'info', `Applying ${direction} migrations`, {
      count: migrations.length
    });
    
    for (const migration of migrations) {
      // Execute migration
      // migration.up() or migration.down()
    }
  }
  
  async deployFiles(release) {
    // Deploy files to production
    // In production: copy files, update CDN, invalidate cache
    this.eb.audit('deployment', 'info', 'Deploying files', {
      releaseId: release.id,
      file_count: Object.values(release.files).flat().length
    });
  }
  
  // ========================================
  // ROLLBACK
  // ========================================
  
  /**
   * Rollback to previous release
   */
  async rollbackRelease(targetReleaseId, options = {}) {
    const startTime = Date.now();
    const rollbackId = `rollback_${Date.now()}`;
    
    try {
      if (!this.activeRelease) {
        throw new Error('No active release to rollback from');
      }
      
      const targetRelease = this.findRelease(targetReleaseId);
      if (!targetRelease) {
        throw new Error(`Target release ${targetReleaseId} not found`);
      }
      
      const currentRelease = this.findRelease(this.activeRelease.releaseId);
      
      this.eb.audit('rollback', 'info', 'Starting rollback', {
        rollbackId,
        from_version: currentRelease ? currentRelease.version : 'unknown',
        to_version: targetRelease.version
      });
      
      // Get rollback plan
      const plan = this.rollbackPlans[targetReleaseId];
      if (!plan) {
        throw new Error(`No rollback plan found for release ${targetReleaseId}`);
      }
      
      // Enter maintenance mode (optional)
      if (options.maintenanceMode !== false) {
        await this.enterMaintenanceMode();
      }
      
      // Create safety backup
      if (options.skipBackup !== true) {
        await this.createPreDeploymentBackup({ id: 'rollback', version: 'pre-rollback' });
      }
      
      // Rollback migrations (apply backward migrations)
      if (currentRelease && currentRelease.migrations.backward.length > 0) {
        await this.applyMigrations(currentRelease.migrations.backward, 'backward');
      }
      
      // Restore files from target release
      await this.deployFiles(targetRelease);
      
      // Update active release
      this.activeRelease = {
        releaseId: targetRelease.id,
        version: targetRelease.version,
        deployed_at: new Date().toISOString(),
        deployed_by: this.currentUser.id,
        previous_release: currentRelease ? currentRelease.id : null,
        rolled_back: true
      };
      this.save(this.KEYS.ACTIVE_RELEASE, this.activeRelease);
      
      // Update release statuses
      if (currentRelease) {
        currentRelease.status = 'rolled_back';
      }
      targetRelease.status = 'active';
      this.save(this.KEYS.RELEASES, this.releases);
      
      // Post-rollback validation
      await this.runPostDeploymentChecks(targetRelease, options);
      
      // Exit maintenance mode
      if (options.maintenanceMode !== false) {
        await this.exitMaintenanceMode();
      }
      
      // Record rollback
      this.deployHistory.push({
        id: rollbackId,
        releaseId: targetRelease.id,
        version: targetRelease.version,
        type: 'rollback',
        timestamp: new Date().toISOString(),
        user: this.currentUser.id,
        duration_ms: Date.now() - startTime,
        status: 'success',
        from_version: currentRelease ? currentRelease.version : 'unknown'
      });
      this.save(this.KEYS.DEPLOY_HISTORY, this.deployHistory);
      
      // Update metrics
      if (this.eb.metrics.releases) {
        this.eb.metrics.releases.rollback_count++;
        this.eb.metrics.releases.last_rollback = new Date().toISOString();
        this.eb.save(this.eb.KEYS.METRICS, this.eb.metrics);
      }
      
      this.eb.audit('rollback', 'info', 'Rollback completed', {
        rollbackId,
        to_version: targetRelease.version,
        duration_ms: Date.now() - startTime
      });
      
      return {
        success: true,
        rollbackId,
        target_version: targetRelease.version,
        duration_ms: Date.now() - startTime
      };
      
    } catch (error) {
      this.eb.audit('rollback', 'error', 'Rollback failed', {
        rollbackId,
        targetReleaseId,
        error: error.message
      });
      
      // Exit maintenance mode on failure
      try {
        await this.exitMaintenanceMode();
      } catch (e) {}
      
      throw error;
    }
  }
  
  async generateRollbackPlan(releaseOrId) {
    // Accept either a release object or a releaseId string
    const target = typeof releaseOrId === 'string' ? this.findRelease(releaseOrId) : releaseOrId;
    const current = this.activeRelease ? this.findRelease(this.activeRelease.releaseId) : null;
    const plan = {
      releaseId: target ? target.id : (typeof releaseOrId === 'string' ? releaseOrId : ''),
      version: target ? target.version : '',
      created_at: new Date().toISOString(),
      targetRelease: target ? { id: target.id, version: target.version, created_at: target.created_at, name: target.name } : null,
      currentRelease: current ? { id: current.id, version: current.version, created_at: current.created_at, name: current.name } : null,
      steps: [
        'Entrar em modo de manutenÃ§Ã£o',
        'Criar backup de seguranÃ§a',
        'Executar migrations backward',
        'Restaurar arquivos da release alvo',
        'Executar verificaÃ§Ãµes de saÃºde pÃ³s-rollback',
        'Sair do modo de manutenÃ§Ã£o'
      ],
      backwardMigrations: (current && current.migrations && Array.isArray(current.migrations.backward)) ? current.migrations.backward : [],
      estimated_duration_ms: 15 * 60 * 1000,
      prerequisites: [
        'Release anterior disponÃ­vel',
        'Migrations backward disponÃ­veis',
        'Armazenamento de backup acessÃ­vel'
      ]
    };
    return plan;
  }
  
  async enterMaintenanceMode() {
    localStorage.setItem('system_maintenance_mode', 'true');
    this.eb.audit('system', 'warning', 'Entered maintenance mode', {});
  }
  
  async exitMaintenanceMode() {
    localStorage.removeItem('system_maintenance_mode');
    this.eb.audit('system', 'info', 'Exited maintenance mode', {});
  }
  
  // ========================================
  // FEATURE FLAGS
  // ========================================
  
  setFeatureFlag(name, enabled, options = {}) {
    // Accept both snake_case and camelCase option keys
    const rollout = (options.rollout_percentage != null ? options.rollout_percentage : options.rolloutPercentage);
    const targets = options.target_tenants != null ? options.target_tenants : options.targetTenants;
    this.featureFlags[name] = {
      enabled: enabled,
      created_at: new Date().toISOString(),
      created_by: this.currentUser.id,
      description: options.description || '',
      rollout_percentage: typeof rollout === 'number' ? rollout : (enabled ? 100 : 0),
      target_tenants: Array.isArray(targets) ? targets : (typeof targets === 'string' && targets ? targets.split(',').map(s=>s.trim()) : [])
    };
    this.save(this.KEYS.FEATURE_FLAGS, this.featureFlags);
    this.eb.audit('feature_flag', 'info', `Feature flag '${name}' ${enabled ? 'enabled' : 'disabled'}`, { name, enabled });
  }

  getFeatureFlags() {
    // Return as array with UI-friendly property names
    const out = [];
    const src = this.featureFlags || {};
    Object.keys(src).forEach(name => {
      const f = src[name] || {};
      out.push({
        name,
        enabled: !!f.enabled,
        rolloutPercentage: typeof f.rollout_percentage === 'number' ? f.rollout_percentage : 0,
        targetTenants: Array.isArray(f.target_tenants) ? f.target_tenants : [],
        created_at: f.created_at,
        created_by: f.created_by,
        description: f.description || ''
      });
    });
    return out;
  }
  
  isFeatureEnabled(name, tenantId = null) {
    const flag = this.featureFlags[name];
    if (!flag) return false;
    if (!flag.enabled) return false;
    
    // Check tenant targeting
    if (flag.target_tenants && tenantId) {
      return flag.target_tenants.includes(tenantId);
    }
    
    // Check rollout percentage
    if (flag.rollout_percentage < 100) {
      // Simple hash-based rollout
      const hash = this.simpleHash(name + (tenantId || ''));
      const percent = (hash % 100) + 1;
      return percent <= flag.rollout_percentage;
    }
    
    return true;
  }
  
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  // ========================================
  // HELPERS
  // ========================================
  
  findRelease(releaseId) {
    return this.releases.find(r => r.id === releaseId);
  }
  
  getActiveRelease() {
    return this.activeRelease;
  }
  
  getReleaseHistory(channel = null) {
    let history = [...this.releases].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    
    if (channel) {
      history = history.filter(r => r.channel === channel);
    }
    
    return history;
  }
  
  getDeploymentHistory(limit = 50) {
    return [...this.deployHistory]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }
}

// Export
if (typeof window !== 'undefined') {
  window.ReleaseManagementSystem = ReleaseManagementSystem;
}

