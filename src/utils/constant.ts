import { v4 as uuidV4 } from 'uuid';

export const UUID = uuidV4();

// 1 hour
export const EXPIRES_AT = new Date(new Date().getTime() + 3600 * 1000);
