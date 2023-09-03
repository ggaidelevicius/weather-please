import type { ConfigProps, HandleChange, HandleClick } from '@/util/types'

export interface Location {
  suburb?: string;
  town?: string;
  village?: string;
  country?: string;
  state?: string;
  county?: string;
}

export interface SettingsProps {
  readonly input: ConfigProps;
  readonly handleChange: HandleChange;
  readonly handleClick: HandleClick;
  readonly config: ConfigProps;
}
