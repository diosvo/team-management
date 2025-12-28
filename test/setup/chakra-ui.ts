import { vi } from 'vitest';

// "ResizeObserver" mock
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// "matchMedia" mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// "IntersectionObserver" mock
const IntersectionObserverMock = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  takeRecords: vi.fn(),
  unobserve: vi.fn(),
}));
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// "Scroll" methods mock
window.Element.prototype.scrollTo = () => {};
window.Element.prototype.scrollIntoView = () => {};

// Store timer IDs for cleanup
const timerIds = new Set<number>();

// "requestAnimationFrame" mock - IMPORTANT for Chakra UI Popover/ActionBar
global.requestAnimationFrame = ((cb: FrameRequestCallback): number => {
  const id = setTimeout(() => {
    timerIds.delete(id as unknown as number);
    if (typeof window !== 'undefined') {
      cb(Date.now());
    }
  }, 0) as unknown as number;
  timerIds.add(id);
  return id;
}) as typeof requestAnimationFrame;

global.cancelAnimationFrame = ((id: number) => {
  timerIds.delete(id);
  clearTimeout(id);
}) as typeof cancelAnimationFrame;

// Clear all pending timers on cleanup
afterEach(() => {
  timerIds.forEach((id) => {
    clearTimeout(id);
  });
  timerIds.clear();
});

// "URL" object mock
window.URL.createObjectURL = () => 'https://i.pravatar.cc/300';
window.URL.revokeObjectURL = () => {};

// "navigator" mock
Object.defineProperty(window, 'navigator', {
  value: {
    clipboard: {
      writeText: vi.fn(),
    },
  },
});

// Mock "PointerEvent" for better Zag.js compatibility
if (!global.PointerEvent) {
  class PointerEvent extends MouseEvent {
    pointerId: number;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId || 0;
    }
  }
  global.PointerEvent = PointerEvent as any;
}
