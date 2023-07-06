import { MongooseModuleAsyncOptions } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

export function getMongoConfig(): MongooseModuleAsyncOptions {
  return {
    useFactory: (configService: ConfigService) => ({
      uri: getMongoConnectionString(configService),
    }),
    inject: [ConfigService],
    imports: [ConfigModule],
  };
}

function getMongoConnectionString(configService: ConfigService): string {
  return (
    'mongodb://' +
    configService.get('MONGO_LOGIN') +
    ':' +
    configService.get('MONGO_PASSWORD') +
    '@' +
    configService.get('MONGO_HOST') +
    ':' +
    configService.get('MONGO_PORT') +
    '/' +
    configService.get('MONGO_DATABASE') +
    '?authSource=' +
    configService.get('MONGO_AUTHDATABASE')
  );
}
