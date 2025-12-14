type Nullable<T> = T | null;
type Nullish<T> = Nullable<T> | undefined;

type Selector<T> = {
  selection: T;
  onSelectionChange: (selected: T) => void;
};
