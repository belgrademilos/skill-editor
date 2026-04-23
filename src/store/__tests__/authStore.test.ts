import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/firebase', () => ({
  getFirebaseAuth: vi.fn(() => ({ __mock: 'auth' })),
  googleProvider: { __mock: 'googleProvider' },
  isFirebaseConfigured: true,
}));

const mocks = vi.hoisted(() => ({
  signInWithPopupMock: vi.fn(),
  signInWithRedirectMock: vi.fn(),
  signOutMock: vi.fn(),
  onAuthStateChangedMock: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mocks.onAuthStateChangedMock,
  signInWithPopup: mocks.signInWithPopupMock,
  signInWithRedirect: mocks.signInWithRedirectMock,
  signOut: mocks.signOutMock,
}));

type AuthModule = typeof import('../authStore');

async function loadFreshAuthStore(): Promise<AuthModule> {
  vi.resetModules();
  return (await import('../authStore')) as AuthModule;
}

describe('authStore', () => {
  beforeEach(() => {
    mocks.signInWithPopupMock.mockReset();
    mocks.signInWithRedirectMock.mockReset();
    mocks.signOutMock.mockReset();
    mocks.onAuthStateChangedMock.mockReset();
  });

  it('transitions to signed-in when auth listener fires with a user', async () => {
    const { useAuthStore, initAuthListener } = await loadFreshAuthStore();
    let capturedCallback: ((user: unknown) => void) | undefined;
    mocks.onAuthStateChangedMock.mockImplementation(((_auth: unknown, cb: (user: unknown) => void) => {
      capturedCallback = cb;
      return () => {};
    }) as never);

    initAuthListener();
    expect(useAuthStore.getState().status).toBe('loading');

    capturedCallback!({ uid: 'user-1', displayName: 'Alice' });
    const state = useAuthStore.getState();
    expect(state.status).toBe('signed-in');
    expect(state.user?.uid).toBe('user-1');
  });

  it('maps the Gmail avatar from Google provider data', async () => {
    const { useAuthStore, initAuthListener } = await loadFreshAuthStore();
    let capturedCallback: ((user: unknown) => void) | undefined;
    mocks.onAuthStateChangedMock.mockImplementation(((_auth: unknown, cb: (user: unknown) => void) => {
      capturedCallback = cb;
      return () => {};
    }) as never);

    initAuthListener();
    capturedCallback!({
      uid: 'user-1',
      displayName: null,
      email: null,
      photoURL: 'https://example.com/stale-avatar.png',
      providerData: [
        {
          providerId: 'google.com',
          displayName: 'Alice',
          email: 'alice@example.com',
          photoURL: 'https://lh3.googleusercontent.com/a/alice=s96-c',
        },
      ],
    });

    const state = useAuthStore.getState();
    expect(state.user).toMatchObject({
      displayName: 'Alice',
      email: 'alice@example.com',
      photoURL: 'https://lh3.googleusercontent.com/a/alice=s96-c',
    });
  });

  it('transitions to signed-out when auth listener fires with null', async () => {
    const { useAuthStore, initAuthListener } = await loadFreshAuthStore();
    let capturedCallback: ((user: unknown) => void) | undefined;
    mocks.onAuthStateChangedMock.mockImplementation(((_auth: unknown, cb: (user: unknown) => void) => {
      capturedCallback = cb;
      return () => {};
    }) as never);

    initAuthListener();
    capturedCallback!(null);
    expect(useAuthStore.getState().status).toBe('signed-out');
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('falls back to redirect when popup is blocked', async () => {
    const { useAuthStore } = await loadFreshAuthStore();
    mocks.signInWithPopupMock.mockRejectedValueOnce({ code: 'auth/popup-blocked' });
    mocks.signInWithRedirectMock.mockResolvedValueOnce(undefined);

    await useAuthStore.getState().signInWithGoogle();

    expect(mocks.signInWithPopupMock).toHaveBeenCalledTimes(1);
    expect(mocks.signInWithRedirectMock).toHaveBeenCalledTimes(1);
  });

  it('calls signOut when signOutUser is invoked', async () => {
    const { useAuthStore } = await loadFreshAuthStore();
    mocks.signOutMock.mockResolvedValueOnce(undefined);
    await useAuthStore.getState().signOutUser();
    expect(mocks.signOutMock).toHaveBeenCalledTimes(1);
  });
});
