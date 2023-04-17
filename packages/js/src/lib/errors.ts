export { ErrorHandler } from "@formbricks/types/js";

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T, E>(value: T): Result<T, E> => ({ ok: true, value });

export const err = <E = Error>(error: E): Result<never, E> => ({
  ok: false,
  error,
});

export const wrap =
  <T, R>(fn: (value: T) => R) =>
  (result: Result<T>): Result<R> =>
    result.ok === true ? { ok: true, value: fn(result.value) } : result;

export interface Match<T, E extends Error, F1, F2> {
  Ok(value: T): F1;
  Err(error: E): F2;
}

export const match =
  <T, E extends Error, F1, F2>(matchers: Match<T, E, F1, F2>) =>
  (result: Result<T, E>) => {
    if (result.ok === true) {
      return matchers.Ok(result.value);
    }

    return matchers.Err(result.error);
  };

/* 
Usage: 
const test = () => {
  throw new Error("test");
};
  
const result = wrapThrows(test)();
if (result.ok === true) {
  console.log(result.value);
} else {
  console.log(result.error);
}
*/
export const wrapThrows =
  <T, A extends any[]>(fn: (...args: A) => T) =>
  (...args: A): Result<T> => {
    try {
      return {
        ok: true,
        value: fn(...args),
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  };
