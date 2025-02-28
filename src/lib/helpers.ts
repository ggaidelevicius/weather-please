/**
 * Merges two objects together.
 *
 * In case of overlapping keys, values from the `targetObj` are preserved, and those from the `sourceObj` are ignored.
 * Primarily used to merge the 'config' object in localStorage with a default or provided object.
 *
 * @param targetObj The primary object whose values should be preserved in case of key conflicts.
 * @param sourceObj The secondary object whose values will be used if no conflict exists.
 * @returns A new object resulting from the merge of the two input objects.
 */
export const mergeObjects = <T extends object, U extends object>(
	targetObj: T,
	sourceObj: U,
): T & Omit<U, keyof T> => {
	const mergedObject = { ...targetObj } as T & Omit<U, keyof T>

	;(Object.keys(sourceObj) as Array<keyof U>).forEach((key) => {
		if (!(key in targetObj)) {
			// Type assertion is safe here because we're adding keys not present in T
			//eslint-disable-next-line @typescript-eslint/no-explicit-any
			;(mergedObject as any)[key] = sourceObj[key]
		}
	})

	return mergedObject
}
