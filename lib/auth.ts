// Minimal server auth surface used by the demo routes.
// The app's client-side auth flow remains responsible for establishing sessions.
export const auth = {
  handler: {},
  api: {
    async getSession(_options: { headers: Headers }) {
      return null as { user: { id: string } } | null
    },
  },
}
