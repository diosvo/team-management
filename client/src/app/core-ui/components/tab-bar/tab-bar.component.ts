import {ChangeDetectionStrategy, Component, Inject} from '@angular/core';
import {RouterModule} from '@angular/router';
import {
  TuiMobileDialogModule,
  TuiMobileDialogService,
  TuiTabBarModule,
} from '@taiga-ui/addon-mobile';
import {TUI_IS_MOBILE} from '@taiga-ui/cdk';
import {tap} from 'rxjs/operators';

interface Tab {
  icon: string;
  text: string;
  path: string;
}

@Component({
  standalone: true,
  selector: 'tm-tab-bar',
  templateUrl: './tab-bar.component.html',
  imports: [
    /* Angular */
    RouterModule,
    /* Taiga UI */
    TuiTabBarModule,
    TuiMobileDialogModule,
  ],
  providers: [
    {
      provide: TUI_IS_MOBILE,
      useValue: false,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabBarComponent {
  readonly items: Array<Tab> = [
    {
      text: 'Favorites',
      icon: 'tuiIconHeartLarge',
      path: '/',
    },
    {
      text: 'Profile',
      icon: 'tuiIconUserLarge',
      path: '/',
    },
    {
      text: 'Settings and configuration',
      icon: 'tuiIconSettingsLarge',
      path: '',
    },
    {
      text: 'More',
      icon: 'tuiIconMoreHorizontalLarge',
      path: '/',
    },
  ];

  constructor(
    @Inject(TuiMobileDialogService)
    private readonly dialogs: TuiMobileDialogService,
  ) {}

  onClick(): void {
    const actions = ['No thanks', 'Remind me later', 'Rate now'];

    this.dialogs
      .open('If you like this app, please take a moment to leave a positive rating.', {
        label: 'What do you think?',
        actions,
      })
      .pipe(tap(index => console.log(actions[index])))
      .subscribe();
  }
}
