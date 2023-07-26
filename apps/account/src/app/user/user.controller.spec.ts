import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RMQModule, RMQService, RMQTestService } from 'nestjs-rmq';
import { UserModule } from './user.module';
import { AuthModule } from '../auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { getMongoConfig } from '../configs/mongo.config';
import { INestApplication } from '@nestjs/common';
import {
  AccountBuyCourse, AccountCheckPayment,
  AccountLogin,
  AccountRegister,
  AccountUserInfo,
  CourseGetCourse,
  PaymentCheck,
  PaymentGenerateLink,
} from '@school/contracts';
import { UserRepository } from './repositories/user.repository';
import { verify } from 'jsonwebtoken';

const loginRequestData: AccountLogin.Request = {
  email: 'lev2.f@gmail.com',
  password: '1234',
};

const registerRequestData: AccountRegister.Request = {
  ...loginRequestData,
  displayName: 'Leo',
};

const courseId = '123';
const paymentLink = 'paymentLink';

describe('UserController', () => {
  let app: INestApplication;
  let rmqService: RMQTestService;
  let userRepository: UserRepository;
  let configService: ConfigService;
  let userId: string;

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
    userRepository = app.get(UserRepository);
    rmqService = app.get(RMQService);
    configService = app.get(ConfigService);
    await app.init();

    await rmqService.triggerRoute<
      AccountRegister.Request,
      AccountRegister.Response
    >(AccountRegister.topic, registerRequestData);
    const { accessToken } = await rmqService.triggerRoute<
      AccountLogin.Request,
      AccountLogin.Response
    >(AccountLogin.topic, loginRequestData);

    const payload = verify(accessToken, configService.get('JWT_SECRET'));
    userId = payload['id'];
  });

  it('UserInfo', async () => {
    const response = await rmqService.triggerRoute<
      AccountUserInfo.Request,
      AccountUserInfo.Response
    >(AccountUserInfo.topic, {
      id: userId,
    });
    expect(response.profile.displayName).toBe(registerRequestData.displayName);
  });

  it('BuyCourse', async () => {
    rmqService.mockReply<CourseGetCourse.Response>(CourseGetCourse.topic, {
      course: {
        _id: courseId,
        price: 1000,
      },
    });
    rmqService.mockReply<PaymentGenerateLink.Response>(
      PaymentGenerateLink.topic,
      {
        paymentLink,
      }
    );

    const response = await rmqService.triggerRoute<
      AccountBuyCourse.Request,
      AccountBuyCourse.Response
    >(AccountBuyCourse.topic, {
      userId,
      courseId,
    });
    expect(response.paymentLink).toBe(paymentLink);
    await expect(
      rmqService.triggerRoute<
        AccountBuyCourse.Request,
        AccountBuyCourse.Response
      >(AccountBuyCourse.topic, {
        userId,
        courseId,
      })
    ).rejects.toThrowError();
  });

  it('CheckPayment', async () => {
    rmqService.mockReply<PaymentCheck.Response>(PaymentCheck.topic, {
      status: 'success',
    });

    const response = await rmqService.triggerRoute<
      AccountCheckPayment.Request,
      AccountCheckPayment.Response
    >(AccountCheckPayment.topic, {
      userId,
      courseId,
    });
    expect(response.status).toBe('success');
  });

  afterAll(async () => {
    await userRepository.deleteUser(registerRequestData.email);
    await app.close();
  });
});
