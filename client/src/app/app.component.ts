import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {TuiRootModule} from '@taiga-ui/core';

@Component({
  selector: 'tm-root',
  standalone: true,
  imports: [RouterOutlet, TuiRootModule],
  template: `<tui-root><router-outlet /></tui-root>`,
})
export class AppComponent {}
