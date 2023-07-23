import {IsNumber, IsString} from 'class-validator';
import { ICourse } from '@school/interfaces';

export namespace PaymentGenerateLink {
  export const topic = 'payment.generate-link.command';

  export class Request {
    @IsString()
    courseId: string;

    @IsString()
    userId: string;

    @IsNumber()
    sum: number;
  }

  export class Response {
    paymentLink: string;
  }
}
