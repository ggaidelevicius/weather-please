type MagnifiedSizesParams = {
	distances: readonly number[]
	maxSize: number
	radius: number
	restSize: number
	totalGrowth: number
}

const MAGNIFICATION_WEIGHT_EXPONENT = 3

export const getMagnifiedSizes = ({
	distances,
	maxSize,
	radius,
	restSize,
	totalGrowth,
}: MagnifiedSizesParams): number[] => {
	const growthCapacity = maxSize - restSize
	if (growthCapacity <= 0 || radius <= 0 || totalGrowth <= 0) {
		return distances.map(() => restSize)
	}

	const weights = distances.map((distance) =>
		Math.pow(
			Math.max(0, 1 - Math.abs(distance) / radius),
			MAGNIFICATION_WEIGHT_EXPONENT,
		),
	)
	const growthFactors = distributeGrowth({
		target: totalGrowth / growthCapacity,
		weights,
	})

	return growthFactors.map(
		(growthFactor) => restSize + growthFactor * growthCapacity,
	)
}

const distributeGrowth = ({
	target,
	weights,
}: {
	target: number
	weights: readonly number[]
}) => {
	const factors = weights.map(() => 0)
	let remainingTarget = Math.min(
		target,
		weights.filter((weight) => weight > 0).length,
	)
	let remainingIndexes = weights
		.map((weight, index) => ({ index, weight }))
		.filter(({ weight }) => weight > 0)

	while (remainingIndexes.length > 0 && remainingTarget > 0) {
		const totalWeight = remainingIndexes.reduce(
			(sum, { weight }) => sum + weight,
			0,
		)
		const multiplier = remainingTarget / totalWeight
		const cappedIndexes = remainingIndexes.filter(
			({ weight }) => weight * multiplier >= 1,
		)

		if (cappedIndexes.length === 0) {
			for (const { index, weight } of remainingIndexes) {
				factors[index] = weight * multiplier
			}
			break
		}

		const cappedIndexSet = new Set(cappedIndexes.map(({ index }) => index))
		for (const { index } of cappedIndexes) {
			factors[index] = 1
		}
		remainingTarget -= cappedIndexes.length
		remainingIndexes = remainingIndexes.filter(
			({ index }) => !cappedIndexSet.has(index),
		)
	}

	return factors
}
