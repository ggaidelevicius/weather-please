export enum CalendarAccountCategory {
	Family = 'family',
	Finance = 'finance',
	Freelance = 'freelance',
	Personal = 'personal',
	School = 'school',
	Work = 'work',
}

// Display order for category pickers.
export const CALENDAR_ACCOUNT_CATEGORIES = [
	CalendarAccountCategory.Personal,
	CalendarAccountCategory.Work,
	CalendarAccountCategory.School,
	CalendarAccountCategory.Family,
	CalendarAccountCategory.Freelance,
	CalendarAccountCategory.Finance,
] as const satisfies ReadonlyArray<CalendarAccountCategory>

// Static class names so the Tailwind compiler can see them.
export const CALENDAR_ACCOUNT_CATEGORY_STYLES = {
	[CalendarAccountCategory.Family]: {
		dotClassName: 'bg-amber-400',
		iconClassName: 'text-amber-300',
	},
	[CalendarAccountCategory.Finance]: {
		dotClassName: 'bg-rose-400',
		iconClassName: 'text-rose-300',
	},
	[CalendarAccountCategory.Freelance]: {
		dotClassName: 'bg-pink-400',
		iconClassName: 'text-pink-300',
	},
	[CalendarAccountCategory.Personal]: {
		dotClassName: 'bg-blue-400',
		iconClassName: 'text-blue-300',
	},
	[CalendarAccountCategory.School]: {
		dotClassName: 'bg-violet-400',
		iconClassName: 'text-violet-300',
	},
	[CalendarAccountCategory.Work]: {
		dotClassName: 'bg-emerald-400',
		iconClassName: 'text-emerald-300',
	},
} as const satisfies Record<
	CalendarAccountCategory,
	{ dotClassName: string; iconClassName: string }
>
