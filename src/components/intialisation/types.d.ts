import type { ConfigProps, HandleChange, HandleClick } from '@/pages/types'
import type { Dispatch } from 'react'

export interface InitialisationProps {
  opened: boolean;
  geolocationError: boolean;
  handleClick: HandleClick;
  setLoading: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  input: ConfigProps;
  handleChange: HandleChange;
  close: () => void;
}
