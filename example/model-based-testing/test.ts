import * as assert from 'assert';
import * as fc from '../../lib/fast-check';
import { Command } from './helpers/Command';
import { CommandExecutor } from './helpers/CommandExecutor';

import { MusicPlayer } from './MusicPlayer';

class MusicPlayerModel {
  isPlaying: boolean = false;
  numTracks: number = 0;
  tracksAlreadySeen: { [Key: string]: boolean } = {}; // our model forbid to append twice the same track
}
type MusicPlayerCommand = Command<MusicPlayerModel, MusicPlayer>;

class PlayCommand implements MusicPlayerCommand {
  checkPreconditions(m: MusicPlayerModel) {
    return true;
  }
  apply(m: MusicPlayerModel) {
    m.isPlaying = true;
  }
  run(m: MusicPlayerModel, p: MusicPlayer) {
    p.play();
    assert.ok(p.playing());
  }
  toString() {
    return 'Play';
  }
}
class PauseCommand implements MusicPlayerCommand {
  checkPreconditions(m: MusicPlayerModel) {
    return true;
  }
  apply(m: MusicPlayerModel) {
    m.isPlaying = false;
  }
  run(m: MusicPlayerModel, p: MusicPlayer) {
    p.pause();
    assert.ok(!p.playing());
  }
  toString() {
    return 'Pause';
  }
}
class NextCommand implements MusicPlayerCommand {
  checkPreconditions(m: MusicPlayerModel) {
    return true;
  }
  apply(m: MusicPlayerModel) {
    /**/
  }
  run(m: MusicPlayerModel, p: MusicPlayer) {
    const trackBefore = p.currentTrackName();
    p.next();
    assert.equal(p.playing(), m.isPlaying);
    if (m.numTracks === 1) {
      assert.equal(p.currentTrackName(), trackBefore);
    } else {
      assert.notEqual(p.currentTrackName(), trackBefore);
    }
  }
  toString() {
    return 'Next';
  }
}
class AddTrackCommand implements MusicPlayerCommand {
  constructor(readonly position: number, readonly trackName: string) {}
  checkPreconditions(m: MusicPlayerModel) {
    return !m.tracksAlreadySeen[this.trackName];
  }
  apply(m: MusicPlayerModel) {
    ++m.numTracks;
    m.tracksAlreadySeen[this.trackName] = true;
  }
  run(m: MusicPlayerModel, p: MusicPlayer) {
    const trackBefore = p.currentTrackName();
    p.addTrack(this.trackName, this.position % (m.numTracks + 1)); // old model
    assert.equal(p.playing(), m.isPlaying);
    assert.equal(p.currentTrackName(), trackBefore);
  }
  toString() {
    return `AddTrack(${this.position}, ${this.trackName})`;
  }
}

describe('MusicPlayer', () => {
  const TrackNameArb = fc.hexaString(1, 10);
  const CommandsArb: fc.Arbitrary<MusicPlayerCommand[]> = fc.array(
    fc.oneof(
      fc.constant(new PlayCommand()),
      fc.constant(new PauseCommand()),
      fc.constant(new NextCommand()),
      fc.record({ position: fc.nat(), trackName: TrackNameArb }).map(d => new AddTrackCommand(d.position, d.trackName))
    )
  );
  it('should run fast-check on model based approach', () =>
    fc.assert(
      fc.property(fc.set(TrackNameArb, 1, 10), CommandsArb, (initialTracks, commands) => {
        const real = new MusicPlayer(initialTracks);
        const model = new MusicPlayerModel();
        model.numTracks = initialTracks.length;
        for (const t of initialTracks) {
          model.tracksAlreadySeen[t] = true;
        }
        CommandExecutor(() => ({ model, real }), commands);
      })
    ));
});
