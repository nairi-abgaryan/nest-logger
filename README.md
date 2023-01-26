# Install
```

npm i nest-logger

```
# 

Use this LoggerService in your logging module.

```configOptions interfaces 
ConfigOptions {
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
;
```

# Detailed usage examples

Use in your project by creating a logger.module.ts with content like this:

```javascript


@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: LoggerService,
      useFactory: (config: ConfigService) => {
        
      },
      inject: [ConfigService],
    },
  ],
  exports: [LoggerService],
})
export class LoggerModule {}
```

## Using the logger

Import logger module wherever you need it:

```javascript
import { LoggerModule } from "../logging/logger.module";

@Module({
  imports: [
    LoggerModule,
    DBModule,
  ],
  controllers: [ItemController],
  providers: [ItemService],
})
export class ItemModule {}
```

And log stuff:
```
import { LoggerService } from "sprinting-logger";
constructor(private readonly logger: LoggerService) {}

public logStuff() {
  this.logger.debug(`Found ${result.rowCount} items from db`, ItemService.name);
  this.logger.error(`Error while getting items from db`, err.stack, ItemService.name);
}
```
