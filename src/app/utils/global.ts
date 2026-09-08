import { DestroyRef, inject } from "@angular/core";

export function registerClassOnWindow(key: string, value: any) {
  (window as any)[key] = value;
  const destroyRef = inject(DestroyRef);
  destroyRef.onDestroy(() => {
    delete (window as any)[key];
  });
}