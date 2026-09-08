import { MyProfilePipe } from './my-profile.pipe';

describe('MyProfilePipe', () => {
  it('create an instance', () => {
    const pipe = new MyProfilePipe();
    expect(pipe).toBeTruthy();
  });
});
