import { Injectable } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { RMQService } from 'nestjs-rmq';
import { UserEntity } from './entities/user.entity';
import { BuyCourseSaga } from './sagas/buy-course.saga';
import { IUser } from '@school/interfaces';
import { UserEventEmitter } from './user.event-emitter';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly rmqService: RMQService,
    private readonly userEventEmitter: UserEventEmitter
  ) {}

  async changeProfile(user: Pick<IUser, 'displayName'>, id: string) {
    const existingUser = await this.userRepository.findUserById(id);
    if (!existingUser) {
      throw new Error(`Not found user with id ${id}`);
    }
    const userEntity = new UserEntity(existingUser).updateProfile(
      user.displayName
    );
    await this.updateUser(userEntity);
    return {};
  }

  async buyCourse(courseId: string, userId: string) {
    const existingUser = await this.userRepository.findUserById(userId);
    if (!existingUser) {
      throw new Error(`Not found user with id ${userId}`);
    }

    const userEntity = new UserEntity(existingUser);
    const saga = new BuyCourseSaga(userEntity, courseId, this.rmqService);
    const { user, paymentLink } = await saga.getState().pay();
    await this.updateUser(user);

    return { paymentLink };
  }

  async checkPayment(courseId: string, userId: string) {
    const existingUser = await this.userRepository.findUserById(userId);
    if (!existingUser) {
      throw new Error(`Not found user with id ${userId}`);
    }

    const userEntity = new UserEntity(existingUser);
    const saga = new BuyCourseSaga(userEntity, courseId, this.rmqService);
    const { user, status } = await saga.getState().checkPayment();
    await this.updateUser(user);

    return { status };
  }

  async userInfo(id: string) {
    const user = await this.userRepository.findUserById(id);
    const profile = new UserEntity(user).getPublicProfile();
    return { profile };
  }

  async userCourses(id: string) {
    const user = await this.userRepository.findUserById(id);
    return { courses: user.courses };
  }

  private updateUser(user: UserEntity) {
    return Promise.all([
      this.userEventEmitter.handle(user),
      this.userRepository.updateUser(user),
    ]);
  }
}
