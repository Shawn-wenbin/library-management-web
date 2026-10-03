export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: (sessionVersion: number) => ['auth', 'me', sessionVersion] as const,
  },
}
