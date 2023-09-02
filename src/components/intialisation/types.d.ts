import type { ConfigProps, HandleChange, HandleClick } from '@/pages/types'
import type { Dispatch } from 'react'

export interface InitialisationProps {
  readonly opened: boolean;
  readonly geolocationError: boolean;
  readonly handleClick: HandleClick;
  readonly setLoading: Dispatch<SetStateAction<boolean>>;
  readonly loading: boolean;
  readonly input: ConfigProps;
  readonly handleChange: HandleChange;
  readonly close: () => void;
}
