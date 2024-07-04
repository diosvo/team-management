import {PageNotFoundComponent} from './404.component';

describe('404', () => {
  test('renders without crashing', () => {
    const component = new PageNotFoundComponent();
    expect(component).toBeTruthy();
  });
});
