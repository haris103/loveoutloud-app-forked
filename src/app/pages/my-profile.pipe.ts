import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'myProfile'
})
export class MyProfilePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
