import type { Config } from '@/pages'
import { Field, Select as HeadlessSelect, Label } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Trans } from '@lingui/react/macro'
import type { ChangeEventHandler, ComponentPropsWithoutRef } from 'react'

interface SelectProps {
	label: string
	value: string | number | readonly string[]
	options: { value: string; label: string }[]
	onChange: ChangeEventHandler<HTMLSelectElement>
}

export const Select = ({
	label,
	value,
	onChange,
	options,
}: Readonly<
	Omit<ComponentPropsWithoutRef<'select'>, 'onChange' | 'value'> & SelectProps
>) => (
	<Field>
		<Label className="block text-sm font-medium text-white">
			<Trans>{label}</Trans>
		</Label>
		<div className="relative mt-2">
			<HeadlessSelect
				className="block w-full appearance-none rounded-sm bg-dark-700 px-3 py-1.5 text-base text-dark-100 outline-1 -outline-offset-1 outline-dark-400 placeholder:text-dark-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 sm:text-sm/6"
				aria-label={label}
				value={value}
				onChange={onChange}
			>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</HeadlessSelect>
			<ChevronDownIcon
				className="group pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60"
				aria-hidden="true"
			/>
		</div>
	</Field>
)
