import fc from 'fast-check';
import { MusicPlayer } from '../src/MusicPlayer';

export class MusicPlayerModel {
  isPlaying = false;
  numTracks = 0;
  tracksAlreadySeen: { [Key: string]: boolean } = {}; // our model forbid to append twice the same track
}

export type MusicPlayerCommand = fc.Command<MusicPlayerModel, MusicPlayer>;
