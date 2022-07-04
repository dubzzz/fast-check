import { MusicPlayerCommand, MusicPlayerModel } from './MusicPlayerModel';
import { MusicPlayer } from '../src/MusicPlayer';
import * as assert from 'assert';

export class PlayCommand implements MusicPlayerCommand {
  check(m: MusicPlayerModel) {
    return true;
  }
  run(m: MusicPlayerModel, p: MusicPlayer) {
    p.play();
    m.isPlaying = true;
    assert.ok(p.playing());
  }
  toString() {
    return 'Play';
  }
}
