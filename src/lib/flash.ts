import { cookies } from 'next/headers';

export function setFlash(value: string, seconds = 10) {
  cookies().set({ name: 'flash', value, path: '/', maxAge: seconds });
}

export function clearFlash() {
  cookies().set({ name: 'flash', value: '', path: '/', maxAge: 0 });
}
