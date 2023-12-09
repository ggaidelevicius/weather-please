import { Head, Html, Main, NextScript } from 'next/document'
import type { FC } from 'react'

const Document: FC<{}> = () => {
	return (
		<Html lang="en">
			<Head />
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	)
}

export default Document
