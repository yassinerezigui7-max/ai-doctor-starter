import type { OrderPayload } from "@/types";

/**
 * localStorage helpers — never throw (private mode, quota, SSR all degrade
 * to no-ops). Two keys: the live form draft and the offline pending queue.
 */
const DRAFT_KEY = "casquette:draft";
const PENDING_KEY = "casquette:pending";

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export interface DraftShape {
  name?: string;
  phone?: string;
  wilaya?: string;
  commune?: string;
  color?: string;
  quantity?: number;
  deliveryType?: string;
}

export const draftStorage = {
  load: (): DraftShape | null => read<DraftShape>(DRAFT_KEY),
  save: (draft: DraftShape): void => write(DRAFT_KEY, draft),
  clear: (): void => remove(DRAFT_KEY),
};

export const pendingStorage = {
  load: (): OrderPayload[] => read<OrderPayload[]>(PENDING_KEY) ?? [],
  push: (payload: OrderPayload): void => {
    const queue = pendingStorage.load();
    if (!queue.some((p) => p.orderId === payload.orderId)) {
      write(PENDING_KEY, [...queue, payload]);
    }
  },
  remove: (orderId: string): void => {
    const rest = pendingStorage.load().filter((p) => p.orderId !== orderId);
    if (rest.length === 0) remove(PENDING_KEY);
    else write(PENDING_KEY, rest);
  },
};
