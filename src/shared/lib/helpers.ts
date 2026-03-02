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
	return { ...sourceObj, ...targetObj }
}
