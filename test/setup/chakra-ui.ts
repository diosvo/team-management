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

// "requestAnimationFrame" mock
window.requestAnimationFrame = (cb) => setTimeout(cb, 1000 / 60);
window.cancelAnimationFrame = (id) => clearTimeout(id);

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
