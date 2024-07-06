import {ApplicationConfig, importProvidersFrom, provideZoneChangeDetection} from '@angular/core';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideRouter} from '@angular/router';

import {TUI_DATE_SEPARATOR} from '@taiga-ui/cdk';
import {TUI_SANITIZER, TuiAlertModule, TuiDialogModule, TuiRootModule} from '@taiga-ui/core';
import {TuiPdfViewerModule} from '@taiga-ui/kit';
import {NgDompurifySanitizer} from '@tinkoff/ng-dompurify';

import {TuiMobileDialogModule} from '@taiga-ui/addon-mobile';
import {STORAGE} from '@tm/common/storage/storage.service';
import {routes} from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    /* Angular */
    provideAnimations(),
    provideRouter(routes),
    provideZoneChangeDetection({eventCoalescing: true}),
    /* Libraries */
    {provide: TUI_SANITIZER, useClass: NgDompurifySanitizer},
    {provide: TUI_DATE_SEPARATOR, useValue: '/'},
    /* Customization */
    {provide: STORAGE, useValue: localStorage},
    /* Common */
    importProvidersFrom([
      TuiRootModule,
      TuiAlertModule,
      TuiDialogModule,
      TuiMobileDialogModule,
      TuiPdfViewerModule,
    ]),
  ],
};
