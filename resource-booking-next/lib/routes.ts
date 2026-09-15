/**
 * The in-app destinations we navigate to programmatically.
 *
 * `typedRoutes` is on, so `redirect()` and `<Link href>` only accept literal
 * route strings. Keeping them in one union means a renamed folder breaks the
 * build here instead of producing a dead link at runtime.
 */
export type AppPath =
  | "/"
  | "/sign-in"
  | "/user"
  | "/user/availability"
  | "/user/history"
  | "/user/waiting-request"
  | "/admin"
  | "/admin/availability"
  | "/admin/seminar"
  | "/admin/resource"
  | "/admin/resource/guest-house";
