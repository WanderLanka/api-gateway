// utils/serviceRegistry.js
import axios from 'axios';
import { services } from '../config/index.js';
import logger from './logger.js';

class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.healthCheckInterval = 30000; // 30 seconds
    this.initializeServices();
    this.startHealthChecks();
  }

  initializeServices() {
    Object.entries(services).forEach(([name, serviceConfig]) => {
      this.services.set(name, {
        ...serviceConfig,
        healthy: true,
        lastCheck: null,
        consecutiveFailures: 0
      });
    });
    logger.info('Service registry initialized', {
      services: Array.from(this.services.keys())
    });
  }

  async checkServiceHealth(serviceName, serviceConfig) {
    try {
      const response = await axios.get(`${serviceConfig.url}/health`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        const wasUnhealthy = !serviceConfig.healthy;
        this.services.set(serviceName, {
          ...serviceConfig,
          healthy: true,
          lastCheck: new Date(),
          consecutiveFailures: 0
        });
        
        if (wasUnhealthy) {
          logger.info(`Service ${serviceName} is back online`);
        }
        return true;
      }
    } catch (error) {
      const currentService = this.services.get(serviceName);
      const consecutiveFailures = (currentService?.consecutiveFailures || 0) + 1;
      
      this.services.set(serviceName, {
        ...serviceConfig,
        healthy: false,
        lastCheck: new Date(),
        consecutiveFailures,
        lastError: error.message
      });
      
      if (consecutiveFailures === 1) {
        logger.warn(`Service ${serviceName} health check failed:`, {
          error: error.message,
          url: serviceConfig.url
        });
      } else if (consecutiveFailures % 5 === 0) {
        logger.error(`Service ${serviceName} has failed ${consecutiveFailures} consecutive health checks`);
      }
      
      return false;
    }
  }

  startHealthChecks() {
    logger.info('Starting health checks for all services');
    setInterval(async () => {
      for (const [serviceName, serviceConfig] of this.services) {
        await this.checkServiceHealth(serviceName, serviceConfig);
      }
    }, this.healthCheckInterval);
  }

  getService(serviceName) {
    return this.services.get(serviceName);
  }

  isServiceHealthy(serviceName) {
    const service = this.services.get(serviceName);
    return service && service.healthy;
  }

  getAllServices() {
    return Object.fromEntries(this.services);
  }

  getHealthyServices() {
    const healthyServices = {};
    for (const [name, service] of this.services) {
      if (service.healthy) {
        healthyServices[name] = service;
      }
    }
    return healthyServices;
  }

  getServiceUrl(serviceName) {
    const service = this.getService(serviceName);
    return service?.url;
  }
}

export default new ServiceRegistry();
