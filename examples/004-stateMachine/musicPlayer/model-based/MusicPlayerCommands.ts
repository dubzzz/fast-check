import fc from 'fast-check';
import { PlayCommand } from './PlayCommand.js';
import { PauseCommand } from './PauseCommand.js';
import { NextCommand } from './NextCommand.js';
import { AddTrackCommand } from './AddTrackCommand.js';

export const TrackNameArb = fc.string({ minLength: 1 });

export const MusicPlayerCommands = fc.commands([
  fc.constant(new PlayCommand()),
  fc.constant(new PauseCommand()),
  fc.constant(new NextCommand()),
  fc.record({ position: fc.nat(), trackName: TrackNameArb }).map((d) => new AddTrackCommand(d.position, d.trackName)),
]);
