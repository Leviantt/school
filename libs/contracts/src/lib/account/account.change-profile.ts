import { IsObject, IsString } from 'class-validator';
import { IUser } from '@school/interfaces';

export namespace AccountChangeProfile {
  export const topic = 'account.change-profile.command';

  export class Request {
    @IsString()
    id: string;

    @IsObject()
    user: Pick<IUser, 'displayName'>;
  }

  export class Response {}
}
