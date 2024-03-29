

// taken from https://dev.to/lucianbc/union-type-merging-in-typescript-9al

export type Subtract<A, C> = A extends C ? never : A;
export type NonCommonKeys<T extends object> = Subtract<AllKeys<T>, CommonKeys<T>>;

export type CommonKeys<T extends object> = keyof T;

export type AllKeys<T> = T extends any ? keyof T : never;


export type Merge<T extends object> = {
  [k in CommonKeys<T>]: PickTypeOf<T, k>;
} &
  {
    [k in NonCommonKeys<T>]?: PickTypeOf<T, k>;
  };

export type PickType<T, K extends AllKeys<T>> = T extends { [k in K]?: any }
  ? T[K]
  : never;

export type PickTypeOf<T, K extends string | number | symbol> = K extends AllKeys<T>
  ? PickType<T, K>
  : never;


