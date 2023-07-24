import { BuyCourseSagaState } from './buy-course.state';
import { UserEntity } from '../entities/user.entity';
import {
  CourseGetCourse,
  PaymentCheck,
  PaymentGenerateLink, PaymentStatus,
} from '@school/contracts';
import { PurchaseState } from '@school/interfaces';

export class BuyCourseSagaStateStarted extends BuyCourseSagaState {
  public async pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    const { course } = await this.saga.rmqService.send<
      CourseGetCourse.Request,
      CourseGetCourse.Response
    >(CourseGetCourse.topic, { id: this.saga.courseId });
    if (!course) {
      throw new Error(`There is no course with id ${this.saga.courseId}`);
    }
    if (course.price == 0) {
      this.saga.setState(PurchaseState.Purchased, course._id);
      return { paymentLink: null, user: this.saga.user };
    }

    const { paymentLink } = await this.saga.rmqService.send<
      PaymentGenerateLink.Request,
      PaymentGenerateLink.Response
    >(PaymentGenerateLink.topic, {
      courseId: this.saga.courseId,
      userId: this.saga.user._id,
      sum: course.price,
    });

    this.saga.setState(PurchaseState.WaitingForPayment, course._id);
    return { paymentLink, user: this.saga.user };
  }

  public checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
    throw new Error('Could not check payment that is not started.');
  }

  public async cancel(): Promise<{ user: UserEntity }> {
    this.saga.setState(PurchaseState.Canceled, this.saga.courseId);
    return { user: this.saga.user };
  }
}

export class BuyCourseSagaStateWaitingForPayment extends BuyCourseSagaState {
  public pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    throw new Error('Cannot pay course that is already in a paying process.');
  }

  public async checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
    const { status } = await this.saga.rmqService.send<
      PaymentCheck.Request,
      PaymentCheck.Response
    >(PaymentCheck.topic, {
      courseId: this.saga.courseId,
      userId: this.saga.user._id,
    });

    if (status === 'canceled') {
      this.saga.setState(PurchaseState.Canceled, this.saga.courseId);
      return { user: this.saga.user, status: 'canceled' };
    }

    if (status !== 'success') {
      return { user: this.saga.user, status: 'progress' };
    }

    this.saga.setState(PurchaseState.Purchased, this.saga.courseId);
    return { user: this.saga.user, status: 'success' };
  }

  public cancel(): Promise<{ user: UserEntity }> {
    throw new Error(
      'Cannot cancel course that is already in a paying process.'
    );
  }
}

export class BuyCourseSagaStatePurchased extends BuyCourseSagaState {
  pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    throw new Error('Cannot pay course that is already purchased.');
  }

  checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
    throw new Error(
      'Cannot check payment of a course that is already purchased.'
    );
  }

  cancel(): Promise<{ user: UserEntity }> {
    throw new Error('Cannot cancel course that is already purchased.');
  }
}

export class BuyCourseSagaStateCanceled extends BuyCourseSagaState {
  pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    this.saga.setState(PurchaseState.Started, this.saga.courseId);
    return this.saga.getState().pay();
  }

  checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
    throw new Error('Cannot check payment of a course that is canceled.');
  }

  cancel(): Promise<{ user: UserEntity }> {
    throw new Error('Cannot cancel course that is canceled.');
  }
}
