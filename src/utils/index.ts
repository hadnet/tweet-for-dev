export function nonNullable<T>(value: T): asserts value is NonNullable<T> {
  if (value == null) throw Error(`${value} is null or undefined`);
}
