type Nullable<T> = T | null;
type Nullish<T> = Nullable<T> | undefined;

type Search<T> = {
  search: T;
  setSearch: React.Dispatch<React.SetStateAction<T>>;
};

type Selector<T> = {
  selection: T;
  onSelectionChange: (selected: T) => void;
};
