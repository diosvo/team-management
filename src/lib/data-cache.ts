type CacheTag = 'team' | 'user' | 'rule';

export function getGlobalTag(tag: CacheTag) {
  return `global:${tag}` as const;
}

export function getIdTag(tag: CacheTag, id: string) {
  return `id:${id}-${tag}` as const;
}
