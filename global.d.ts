type Nullable<T> = T | null;
type Nullish<T> = Nullable<T> | undefined;

type Selector<T> = {
  disabled?: boolean;
  selection: T;
  onSelectionChange: (selected: T) => void;
};

type Image = string | Blob | undefined;
