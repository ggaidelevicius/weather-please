import type { ConfigProps, HandleChange, HandleClick } from '@/pages/types'

export interface Location {
  suburb?: string;
  town?: string;
  village?: string;
  country?: string;
  state?: string;
  county?: string;
}

export interface Props {
  input: ConfigProps;
  handleChange: HandleChange;
  handleClick: HandleClick;
  config: ConfigProps;
}
