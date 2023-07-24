import {
  IUser,
  IUserCourse,
  PurchaseState,
  UserRole,
} from '@school/interfaces';
import { compare, genSalt, hash } from 'bcrypt';

export class UserEntity implements IUser {
  _id: string;
  displayName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  courses?: IUserCourse[];

  constructor(user: IUser) {
    this._id = user._id;
    this.displayName = user.displayName;
    this.passwordHash = user.passwordHash;
    this.email = user.email;
    this.role = user.role;
    this.courses = user.courses;
  }

  public setCoursePurchaseState(
    courseId: string,
    purchaseState: PurchaseState
  ) {
    const courseExists = this.courses.find((c) => c._id === courseId);
    if (!courseExists) {
      this.courses.push({
        courseId,
        purchaseState,
      });
      return this;
    }
    if (purchaseState === PurchaseState.Canceled) {
      this.courses = this.courses.filter((c) => c._id !== courseId);
      return this;
    }
    this.courses = this.courses.map((c) => {
      if (c._id === courseId) {
        return { ...c, purchaseState };
      }
      return c;
    });
    return this;
  }

  public getPublicProfile() {
    return {
      email: this.email,
      role: this.role,
      displayName: this.displayName,
    };
  }

  public async setPassword(password: string): Promise<this> {
    const salt = await genSalt(10);
    this.passwordHash = await hash(password, salt);
    return this;
  }

  public validatePassword(password: string): Promise<boolean> {
    return compare(password, this.passwordHash);
  }

  public updateProfile(displayName: string) {
    this.displayName = displayName;
    return this;
  }
}
