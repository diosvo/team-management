import {inject, Injectable, InjectionToken} from '@angular/core';

export const STORAGE = new InjectionToken<Storage>('Web Storage Injection Token');

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  readonly storage = inject(STORAGE);

  get<T>(key: string): T | null {
    const raw = this.storage.getItem(key);
    return raw == null ? raw : (JSON.parse(raw) as T);
  }

  set<T>(key: string, value: T | null): void {
    this.storage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }
}
