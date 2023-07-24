import { Body, Controller } from '@nestjs/common';
import { RMQRoute, RMQValidate } from 'nestjs-rmq';
import {
  AccountBuyCourse,
  AccountChangeProfile,
  AccountCheckPayment,
} from '@school/contracts';
import { UserRepository } from './repositories/user.repository';
import { UserEntity } from './entities/user.entity';

@Controller()
export class UserCommands {
  constructor(private readonly userRepository: UserRepository) {}

  @RMQValidate()
  @RMQRoute(AccountChangeProfile.topic)
  async userInfo(
    @Body() { user, id }: AccountChangeProfile.Request
  ): Promise<AccountChangeProfile.Response> {
    const existingUser = await this.userRepository.findUserById(id);
    if (!existingUser) {
      throw new Error(`Not found user with id ${id}`);
    }
    const userEntity = new UserEntity(existingUser).updateProfile(
      user.displayName
    );
    await this.userRepository.updateUser(userEntity);
    return {};
  }

  @RMQValidate()
  @RMQRoute(AccountBuyCourse.topic)
  async buyCourse(
    @Body() { courseId, userId }: AccountBuyCourse.Request
  ): Promise<AccountBuyCourse.Response> {}

  @RMQValidate()
  @RMQRoute(AccountCheckPayment.topic)
  async checkPayment(
    @Body() { courseId, userId }: AccountCheckPayment.Request
  ): Promise<AccountCheckPayment.Response> {}
}
