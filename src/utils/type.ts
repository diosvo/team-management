export interface Option<T> {
  label: string;
  value: T;
  max?: number;
  description?: string;
}
export type Selection<T> = Array<Option<T>>;
