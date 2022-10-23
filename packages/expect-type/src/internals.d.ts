export declare type Not<T> = T extends true ? false : true;
export declare type And<T, U> = T extends true ? (U extends true ? true : false) : false;
export declare type Or<T, U> = T extends false ? (U extends false ? false : true) : true;
export declare type IsNever<T> = [T] extends [never] ? true : false;
export declare type Extends<T, U> = T extends U ? true : false;
export declare type ExtendsString<T> = Extends<T, string> extends boolean
  ? boolean extends Extends<T, string>
    ? true
    : false
  : false; // Extends<T, string> is: false for unknown but boolean for any
export declare type IsUnknown<T> = And<
  And<Not<IsNever<T>>, Extends<T, unknown>>,
  And<Extends<unknown, T>, Not<ExtendsString<T>>>
>;
export declare type IsAny<T> = And<
  And<Not<IsNever<T>>, Not<IsUnknown<T>>>,
  And<Extends<T, any>, Extends<any, T> extends true ? true : false>
>;
export declare type IsSame<T, U> = [T, U] extends [U, T]
  ? Or<
      Or<And<IsAny<T>, IsAny<U>>, And<IsUnknown<T>, IsUnknown<U>>>,
      And<And<Not<IsAny<T>>, Not<IsAny<U>>>, And<Not<IsUnknown<T>>, Not<IsUnknown<U>>>>
    >
  : false;
