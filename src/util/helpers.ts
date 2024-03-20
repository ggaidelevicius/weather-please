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
type MergeObjects = (
	// eslint-disable-next-line no-unused-vars
	targetObj: Record<keyof any, any>,
	// eslint-disable-next-line no-unused-vars
	sourceObj: Record<keyof any, any>,
) => Record<keyof any, any>

export const mergeObjects: MergeObjects = (targetObj, sourceObj) => {
	const mergedObject = { ...targetObj }

	Object.keys(sourceObj).forEach((key) => {
		if (!mergedObject.hasOwnProperty(key)) {
			mergedObject[key] = sourceObj[key]
		}
	})

	return mergedObject
}
