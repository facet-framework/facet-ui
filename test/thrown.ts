/**
 * Catches the error of a call and returns it.
 *
 * A `try`/`catch` with `expect` inside the `catch` looks like a check but
 * is not one: if the call does not throw, the `catch` branch never runs, and the
 * test counts as passed although it checked nothing. Here every
 * `expect` stands outside, so it runs in every case.
 */
export function thrown(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  return null;
}
