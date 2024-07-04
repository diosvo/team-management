import {HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Event, NavigationEnd, Router, RouterEvent} from '@angular/router';
import {distinctUntilChanged, filter, map, ReplaySubject, share, timer} from 'rxjs';

@Injectable()
export class QueryParamsService {
  constructor(private readonly router: Router) {}

  queryParams$ = (param: string) => {
    return this.router.events.pipe(
      // Only NavigateEnd events
      filter((e: Event | RouterEvent): e is NavigationEnd => e instanceof NavigationEnd),
      // Use Angular HttpParams to parse URL and extract query param
      map(({url}) => new HttpParams({fromString: url}).get(param)),
      // Only unique value
      distinctUntilChanged(),
      // Allow more customization compared to shareReplay
      share({
        connector: () => new ReplaySubject(1),
        resetOnError: true,
        resetOnComplete: false,
        // Wait one second after last subscriber unsubscribe
        resetOnRefCountZero: () => timer(1000),
      }),
    );
  };
}
