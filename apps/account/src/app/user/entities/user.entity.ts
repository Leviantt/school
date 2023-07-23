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

  public addCourse(courseId: string) {
    const courseExists = this.courses.find((c) => c._id === courseId);
    if (courseExists) {
      throw new Error('Course to add is already added.');
    }
    this.courses.push({
      courseId,
      purchaseState: PurchaseState.Started,
    });
  }

  public deleteCourse(courseId: string) {
    this.courses = this.courses.filter((c) => c._id !== courseId);
  }

  public updateCoursePurchaseState(courseId: string, purchaseState: PurchaseState) {
    this.courses = this.courses.map((c) => {
      if (c._id === courseId) {
        return { ...c, purchaseState };
      }
      return c;
    });
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
