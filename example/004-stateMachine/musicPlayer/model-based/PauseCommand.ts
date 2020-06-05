import { MusicPlayerCommand, MusicPlayerModel } from './MusicPlayerModel';
import { MusicPlayer } from '../src/MusicPlayer';
import * as assert from 'assert';

export class PauseCommand implements MusicPlayerCommand {
  check(m: MusicPlayerModel) {
    return true;
  }
  run(m: MusicPlayerModel, p: MusicPlayer) {
    p.pause();
    m.isPlaying = false;
    assert.ok(!p.playing());
  }
  toString() {
    return 'Pause';
  }
}
