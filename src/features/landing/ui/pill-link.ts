// Compact pill links, matching the header's "Add to Chrome" pill. They grow to
// a 44px touch target on phones.
const PILL_LINK_BASE_CLASS_NAME =
	'inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-9 sm:text-[13px]'

export const PRIMARY_PILL_LINK_CLASS_NAME = `${PILL_LINK_BASE_CLASS_NAME} bg-white text-dark-800 hover:bg-zinc-200`

export const SECONDARY_PILL_LINK_CLASS_NAME = `${PILL_LINK_BASE_CLASS_NAME} bg-white/8 text-dark-100 hover:bg-white/12 hover:text-white`
