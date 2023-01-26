import ApmHelper from '../apm/ApmHelper';
const ecsFormat = require('@elastic/ecs-winston-format');
import { UDPTransport } from 'udp-transport-winston';
import * as winston from 'winston';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
const { combine, timestamp } = winston.format;

export const enum LogLevel {
  info = 'info',
  debug = 'debug',
  error = 'error',
  warn = 'warn',
}

export interface ConfigOptions {
  env: string;
  serviceName: string;
  logging: {
    silent: boolean;
    enableAPM: boolean;
  };
  logstash: {
    isUDPEnabled: boolean;
    host: string;
    port: number;
  };
  elk: {
    serviceUrl: string,
    serviceSecret: string
  }
}

export class LoggerService {
  private readonly logger: winston.Logger;
  private readonly apm: ApmHelper

  constructor(private readonly config: ConfigOptions, transports: any[] = []) {
    this.apm = new ApmHelper(config)
  
    const conf = {
      systemName: config.serviceName,
      host: config.logstash.host,
      port: config.logstash.port,
    };
    
    if (config.logstash.isUDPEnabled) {
      transports.push(new UDPTransport(conf));
    }

    this.logger = winston.createLogger({
      format: combine(timestamp(), ecsFormat({ convertReqRes: true, apmIntegration: true })),
      silent: config.logging.silent,
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
        ...transports
      ],
    });
  }

  info(filename: string, message: string) {
    this.logger.info({ filename, message: message });
  }

  debug(filename: string, message: string, data: any) {
    const logMessage = {
      ...data,
      message: message,
      system: this.config.serviceName,
      component: this.config.serviceName,
      env: this.config.env,
      systemEnv: this.config.env + '-' + this.config.serviceName,
      logSource: filename,
      logType: LogLevel.debug,
    };

    this.logger.info(logMessage);
  }
  
  warn(fileName: string, message: string, error?: Error) {
    this.logger.warn({ message: message, logSource: fileName, error: error });
  }

  error(fileName: string, message: unknown, error?: Error, context?: HttpArgumentsHost, data?: any) {
    delete error?.stack;

    const logMessage = {
      ...data,
      message: message,
      system: this.config.serviceName,
      component: this.config.serviceName,
      env: this.config.env,
      systemEnv: this.config.env + '-' + this.config.serviceName,
      logSource: fileName,
      logType: LogLevel.error,
      context: {
        error: JSON.stringify(error),
        body: JSON.stringify(context?.getRequest().body ?? {}),
      },
    };

    if (error) this.apm.captureError(error, data?.tenantId);

    this.logger.error(logMessage);
  }

  log(fileName: string, message: string, logLevel: LogLevel = LogLevel.info, error?: Error): void {
    delete error?.stack;
  
    const logMessage = {
      message: message,
      context: {
        error: error,
      },
      system: this.config.serviceName,
      component: this.config.serviceName,
      env: this.config.env,
      systemEnv: this.config.env + '-' + this.config.serviceName,
      logSource: fileName,
      logType: logLevel,
    };

    this.apm.logContextObject(fileName, logMessage);

    this.logger.log(logLevel, logMessage);
  }
}
