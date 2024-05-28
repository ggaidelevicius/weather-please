export const register = async () => {
  await import('./sentry.edge.config')
  await import('./sentry.server.config')
}