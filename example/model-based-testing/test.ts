import * as assert from 'assert';
import * as fc from '../../lib/fast-check';

import { MusicPlayer, MusicPlayerA, MusicPlayerB } from './MusicPlayer';

class MusicPlayerModel {
  isPlaying = false;
  numTracks = 0;
  tracksAlreadySeen: { [Key: string]: boolean } = {}; // our model forbid to append twice the same track
}
type MusicPlayerCommand = fc.Command<MusicPlayerModel, MusicPlayer>;

class PlayCommand implements MusicPlayerCommand {
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
class PauseCommand implements MusicPlayerCommand {
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
class NextCommand implements MusicPlayerCommand {
  check(m: MusicPlayerModel) {
    return true;
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
  check(m: MusicPlayerModel) {
    return !m.tracksAlreadySeen[this.trackName];
  }
  run(m: MusicPlayerModel, p: MusicPlayer) {
    const trackBefore = p.currentTrackName();
    p.addTrack(this.trackName, this.position % (m.numTracks + 1)); // old model
    assert.equal(p.playing(), m.isPlaying);
    assert.equal(p.currentTrackName(), trackBefore);
    ++m.numTracks;
    m.tracksAlreadySeen[this.trackName] = true;
  }
  toString() {
    return `AddTrack(${this.position}, "${this.trackName}")`;
  }
}

describe('MusicPlayer', () => {
  const TrackNameArb = fc.hexaString(1, 10);
  const CommandsArb = fc.commands([
    fc.constant(new PlayCommand()),
    fc.constant(new PauseCommand()),
    fc.constant(new NextCommand()),
    fc.record({ position: fc.nat(), trackName: TrackNameArb }).map(d => new AddTrackCommand(d.position, d.trackName))
  ]);
  it('should run fast-check on model based approach against MusicPlayerA', () =>
    fc.assert(
      fc.property(fc.set(TrackNameArb, 1, 10), CommandsArb, (initialTracks, commands) => {
        const real = new MusicPlayerA(initialTracks);
        const model = new MusicPlayerModel();
        model.numTracks = initialTracks.length;
        for (const t of initialTracks) {
          model.tracksAlreadySeen[t] = true;
        }
        fc.modelRun(() => ({ model, real }), commands);
      }),
      { verbose: true }
    ));
  it('should run fast-check on model based approach against MusicPlayerB', () =>
    fc.assert(
      fc.property(fc.set(TrackNameArb, 1, 10), CommandsArb, (initialTracks, commands) => {
        const real = new MusicPlayerB(initialTracks);
        const model = new MusicPlayerModel();
        model.numTracks = initialTracks.length;
        for (const t of initialTracks) {
          model.tracksAlreadySeen[t] = true;
        }
        fc.modelRun(() => ({ model, real }), commands);
      })
    ));
});
