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

declare type DeeperIsSame<T, U> = IsAny<T> extends false
  ? T extends object
    ? { [K in keyof (T | U)]: IsSame<T[K], U[K]> } extends { [K in keyof (T | U)]: true }
      ? true
      : false
    : true
  : false;

export declare type IsSame<T, U> = [T, U] extends [U, T]
  ? Or<
      // T and U are either both any or both unknown or both never
      // (T is any & U is any) OR (T is unknown & U is unknown)
      Or<Or<And<IsAny<T>, IsAny<U>>, And<IsUnknown<T>, IsUnknown<U>>>, And<IsNever<T>, IsNever<U>>>,
      // Neither T nor U is any or unknown and if they are objects their values are deeply equal
      And<
        // T is not any & U is not any & T is no unknown & U is not unknown & T is no never & U is not never
        And<
          And<And<Not<IsAny<T>>, Not<IsAny<U>>>, And<Not<IsUnknown<T>>, Not<IsUnknown<U>>>>,
          And<Not<IsNever<T>>, Not<IsNever<U>>>
        >,
        // T and U are deeply equal
        DeeperIsSame<T, U>
      >
    >
  : false;
