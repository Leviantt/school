import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { RMQModule, RMQService, RMQTestService } from 'nestjs-rmq';
import { UserModule } from '../user/user.module';
import { AuthModule } from './auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { getMongoConfig } from '../configs/mongo.config';
import { INestApplication } from '@nestjs/common';
import { AccountLogin, AccountRegister } from '@school/contracts';
import { UserRepository } from '../user/repositories/user.repository';

const loginRequestData: AccountLogin.Request = {
  email: 'lev.f@gmail.com',
  password: '1234',
};

const registerRequestData: AccountRegister.Request = {
  ...loginRequestData,
  displayName: 'Leo',
};

describe('AuthController', () => {
  let app: INestApplication;
  let rmqService: RMQTestService;
  let userRepository: UserRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: 'envs/.account.env',
        }),
        RMQModule.forTest({}),
        UserModule,
        AuthModule,
        MongooseModule.forRootAsync(getMongoConfig()),
      ],
    }).compile();
    app = module.createNestApplication();
    userRepository = app.get<UserRepository>(UserRepository);
    rmqService = app.get(RMQService);
    await app.init();
  });
  it('Register', async () => {
    const response = await rmqService.triggerRoute<
      AccountRegister.Request,
      AccountRegister.Response
    >(AccountRegister.topic, registerRequestData);
    expect(response.email).toBe(registerRequestData.email);
  });

  it('Login', async () => {
    const response = await rmqService.triggerRoute<
      AccountLogin.Request,
      AccountLogin.Response
    >(AccountLogin.topic, loginRequestData);
    expect(response.accessToken).toBeDefined();
  });

  afterAll(async () => {
    await userRepository.deleteUser(registerRequestData.email);
    await app.close();
  });
});
