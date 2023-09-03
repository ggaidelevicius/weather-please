export interface TileProps {
  readonly day: number;
  readonly max: number;
  readonly min: number;
  readonly description: string;
  readonly icon: string;
  readonly wind: number;
  readonly rain: number;
  readonly uv: number;
  readonly useMetric: boolean;
  readonly index: number;
  readonly identifier: 'day' | 'date';
}

export type Day =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export type Month =
  | 'January'
  | 'February'
  | 'March'
  | 'April'
  | 'May'
  | 'June'
  | 'July'
  | 'August'
  | 'September'
  | 'October'
  | 'November'
  | 'December';
