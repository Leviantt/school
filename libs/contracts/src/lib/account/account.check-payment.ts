import { IsString } from 'class-validator';
import { PurchaseState } from '@school/interfaces';

export namespace AccountCheckPayment {
  export const topic = 'account.check-payment.query';

  export class Request {
    @IsString()
    userId: string;

    @IsString()
    courseId: string;
  }

  export class Response {
    status: PurchaseState;
  }
}
