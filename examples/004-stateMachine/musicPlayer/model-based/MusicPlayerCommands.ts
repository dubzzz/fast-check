import fc from 'fast-check';
import { PlayCommand } from './PlayCommand';
import { PauseCommand } from './PauseCommand';
import { NextCommand } from './NextCommand';
import { AddTrackCommand } from './AddTrackCommand';

export const TrackNameArb = fc.string({ minLength: 1 });

export const MusicPlayerCommands = fc.commands([
  fc.constant(new PlayCommand()),
  fc.constant(new PauseCommand()),
  fc.constant(new NextCommand()),
  fc.record({ position: fc.nat(), trackName: TrackNameArb }).map((d) => new AddTrackCommand(d.position, d.trackName)),
]);
